/**
 * Daily Audit Metrics Module
 * 
 * Calculates KPIs for daily audit presence from the auditee's perspective:
 * - Presence: Total covered time (union of all segment intervals)
 * - Window span: Time from first to last segment
 * - Gaps: Idle time within the window
 * - Idle time: Gaps beyond the tolerated 1h lunch break
 * 
 * These metrics help ensure the audit schedule meets required presence hours.
 */

import { AuditSegment, Auditor, ComplianceStatus, formatTimeLabel } from '@/types/audit';

// ============================================================================
// Types
// ============================================================================

/** Time interval with start and end hours */
interface TimeInterval {
  start: number;
  end: number;
}

/**
 * Daily audit metrics for compliance reporting
 */
export interface DailyAuditMetrics {
  /** Date in YYYY-MM-DD format */
  date: string;

  /** Total audit presence (union of all segment intervals, no double-counting) */
  presence: number;

  /** Required presence for this day (7h normally, partial on last day) */
  requiredPresence: number;

  /** Whether this is a partial day (last day with fractional mandays) */
  isPartialDay: boolean;

  /** Elapsed window from first segment start to last segment end */
  windowSpan: number;
  windowStart: number;
  windowEnd: number;

  /** Total gaps within the window (windowSpan - presence) */
  totalGaps: number;

  /** Idle time beyond the tolerated 1h lunch gap */
  idleTime: number;
  lunchDeducted: boolean;

  /** Compliance status for presence (must equal required) */
  presenceStatus: ComplianceStatus;

  /** Status for idle time (warning if gaps exceed lunch) */
  idleStatus: ComplianceStatus;
}

// ============================================================================
// Constants
// ============================================================================

/** Standard full day presence requirement */
const FULL_DAY_PRESENCE_HOURS = 7;

/** Tolerated lunch break duration */
const LUNCH_DEDUCTION_HOURS = 1;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate required presence for the last day based on auditor mandays
 * A fractional manday (e.g., 3.5) means the last day is partial
 * 
 * @param auditors - List of auditors to check
 * @returns Required hours for the last day
 */
function getLastDayRequiredPresence(auditors: Auditor[]): number {
  if (auditors.length === 0) return FULL_DAY_PRESENCE_HOURS;
  
  // Find the longest max manday allocation
  const maxMandays = Math.max(...auditors.map(a => a.maxMandays));
  
  // Get the decimal part (e.g., 3.5 -> 0.5)
  const decimal = maxMandays % 1;
  
  // Full day if no decimal
  if (decimal === 0) return FULL_DAY_PRESENCE_HOURS;
  
  // Convert decimal to hours (0.25 = 1.75h, 0.5 = 3.5h, 0.75 = 5.25h)
  return decimal * FULL_DAY_PRESENCE_HOURS;
}

/**
 * Merge overlapping time intervals into non-overlapping union
 * Used to calculate total presence without double-counting parallel segments
 * 
 * @param intervals - Array of time intervals
 * @returns Merged non-overlapping intervals
 */
function mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  if (intervals.length === 0) return [];
  
  // Sort by start time
  const sorted = [...intervals].sort((a, b) => a.start - b.start);

  const merged: TimeInterval[] = [{ ...sorted[0] }];
  
  for (let i = 1; i < sorted.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = sorted[i];

    // If overlapping or adjacent, extend previous interval
    if (curr.start <= prev.end) {
      prev.end = Math.max(prev.end, curr.end);
    } else {
      // No overlap, add new interval
      merged.push({ ...curr });
    }
  }

  return merged;
}

// ============================================================================
// Core Calculation Functions
// ============================================================================

/**
 * Calculate daily audit presence for a specific date
 * 
 * @param segments - All segments
 * @param date - Date string (YYYY-MM-DD)
 * @returns Presence metrics for the day
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
  // Filter to segments on this date
  const daySegments = segments.filter(s => s.date === date);

  if (daySegments.length === 0) {
    return { presence: 0, windowSpan: 0, start: 0, end: 0, totalGaps: 0 };
  }

  // Convert segments to time intervals
  const intervals: TimeInterval[] = daySegments.map(s => ({
    start: s.startHour,
    end: s.startHour + s.duration
  }));

  // Calculate window (earliest start to latest end)
  const start = Math.min(...intervals.map(i => i.start));
  const end = Math.max(...intervals.map(i => i.end));
  const windowSpan = end - start;

  // Merge overlapping intervals and sum their durations
  const merged = mergeIntervals(intervals);
  const presence = merged.reduce((sum, i) => sum + (i.end - i.start), 0);

  // Gaps = window span minus actual presence
  const totalGaps = Math.max(0, windowSpan - presence);

  return { presence, windowSpan, start, end, totalGaps };
}

/**
 * Calculate idle audit time (gaps beyond tolerated lunch)
 * 
 * @param totalGaps - Total gap hours in the day
 * @returns Idle time and whether lunch was deducted
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
 * Get complete daily metrics for a specific date
 * 
 * @param segments - All segments
 * @param date - Date string (YYYY-MM-DD)
 * @param isLastDay - Whether this is the last audit day
 * @param auditors - Auditors (for partial day calculation)
 * @returns Complete daily metrics with status
 */
export function getDailyMetrics(
  segments: AuditSegment[], 
  date: string,
  isLastDay: boolean = false,
  auditors: Auditor[] = []
): DailyAuditMetrics {
  const { presence, windowSpan, start, end, totalGaps } = calculateDailyAuditPresence(segments, date);
  const { idleTime, lunchDeducted } = calculateIdleAuditTime(totalGaps);

  // Determine if this is a partial day
  const isPartialDay = isLastDay && auditors.length > 0 && 
    Math.max(...auditors.map(a => a.maxMandays)) % 1 !== 0;
  
  const requiredPresence = isPartialDay 
    ? getLastDayRequiredPresence(auditors) 
    : FULL_DAY_PRESENCE_HOURS;

  // Determine presence status
  let presenceStatus: ComplianceStatus = 'valid';
  if (presence > 0) {
    presenceStatus = presence === requiredPresence ? 'valid' : 'violation';
  }

  // Idle time creates a warning (optimization opportunity)
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
 * 
 * @param segments - All segments
 * @param dates - Array of audit dates
 * @param auditors - Auditors (for partial day calculation)
 * @returns Metrics for each date
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

// ============================================================================
// Formatting
// ============================================================================

/**
 * Format a time window for display (e.g., "08H00 → 16H00")
 * 
 * @param start - Start hour
 * @param end - End hour
 * @returns Formatted time span string
 */
export function formatSpan(start: number, end: number): string {
  return `${formatTimeLabel(start)} → ${formatTimeLabel(end)}`;
}
