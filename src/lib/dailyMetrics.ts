import { AuditSegment, Auditor, ComplianceStatus, formatTimeLabel } from '@/types/audit';

export interface DailyAuditMetrics {
  date: string;

  /**
   * Total audit presence for the auditee (union of all segment time intervals).
   * Parallel segments are NOT double-counted.
   */
  presence: number;

  /**
   * Required presence for this day (7h normally, partial on last day based on auditor mandays)
   */
  requiredPresence: number;

  /**
   * Whether this is a partial day (last day with fractional mandays)
   */
  isPartialDay: boolean;

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
   * - presence === requiredPresence => OK
   * - presence > requiredPresence => violation
   * - presence < requiredPresence => violation
   */
  presenceStatus: ComplianceStatus;

  /**
   * Idle time is optimization only - warning when gaps exceed lunch.
   */
  idleStatus: ComplianceStatus;
}

const FULL_DAY_PRESENCE_HOURS = 7;
const LUNCH_DEDUCTION_HOURS = 1;

/**
 * Get the required presence for the last day based on longest auditor's max manday decimal
 */
function getLastDayRequiredPresence(auditors: Auditor[]): number {
  if (auditors.length === 0) return FULL_DAY_PRESENCE_HOURS;
  
  // Find the longest max manday
  const maxMandays = Math.max(...auditors.map(a => a.maxMandays));
  
  // Get the decimal part
  const decimal = maxMandays % 1;
  
  // If no decimal, it's a full day
  if (decimal === 0) return FULL_DAY_PRESENCE_HOURS;
  
  // Convert decimal to hours (0.25 = 1.75h, 0.5 = 3.5h, 0.75 = 5.25h)
  return decimal * FULL_DAY_PRESENCE_HOURS;
}

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
 * Get daily metrics for a specific date
 * @param isLastDay - whether this is the last audit day (allows partial presence)
 * @param auditors - list of auditors (used to determine partial day requirement)
 */
export function getDailyMetrics(
  segments: AuditSegment[], 
  date: string,
  isLastDay: boolean = false,
  auditors: Auditor[] = []
): DailyAuditMetrics {
  const { presence, windowSpan, start, end, totalGaps } = calculateDailyAuditPresence(segments, date);
  const { idleTime, lunchDeducted } = calculateIdleAuditTime(totalGaps);

  // Determine required presence
  const isPartialDay = isLastDay && auditors.length > 0 && 
    Math.max(...auditors.map(a => a.maxMandays)) % 1 !== 0;
  
  const requiredPresence = isPartialDay 
    ? getLastDayRequiredPresence(auditors) 
    : FULL_DAY_PRESENCE_HOURS;

  let presenceStatus: ComplianceStatus = 'valid';
  if (presence > 0) {
    presenceStatus = presence === requiredPresence ? 'valid' : 'violation';
  }

  const idleStatus: ComplianceStatus = idleTime > 0 ? 'warning' : 'valid';

  return {
    date,
    presence,
    requiredPresence,
    isPartialDay,
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
export function getAllDailyMetrics(
  segments: AuditSegment[], 
  dates: Date[],
  auditors: Auditor[] = []
): DailyAuditMetrics[] {
  return dates.map((date, index) => {
    const dateStr = date.toISOString().split('T')[0];
    const isLastDay = index === dates.length - 1;
    return getDailyMetrics(segments, dateStr, isLastDay, auditors);
  });
}

/**
 * Format window for display using shared formatTimeLabel
 */
export function formatSpan(start: number, end: number): string {
  return `${formatTimeLabel(start)} → ${formatTimeLabel(end)}`;
}
