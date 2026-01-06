import { useState, useCallback, useEffect } from 'react';
import { Auditor, Process, AuditSegment, AuditorSummary, TIME_INCREMENT, roundToIncrement } from '@/types/audit';
import { calculateAuditorSummary } from '@/lib/compliance';
import { format } from 'date-fns';

const STORAGE_KEY = 'audit-calculator-data';

interface StoredState {
  auditors: Auditor[];
  processes: Process[];
  segments: AuditSegment[];
  auditDates: string[];
  selectedDate: string | null;
}

function loadFromStorage(): Partial<StoredState> | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveToStorage(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable
  }
}

// Default realistic French process names
const defaultProcesses: Process[] = [
  { id: 'default-1', name: 'Réunion d\'ouverture' },
  { id: 'default-2', name: 'Management DG' },
  { id: 'default-3', name: 'Ressources Humaines' },
  { id: 'default-4', name: 'Achats' },
  { id: 'default-5', name: 'Amélioration' },
];

export function useAuditStore() {
  // Lazy initialization - only load from storage once on mount
  const [auditors, setAuditors] = useState<Auditor[]>(() => {
    const stored = loadFromStorage();
    return stored?.auditors ?? [];
  });
  const [processes, setProcesses] = useState<Process[]>(() => {
    const stored = loadFromStorage();
    return stored?.processes ?? defaultProcesses;
  });
  const [segments, setSegments] = useState<AuditSegment[]>(() => {
    const stored = loadFromStorage();
    return stored?.segments ?? [];
  });
  const [auditDates, setAuditDates] = useState<Date[]>(() => {
    const stored = loadFromStorage();
    return stored?.auditDates?.map(d => new Date(d)) ?? [];
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    const stored = loadFromStorage();
    return stored?.selectedDate ? new Date(stored.selectedDate) : null;
  });

  const addAuditDate = useCallback((date: Date) => {
    setAuditDates(prev => {
      const exists = prev.some(d => format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
      if (exists) return prev;
      const newDates = [...prev, date].sort((a, b) => a.getTime() - b.getTime());
      // Auto-select first date if none selected
      if (!selectedDate) {
        setSelectedDate(newDates[0]);
      }
      return newDates;
    });
  }, [selectedDate]);

  const removeAuditDate = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    setAuditDates(prev => {
      const filtered = prev.filter(d => format(d, 'yyyy-MM-dd') !== dateStr);
      
      // Update selected date if needed (using setTimeout to avoid nested setState)
      setTimeout(() => {
        setSelectedDate(current => {
          if (current && format(current, 'yyyy-MM-dd') === dateStr) {
            return filtered.length > 0 ? filtered[0] : null;
          }
          return current;
        });
      }, 0);
      
      return filtered;
    });
    
    // Remove segments on this date
    setSegments(prev => prev.filter(s => s.date !== dateStr));
  }, []);

  const addAuditor = useCallback((auditor: Omit<Auditor, 'id'>) => {
    setAuditors(prev => [...prev, { ...auditor, id: crypto.randomUUID() }]);
  }, []);

  const updateAuditor = useCallback((id: string, updates: Partial<Auditor>) => {
    setAuditors(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const removeAuditor = useCallback((id: string) => {
    setAuditors(prev => prev.filter(a => a.id !== id));
    // Remove auditor from all segments
    setSegments(prev => prev.map(s => ({
      ...s,
      auditorIds: s.auditorIds.filter(aId => aId !== id)
    })).filter(s => s.auditorIds.length > 0));
  }, []);

  const addProcess = useCallback((process: Omit<Process, 'id'>) => {
    setProcesses(prev => [...prev, { ...process, id: crypto.randomUUID() }]);
  }, []);

  const updateProcess = useCallback((id: string, updates: Partial<Process>) => {
    setProcesses(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const removeProcess = useCallback((id: string) => {
    setProcesses(prev => prev.filter(p => p.id !== id));
    setSegments(prev => prev.filter(s => s.processId !== id));
  }, []);

  const addSegment = useCallback((segment: Omit<AuditSegment, 'id'>) => {
    // Ensure time values are rounded to increments
    const normalizedSegment = {
      ...segment,
      startHour: roundToIncrement(segment.startHour),
      duration: Math.max(TIME_INCREMENT, roundToIncrement(segment.duration)),
      id: crypto.randomUUID()
    };
    setSegments(prev => [...prev, normalizedSegment]);
  }, []);

  const updateSegment = useCallback((id: string, updates: Partial<AuditSegment>) => {
    setSegments(prev => prev.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, ...updates };
      // Ensure time values are rounded
      if (updates.startHour !== undefined) {
        updated.startHour = roundToIncrement(updates.startHour);
      }
      if (updates.duration !== undefined) {
        updated.duration = Math.max(TIME_INCREMENT, roundToIncrement(updates.duration));
      }
      return updated;
    }));
  }, []);

  const removeSegment = useCallback((id: string) => {
    setSegments(prev => prev.filter(s => s.id !== id));
  }, []);

  const getAuditorSummaries = useCallback((): AuditorSummary[] => {
    return auditors.map(auditor => calculateAuditorSummary(auditor, segments));
  }, [auditors, segments]);

  // Persist to localStorage on state changes
  useEffect(() => {
    saveToStorage({
      auditors,
      processes,
      segments,
      auditDates: auditDates.map(d => d.toISOString()),
      selectedDate: selectedDate?.toISOString() ?? null,
    });
  }, [auditors, processes, segments, auditDates, selectedDate]);

  return {
    auditors,
    addAuditor,
    updateAuditor,
    removeAuditor,
    processes,
    addProcess,
    updateProcess,
    removeProcess,
    segments,
    addSegment,
    updateSegment,
    removeSegment,
    auditDates,
    addAuditDate,
    removeAuditDate,
    selectedDate,
    setSelectedDate,
    getAuditorSummaries
  };
}
