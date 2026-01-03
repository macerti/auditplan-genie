import { AuditSegment, formatHours, ComplianceStatus } from '@/types/audit';

export interface DailyAuditMetrics {
  date: string;
  span: number; // elapsed time from first segment start to last segment end
  effectiveAuditTime: number; // sum of all segment durations (actual audit time)
  spanStart: number; // earliest segment start
  spanEnd: number; // latest segment end
  totalGaps: number; // all gaps between segments
  idleTime: number; // gaps minus 1h lunch
  lunchDeducted: boolean;
  spanStatus: ComplianceStatus; // based on effective audit time and span with lunch
  idleStatus: ComplianceStatus;
}

const EFFECTIVE_AUDIT_LIMIT = 7; // Maximum effective audit hours (segments only)
const SPAN_WITH_LUNCH_LIMIT = 8; // 7h audit + 1h lunch gap = 8h span allowed
const LUNCH_DEDUCTION = 1; // 1 hour lunch deduction

/**
 * Calculate Daily Audit Span and Effective Audit Time (section 6.3)
 * span = max(segment_end) - min(segment_start) for a given day
 * effectiveAuditTime = sum of all segment durations
 * 
 * Compliance rule:
 * - If effectiveAuditTime > 7h → violation (too much actual audit)
 * - If span > 8h → violation (even with lunch, presence is too long)
 * - If span ≤ 8h AND effectiveAuditTime ≤ 7h AND there's ≥1h gap → compliant
 */
export function calculateDailyAuditSpan(segments: AuditSegment[], date: string): { 
  span: number; 
  start: number; 
  end: number; 
  effectiveAuditTime: number;
} {
  const daySegments = segments.filter(s => s.date === date);
  
  if (daySegments.length === 0) {
    return { span: 0, start: 0, end: 0, effectiveAuditTime: 0 };
  }
  
  const startTimes = daySegments.map(s => s.startHour);
  const endTimes = daySegments.map(s => s.startHour + s.duration);
  
  const spanStart = Math.min(...startTimes);
  const spanEnd = Math.max(...endTimes);
  const span = spanEnd - spanStart;
  
  // Sum of all segment durations = effective audit time
  const effectiveAuditTime = daySegments.reduce((sum, s) => sum + s.duration, 0);
  
  return { span, start: spanStart, end: spanEnd, effectiveAuditTime };
}

/**
 * Calculate Idle Audit Time (section 6.4)
 * = sum of all gaps between consecutive segments within span, minus 1h lunch
 * This is an optimization KPI, not a compliance violation
 */
export function calculateIdleAuditTime(segments: AuditSegment[], date: string): { 
  idleTime: number; 
  lunchDeducted: boolean;
  totalGaps: number;
} {
  const daySegments = segments
    .filter(s => s.date === date)
    .sort((a, b) => a.startHour - b.startHour);
  
  if (daySegments.length <= 1) {
    return { idleTime: 0, lunchDeducted: false, totalGaps: 0 };
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
  
  return { idleTime, lunchDeducted, totalGaps };
}

/**
 * Get all daily metrics for a specific date
 */
export function getDailyMetrics(segments: AuditSegment[], date: string): DailyAuditMetrics {
  const { span, start, end, effectiveAuditTime } = calculateDailyAuditSpan(segments, date);
  const { idleTime, lunchDeducted, totalGaps } = calculateIdleAuditTime(segments, date);
  
  // Compliance logic:
  // 1. Effective audit time (sum of segments) must be ≤ 7h
  // 2. Total span can be up to 8h if there's at least 1h gap for lunch
  // 3. If span > 8h → violation (too long presence even with lunch)
  // 4. If effective audit > 7h → violation (too much actual audit time)
  // 5. If span is 7-8h but no lunch gap (totalGaps < 1h) → violation
  let spanStatus: ComplianceStatus = 'valid';
  
  if (span > 0) {
    if (effectiveAuditTime > EFFECTIVE_AUDIT_LIMIT) {
      // More than 7h of actual audit work
      spanStatus = 'violation';
    } else if (span > SPAN_WITH_LUNCH_LIMIT) {
      // Presence longer than 8h even with lunch
      spanStatus = 'violation';
    } else if (span > EFFECTIVE_AUDIT_LIMIT && totalGaps < LUNCH_DEDUCTION) {
      // Span is 7-8h but no proper lunch gap
      spanStatus = 'violation';
    }
    // Otherwise valid: span ≤ 8h with proper lunch gap, or span ≤ 7h
  }
  
  // Idle time is optimization only - warning if > 0 (gaps beyond lunch)
  const idleStatus: ComplianceStatus = idleTime > 0 ? 'warning' : 'valid';
  
  return {
    date,
    span,
    effectiveAuditTime,
    spanStart: start,
    spanEnd: end,
    totalGaps,
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
