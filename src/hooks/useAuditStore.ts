import { useState, useCallback } from 'react';
import { ISOStandard, Auditor, Process, AuditSegment, AuditorSummary, TIME_INCREMENT, roundToIncrement } from '@/types/audit';
import { calculateAuditorSummary } from '@/lib/compliance';

const ALL_STANDARDS: ISOStandard[] = ['ISO 9001', 'ISO 14001', 'ISO 45001'];

export function useAuditStore() {
  const [selectedStandards, setSelectedStandards] = useState<ISOStandard[]>(['ISO 9001']);
  const [auditors, setAuditors] = useState<Auditor[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [segments, setSegments] = useState<AuditSegment[]>([]);
  const [auditDays, setAuditDays] = useState<number>(3);

  const toggleStandard = useCallback((standard: ISOStandard) => {
    setSelectedStandards(prev => 
      prev.includes(standard) 
        ? prev.filter(s => s !== standard)
        : [...prev, standard]
    );
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
    })).filter(s => s.auditorIds.length > 0)); // Remove segments with no auditors
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
    return auditors.map(auditor => calculateAuditorSummary(auditor, segments, processes));
  }, [auditors, segments, processes]);

  return {
    allStandards: ALL_STANDARDS,
    selectedStandards,
    toggleStandard,
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
    auditDays,
    setAuditDays,
    getAuditorSummaries
  };
}
