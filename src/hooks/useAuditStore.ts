/**
 * useAuditStore - Central state management hook for the audit application
 * 
 * Manages:
 * - Auditors (team members with manday limits)
 * - Processes (audit activities to schedule)
 * - Segments (scheduled audit blocks with time, date, and assignments)
 * - Audit dates (selected days for the audit)
 * 
 * Features:
 * - Automatic persistence to localStorage
 * - Lazy initialization for performance
 * - Time value normalization to 0.25h increments
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Auditor, Process, AuditSegment, AuditorSummary, TIME_INCREMENT, roundToIncrement } from '@/types/audit';
import { calculateAuditorSummary } from '@/lib/compliance';
import { toDateStr } from '@/lib/dateUtils';
import { findById, removeById, updateById, filterByIds } from '@/lib/arrayUtils';

// ============================================================================
// Storage Configuration
// ============================================================================

/** LocalStorage key for persisting audit data */
const STORAGE_KEY = 'audit-calculator-data';

/**
 * Shape of data stored in localStorage — and also the shape used when
 * saving/loading a named plan to/from the MariaDB backend (see
 * src/lib/api.ts). Exported so both layers share a single source of truth.
 */
export interface StoredState {
  auditors: Auditor[];
  processes: Process[];
  segments: AuditSegment[];
  auditDates: string[];        // ISO date strings
  selectedDate: string | null; // ISO date string or null
}

/**
 * Load stored state from localStorage
 * Returns null if no data exists or parsing fails
 */
function loadFromStorage(): StoredState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Save state to localStorage
 * Silently fails if storage is full or unavailable
 */
function saveToStorage(state: StoredState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable - fail silently
  }
}

// ============================================================================
// Default Data
// ============================================================================

/** Default processes shown when no data is stored */
const DEFAULT_PROCESSES: Process[] = [
  { id: 'default-1', name: 'Réunion d\'ouverture' },
  { id: 'default-2', name: 'Management DG' },
  { id: 'default-3', name: 'Ressources Humaines' },
  { id: 'default-4', name: 'Achats' },
  { id: 'default-5', name: 'Amélioration' },
];

/**
 * Initialize state from storage (runs once on mount)
 * Parses stored data and converts date strings back to Date objects
 */
function getInitialState() {
  const stored = loadFromStorage();
  
  return {
    auditors: stored?.auditors ?? [],
    processes: stored?.processes ?? DEFAULT_PROCESSES,
    segments: stored?.segments ?? [],
    auditDates: stored?.auditDates?.map(d => new Date(d)) ?? [],
    selectedDate: stored?.selectedDate ? new Date(stored.selectedDate) : null,
  };
}

// ============================================================================
// Main Hook
// ============================================================================

