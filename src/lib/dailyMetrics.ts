import { AuditSegment, ComplianceStatus } from '@/types/audit';

export interface DailyAuditMetrics {
  date: string;

  /**
   * Total audit presence for the auditee (union of all segment time intervals).
   * Parallel segments are NOT double-counted.
   */
  presence: number;

  /**
   * Elapsed window from first segment start to last segment end.
   * This is only used for display + gap calculation.
   */
  windowSpan: number;
  windowStart: number;
  windowEnd: number;

  /**
   * Total gaps within the window (windowSpan - presence).
   * Includes lunch and any other idle gaps.
   */
  totalGaps: number;

  /**
   * Idle time beyond the tolerated 1h lunch gap.
   */
  idleTime: number;
  lunchDeducted: boolean;

  /**
   * Compliance for daily audit presence (auditee perspective).
   * - presence === 7h => OK
   * - presence > 7h => violation
   * - presence < 7h => violation (per user requirement)
   */
  presenceStatus: ComplianceStatus;

  /**
   * Idle time is optimization only - warning when gaps exceed lunch.
   */
  idleStatus: ComplianceStatus;
}

const REQUIRED_PRESENCE_HOURS = 7;
const LUNCH_DEDUCTION_HOURS = 1;

function mergeIntervals(intervals: Array<{ start: number; end: number }>) {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a.start - b.start);

  const merged: Array<{ start: number; end: number }> = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = sorted[i];

    if (curr.start <= prev.end) {
      prev.end = Math.max(prev.end, curr.end);
    } else {
      merged.push({ ...curr });
    }
  }

  return merged;
}

/**
 * Daily audit presence for a given date.
 * Presence = total covered time (union) across all segments.
 */
export function calculateDailyAuditPresence(
  segments: AuditSegment[],
  date: string
): {
  presence: number;
  windowSpan: number;
  start: number;
  end: number;
  totalGaps: number;
} {
  const daySegments = segments.filter(s => s.date === date);

  if (daySegments.length === 0) {
    return { presence: 0, windowSpan: 0, start: 0, end: 0, totalGaps: 0 };
  }

  const intervals = daySegments.map(s => ({
    start: s.startHour,
    end: s.startHour + s.duration
  }));

  const start = Math.min(...intervals.map(i => i.start));
  const end = Math.max(...intervals.map(i => i.end));
  const windowSpan = end - start;

  const merged = mergeIntervals(intervals);
  const presence = merged.reduce((sum, i) => sum + (i.end - i.start), 0);

  const totalGaps = Math.max(0, windowSpan - presence);

  return { presence, windowSpan, start, end, totalGaps };
}

/**
 * Idle Audit Time (optimization KPI)
 * = gaps within the day window minus a tolerated 1h lunch.
 */
export function calculateIdleAuditTime(totalGaps: number): {
  idleTime: number;
  lunchDeducted: boolean;
} {
  const lunchDeducted = totalGaps >= LUNCH_DEDUCTION_HOURS;
  const idleTime = Math.max(0, totalGaps - LUNCH_DEDUCTION_HOURS);
  return { idleTime, lunchDeducted };
}

/**
 * Get all daily metrics for a specific date
 */
export function getDailyMetrics(segments: AuditSegment[], date: string): DailyAuditMetrics {
  const { presence, windowSpan, start, end, totalGaps } = calculateDailyAuditPresence(segments, date);
  const { idleTime, lunchDeducted } = calculateIdleAuditTime(totalGaps);

  let presenceStatus: ComplianceStatus = 'valid';
  if (presence > 0) {
    presenceStatus = presence === REQUIRED_PRESENCE_HOURS ? 'valid' : 'violation';
  }

  const idleStatus: ComplianceStatus = idleTime > 0 ? 'warning' : 'valid';

  return {
    date,
    presence,
    windowSpan,
    windowStart: start,
    windowEnd: end,
    totalGaps,
    idleTime,
    lunchDeducted,
    presenceStatus,
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
 * Format window for display
 */
export function formatSpan(start: number, end: number): string {
  const formatTime = (hour: number): string => {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}H${m.toString().padStart(2, '0')}`;
  };
  return `${formatTime(start)} → ${formatTime(end)}`;
}

