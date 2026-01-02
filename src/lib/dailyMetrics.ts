import { AuditSegment, formatHours, ComplianceStatus } from '@/types/audit';

export interface DailyAuditMetrics {
  date: string;
  span: number; // in hours
  spanStart: number; // earliest segment start
  spanEnd: number; // latest segment end
  idleTime: number; // gaps minus 1h lunch
  lunchDeducted: boolean;
  spanStatus: ComplianceStatus;
  idleStatus: ComplianceStatus;
}

const SPAN_LIMIT = 7; // Maximum audit span in hours
const LUNCH_DEDUCTION = 1; // 1 hour lunch deduction

/**
 * Calculate Daily Audit Span (section 6.3)
 * = max(segment_end) - min(segment_start) for a given day
 * Accreditor-mandated KPI: span > 7h = violation
 */
export function calculateDailyAuditSpan(segments: AuditSegment[], date: string): { span: number; start: number; end: number } {
  const daySegments = segments.filter(s => s.date === date);
  
  if (daySegments.length === 0) {
    return { span: 0, start: 0, end: 0 };
  }
  
  const startTimes = daySegments.map(s => s.startHour);
  const endTimes = daySegments.map(s => s.startHour + s.duration);
  
  const spanStart = Math.min(...startTimes);
  const spanEnd = Math.max(...endTimes);
  const span = spanEnd - spanStart;
  
  return { span, start: spanStart, end: spanEnd };
}

/**
 * Calculate Idle Audit Time (section 6.4)
 * = sum of all gaps between consecutive segments within span, minus 1h lunch
 * This is an optimization KPI, not a compliance violation
 */
export function calculateIdleAuditTime(segments: AuditSegment[], date: string): { idleTime: number; lunchDeducted: boolean } {
  const daySegments = segments
    .filter(s => s.date === date)
    .sort((a, b) => a.startHour - b.startHour);
  
  if (daySegments.length <= 1) {
    return { idleTime: 0, lunchDeducted: false };
  }
  
  // Calculate all gaps between consecutive segments
  let totalGaps = 0;
  for (let i = 0; i < daySegments.length - 1; i++) {
    const currentEnd = daySegments[i].startHour + daySegments[i].duration;
    const nextStart = daySegments[i + 1].startHour;
    
    if (nextStart > currentEnd) {
      totalGaps += nextStart - currentEnd;
    }
  }
  
  // Deduct 1h for lunch if there are enough gaps
  const lunchDeducted = totalGaps >= LUNCH_DEDUCTION;
  const idleTime = Math.max(0, totalGaps - LUNCH_DEDUCTION);
  
  return { idleTime, lunchDeducted };
}

/**
 * Get all daily metrics for a specific date
 */
export function getDailyMetrics(segments: AuditSegment[], date: string): DailyAuditMetrics {
  const { span, start, end } = calculateDailyAuditSpan(segments, date);
  const { idleTime, lunchDeducted } = calculateIdleAuditTime(segments, date);
  
  // Span > 7h is a violation (accreditor-mandated)
  const spanStatus: ComplianceStatus = span === 0 ? 'valid' : span > SPAN_LIMIT ? 'violation' : 'valid';
  
  // Idle time is optimization only - warning if > 0
  const idleStatus: ComplianceStatus = idleTime > 0 ? 'warning' : 'valid';
  
  return {
    date,
    span,
    spanStart: start,
    spanEnd: end,
    idleTime,
    lunchDeducted,
    spanStatus,
    idleStatus
  };
}

/**
 * Get metrics for all audit dates
 */
export function getAllDailyMetrics(segments: AuditSegment[], dates: Date[]): DailyAuditMetrics[] {
  const { format } = require('date-fns');
  return dates.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return getDailyMetrics(segments, dateStr);
  });
}

/**
 * Format span for display
 */
export function formatSpan(start: number, end: number): string {
  const formatTime = (hour: number): string => {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}H${m.toString().padStart(2, '0')}`;
  };
  return `${formatTime(start)} → ${formatTime(end)}`;
}