export function useAuditStore() {
  // Lazy initialization - only loads from storage once on mount
  const [state] = useState(getInitialState);
  
  const [auditors, setAuditors] = useState<Auditor[]>(state.auditors);
  const [processes, setProcesses] = useState<Process[]>(state.processes);
  const [segments, setSegments] = useState<AuditSegment[]>(state.segments);
  const [auditDates, setAuditDates] = useState<Date[]>(state.auditDates);
  const [selectedDate, setSelectedDate] = useState<Date | null>(state.selectedDate);

  // ==========================================================================
  // Date Management
  // ==========================================================================

  /**
   * Add a new audit date
   * - Prevents duplicates
   * - Sorts dates chronologically
   * - Auto-selects first date if none selected
   */
  const addAuditDate = useCallback((date: Date) => {
    const dateStr = toDateStr(date);
    
    setAuditDates(prev => {
      // Check for duplicates
      if (prev.some(d => toDateStr(d) === dateStr)) {
        return prev;
      }
      
      // Add and sort chronologically
      const newDates = [...prev, date].sort((a, b) => a.getTime() - b.getTime());
      
      // Auto-select first date if none selected
      if (!selectedDate) {
        setSelectedDate(newDates[0]);
      }
      
      return newDates;
    });
  }, [selectedDate]);

  /**
   * Remove an audit date
   * - Removes all segments on that date
   * - Updates selected date if needed
   */
  const removeAuditDate = useCallback((date: Date) => {
    const dateStr = toDateStr(date);
    
    setAuditDates(prev => {
      const filtered = prev.filter(d => toDateStr(d) !== dateStr);
      
      // Update selected date if the removed date was selected
      setTimeout(() => {
        setSelectedDate(current => {
          if (current && toDateStr(current) === dateStr) {
            return filtered.length > 0 ? filtered[0] : null;
          }
          return current;
        });
      }, 0);
      
      return filtered;
    });
    
    // Remove all segments on this date
    setSegments(prev => prev.filter(s => s.date !== dateStr));
  }, []);

  // ==========================================================================
  // Auditor Management
  // ==========================================================================

  /**
   * Add a new auditor with auto-generated UUID
   */
  const addAuditor = useCallback((auditor: Omit<Auditor, 'id'>) => {
    const newAuditor: Auditor = { ...auditor, id: crypto.randomUUID() };
    setAuditors(prev => [...prev, newAuditor]);
  }, []);

  /**
   * Update an existing auditor's properties
   */
  const updateAuditor = useCallback((id: string, updates: Partial<Auditor>) => {
    setAuditors(prev => updateById(prev, id, updates));
  }, []);

  /**
   * Remove an auditor and clean up their segment assignments
   * - Removes auditor from all segments
   * - Deletes segments with no remaining auditors
   */
  const removeAuditor = useCallback((id: string) => {
    setAuditors(prev => removeById(prev, id));
    
    // Remove auditor from all segment assignments
    setSegments(prev => prev
      .map(s => ({ ...s, auditorIds: s.auditorIds.filter(aId => aId !== id) }))
      .filter(s => s.auditorIds.length > 0) // Delete segments with no auditors
    );
  }, []);

  // ==========================================================================
  // Process Management
  // ==========================================================================

  /**
   * Add a new process with auto-generated UUID
   */
  const addProcess = useCallback((process: Omit<Process, 'id'>) => {
    const newProcess: Process = { ...process, id: crypto.randomUUID() };
    setProcesses(prev => [...prev, newProcess]);
  }, []);

  /**
   * Update an existing process's properties
   */
  const updateProcess = useCallback((id: string, updates: Partial<Process>) => {
    setProcesses(prev => updateById(prev, id, updates));
  }, []);

  /**
   * Remove a process and all its segments
   */
  const removeProcess = useCallback((id: string) => {
    setProcesses(prev => removeById(prev, id));
    setSegments(prev => prev.filter(s => s.processId !== id));
  }, []);

  // ==========================================================================
  // Segment Management
  // ==========================================================================

  /**
   * Normalize segment time values to valid increments
   */
  const normalizeSegment = (segment: Omit<AuditSegment, 'id'>): AuditSegment => ({
    ...segment,
    startHour: roundToIncrement(segment.startHour),
    duration: Math.max(TIME_INCREMENT, roundToIncrement(segment.duration)),
    id: crypto.randomUUID()
  });

  /**
   * Add a new segment with normalized time values
   */
  const addSegment = useCallback((segment: Omit<AuditSegment, 'id'>) => {
    const normalizedSegment = normalizeSegment(segment);
    setSegments(prev => [...prev, normalizedSegment]);
  }, []);

  /**
   * Update an existing segment with normalized time values
   */
  const updateSegment = useCallback((id: string, updates: Partial<AuditSegment>) => {
    setSegments(prev => prev.map(s => {
      if (s.id !== id) return s;
      
      const updated = { ...s, ...updates };
      
      // Normalize time values if they were updated
      if (updates.startHour !== undefined) {
        updated.startHour = roundToIncrement(updates.startHour);
      }
      if (updates.duration !== undefined) {
        updated.duration = Math.max(TIME_INCREMENT, roundToIncrement(updates.duration));
      }
      
      return updated;
    }));
  }, []);

  /**
   * Remove a segment by ID
   */
  const removeSegment = useCallback((id: string) => {
    setSegments(prev => removeById(prev, id));
  }, []);

  // ==========================================================================
  // Computed Values
  // ==========================================================================

  /**
   * Calculate compliance summaries for all auditors
   * Memoized for performance
   */
  const getAuditorSummaries = useCallback((): AuditorSummary[] => {
    return auditors.map(auditor => calculateAuditorSummary(auditor, segments));
  }, [auditors, segments]);

  // ==========================================================================
  // Persistence
  // ==========================================================================

  /**
   * Persist state to localStorage whenever it changes
   */
  useEffect(() => {
    saveToStorage({
      auditors,
      processes,
      segments,
      auditDates: auditDates.map(d => d.toISOString()),
      selectedDate: selectedDate?.toISOString() ?? null,
    });
  }, [auditors, processes, segments, auditDates, selectedDate]);

  /**
   * Export the current working state as a plain serializable snapshot.
   * Used to save the current plan to the MariaDB backend (see PlanBar).
   */
  const exportSnapshot = useCallback((): StoredState => ({
    auditors,
    processes,
    segments,
    auditDates: auditDates.map(d => d.toISOString()),
    selectedDate: selectedDate ? selectedDate.toISOString() : null,
  }), [auditors, processes, segments, auditDates, selectedDate]);

  /**
   * Replace the entire working state with a snapshot loaded from the
   * MariaDB backend (or a blank one for "New plan"). Does not touch
   * localStorage directly — the persistence effect above will pick up
   * the change and save it as the new local draft automatically.
   */
  const loadSnapshot = useCallback((snapshot: StoredState) => {
    setAuditors(snapshot.auditors ?? []);
    setProcesses(snapshot.processes ?? DEFAULT_PROCESSES);
    setSegments(snapshot.segments ?? []);
    setAuditDates((snapshot.auditDates ?? []).map(d => new Date(d)));
    setSelectedDate(snapshot.selectedDate ? new Date(snapshot.selectedDate) : null);
  }, []);

  // ==========================================================================
  // Return API
  // ==========================================================================

  return {
    // Auditors
    auditors,
    addAuditor,
    updateAuditor,
    removeAuditor,
    
    // Processes
    processes,
    addProcess,
    updateProcess,
    removeProcess,
    
    // Segments
    segments,
    addSegment,
    updateSegment,
    removeSegment,
    
    // Dates
    auditDates,
    addAuditDate,
    removeAuditDate,
    selectedDate,
    setSelectedDate,
    
    // Computed
    getAuditorSummaries,

    // Backend save/load (MariaDB)
    exportSnapshot,
    loadSnapshot
  };
}
