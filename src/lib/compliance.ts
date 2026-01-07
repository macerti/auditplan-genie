/**
 * Compliance calculation module
 * 
 * Handles all audit constraint verification:
 * - Time overlap detection for auditors
 * - Daily hour limit enforcement (7h/day)
 * - Manday budget tracking
 * 
 * This is the core business logic for audit planning constraints.
 */

import { 
  Auditor, 
  AuditSegment, 
  ComplianceIssue, 
  ComplianceStatus, 
  AuditorSummary,
  HOURS_PER_DAY_LIMIT,
  HOURS_PER_MANDAY,
  formatHours,
  formatTimeLabel
} from '@/types/audit';
import { getWorstStatus } from '@/lib/statusUtils';

// ============================================================================
// Constants
// ============================================================================

/** Threshold for warning before hitting daily limit (in hours before limit) */
const DAILY_WARNING_THRESHOLD = 1;

/** Threshold for warning before hitting manday limit (as percentage) */
const MANDAY_WARNING_THRESHOLD = 0.9;

// ============================================================================
// Overlap Detection
// ============================================================================

/**
 * Check if two time ranges overlap
 * 
 * @param startA - Start of first range
 * @param endA - End of first range
 * @param startB - Start of second range
 * @param endB - End of second range
 * @returns true if ranges overlap
 */
function rangesOverlap(
  startA: number, 
  endA: number, 
  startB: number, 
  endB: number
): boolean {
  return startA < endB && startB < endA;
}

/**
 * Check for time overlaps for a specific auditor
 * An auditor cannot be assigned to multiple segments at the same time
 * 
 * @param auditorId - The auditor to check
 * @param segments - All segments to search
 * @returns Array of overlap issues found
 */
export function checkAuditorOverlaps(
  auditorId: string,
  segments: AuditSegment[]
): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];
  
  // Get all segments assigned to this auditor
  const auditorSegments = segments.filter(s => s.auditorIds.includes(auditorId));

  // Compare each pair of segments for overlaps
  for (let i = 0; i < auditorSegments.length; i++) {
    for (let j = i + 1; j < auditorSegments.length; j++) {
      const segA = auditorSegments[i];
      const segB = auditorSegments[j];

      // Only check segments on the same date
      if (segA.date !== segB.date) continue;

      const startA = segA.startHour;
      const endA = segA.startHour + segA.duration;
      const startB = segB.startHour;
      const endB = segB.startHour + segB.duration;

      // Check for overlap
      if (rangesOverlap(startA, endA, startB, endB)) {
        issues.push({
          type: 'overlap',
          severity: 'violation',
          message: `Overlap: ${formatTimeLabel(startA)}-${formatTimeLabel(endA)} conflicts with ${formatTimeLabel(startB)}-${formatTimeLabel(endB)}`,
          auditorId,
          segmentId: segA.id
        });
      }
    }
  }

  return issues;
}

// ============================================================================
// Auditor Summary Calculation
// ============================================================================

/**
 * Calculate comprehensive compliance summary for an auditor
 * 
 * Checks:
 * - Total hours and mandays used
 * - Daily hour breakdown
 * - Time overlaps
 * - Daily limit violations/warnings
 * - Manday limit violations/warnings
 * 
 * @param auditor - The auditor to analyze
 * @param segments - All segments to search
 * @returns Complete summary with issues and status
 */
export function calculateAuditorSummary(
  auditor: Auditor,
  segments: AuditSegment[]
): AuditorSummary {
  // Find all segments where this auditor is assigned
  const auditorSegments = segments.filter(s => s.auditorIds.includes(auditor.id));
  
  // Accumulate hours
  const dailyHours: Record<string, number> = {};
  let totalHours = 0;
  const issues: ComplianceIssue[] = [];

  // Sum up hours by date
  auditorSegments.forEach(segment => {
    totalHours += segment.duration;
    dailyHours[segment.date] = (dailyHours[segment.date] || 0) + segment.duration;
  });

  // Check for time overlaps
  const overlapIssues = checkAuditorOverlaps(auditor.id, segments);
  overlapIssues.forEach(issue => {
    // Avoid duplicate messages
    if (!issues.some(i => i.message === issue.message)) {
      issues.push(issue);
    }
  });

  // Check daily limits
  Object.entries(dailyHours).forEach(([date, hours]) => {
    if (hours > HOURS_PER_DAY_LIMIT) {
      issues.push({
        type: 'daily_limit',
        severity: 'violation',
        message: `${date}: ${formatHours(hours)} exceeds ${HOURS_PER_DAY_LIMIT}h limit`,
        auditorId: auditor.id
      });
    } else if (hours > HOURS_PER_DAY_LIMIT - DAILY_WARNING_THRESHOLD) {
      issues.push({
        type: 'daily_limit',
        severity: 'warning',
        message: `${date}: ${formatHours(hours)} approaching daily limit`,
        auditorId: auditor.id
      });
    }
  });

  // Calculate mandays
  const mandaysUsed = totalHours / HOURS_PER_MANDAY;

  // Check manday limits
  if (mandaysUsed > auditor.maxMandays) {
    issues.push({
      type: 'manday_exceeded',
      severity: 'violation',
      message: `${mandaysUsed.toFixed(2)} mandays exceeds limit of ${auditor.maxMandays}`,
      auditorId: auditor.id
    });
  } else if (mandaysUsed > auditor.maxMandays * MANDAY_WARNING_THRESHOLD) {
    issues.push({
      type: 'manday_exceeded',
      severity: 'warning',
      message: `${mandaysUsed.toFixed(2)} mandays approaching limit of ${auditor.maxMandays}`,
      auditorId: auditor.id
    });
  }

  // Determine overall status
  const status = getWorstStatus(issues.map(i => i.severity));

  return {
    auditorId: auditor.id,
    totalHours,
    mandaysUsed,
    maxMandays: auditor.maxMandays,
    dailyHours,
    issues,
    status
  };
}

// ============================================================================
// Segment Compliance Status
// ============================================================================

/**
 * Determine the compliance status of a single segment
 * Based on all auditors assigned to it and their summaries
 * 
 * @param segment - The segment to check
 * @param auditors - All auditors
 * @param summaries - Pre-calculated auditor summaries
 * @returns The most severe status affecting this segment
 */
export function getSegmentComplianceStatus(
  segment: AuditSegment,
  auditors: Auditor[],
  summaries: AuditorSummary[]
): ComplianceStatus {
  // No auditors assigned = violation
  if (segment.auditorIds.length === 0) return 'violation';

  let worstStatus: ComplianceStatus = 'valid';

  for (const auditorId of segment.auditorIds) {
    const auditor = auditors.find(a => a.id === auditorId);
    
    // Unknown auditor = violation
    if (!auditor) return 'violation';

    const summary = summaries.find(s => s.auditorId === auditorId);
    
    if (summary) {
      const dayHours = summary.dailyHours[segment.date] || 0;
      
      // Check for violations
      if (dayHours > HOURS_PER_DAY_LIMIT) return 'violation';
      if (summary.mandaysUsed > auditor.maxMandays) return 'violation';
      if (summary.issues.some(i => i.type === 'overlap')) return 'violation';
      
      // Check for warnings
      if (dayHours > HOURS_PER_DAY_LIMIT - DAILY_WARNING_THRESHOLD || 
          summary.mandaysUsed > auditor.maxMandays * MANDAY_WARNING_THRESHOLD) {
        worstStatus = 'warning';
      }
    }
  }

  return worstStatus;
}
