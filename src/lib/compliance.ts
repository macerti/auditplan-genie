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

// Check for time overlaps for a specific auditor
export function checkAuditorOverlaps(
  auditorId: string,
  segments: AuditSegment[]
): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];
  const auditorSegments = segments.filter(s => s.auditorIds.includes(auditorId));

  for (let i = 0; i < auditorSegments.length; i++) {
    for (let j = i + 1; j < auditorSegments.length; j++) {
      const segA = auditorSegments[i];
      const segB = auditorSegments[j];

      if (segA.date !== segB.date) continue;

      const startA = segA.startHour;
      const endA = segA.startHour + segA.duration;
      const startB = segB.startHour;
      const endB = segB.startHour + segB.duration;

      // Check for overlap
      if (startA < endB && startB < endA) {
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

export function calculateAuditorSummary(
  auditor: Auditor,
  segments: AuditSegment[]
): AuditorSummary {
  // Find all segments where this auditor is assigned
  const auditorSegments = segments.filter(s => s.auditorIds.includes(auditor.id));
  const dailyHours: Record<string, number> = {};
  let totalHours = 0;
  const issues: ComplianceIssue[] = [];

  auditorSegments.forEach(segment => {
    // Each auditor consumes the full duration individually
    totalHours += segment.duration;
    dailyHours[segment.date] = (dailyHours[segment.date] || 0) + segment.duration;
  });

  // Check for time overlaps
  const overlapIssues = checkAuditorOverlaps(auditor.id, segments);
  overlapIssues.forEach(issue => {
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
    } else if (hours > HOURS_PER_DAY_LIMIT - 1) {
      issues.push({
        type: 'daily_limit',
        severity: 'warning',
        message: `${date}: ${formatHours(hours)} approaching daily limit`,
        auditorId: auditor.id
      });
    }
  });

  const mandaysUsed = totalHours / HOURS_PER_MANDAY;

  // Check manday limits
  if (mandaysUsed > auditor.maxMandays) {
    issues.push({
      type: 'manday_exceeded',
      severity: 'violation',
      message: `${mandaysUsed.toFixed(2)} mandays exceeds limit of ${auditor.maxMandays}`,
      auditorId: auditor.id
    });
  } else if (mandaysUsed > auditor.maxMandays * 0.9) {
    issues.push({
      type: 'manday_exceeded',
      severity: 'warning',
      message: `${mandaysUsed.toFixed(2)} mandays approaching limit of ${auditor.maxMandays}`,
      auditorId: auditor.id
    });
  }

  let status: ComplianceStatus = 'valid';
  if (issues.some(i => i.severity === 'violation')) {
    status = 'violation';
  } else if (issues.some(i => i.severity === 'warning')) {
    status = 'warning';
  }

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

export function getSegmentComplianceStatus(
  segment: AuditSegment,
  auditors: Auditor[],
  summaries: AuditorSummary[]
): ComplianceStatus {
  if (segment.auditorIds.length === 0) return 'violation';

  let worstStatus: ComplianceStatus = 'valid';

  for (const auditorId of segment.auditorIds) {
    const auditor = auditors.find(a => a.id === auditorId);
    if (!auditor) {
      return 'violation';
    }

    const summary = summaries.find(s => s.auditorId === auditorId);
    if (summary) {
      const dayHours = summary.dailyHours[segment.date] || 0;
      if (dayHours > HOURS_PER_DAY_LIMIT) return 'violation';
      if (summary.mandaysUsed > auditor.maxMandays) return 'violation';
      
      // Check for overlaps
      if (summary.issues.some(i => i.type === 'overlap')) return 'violation';
      
      if (dayHours > HOURS_PER_DAY_LIMIT - 1 || summary.mandaysUsed > auditor.maxMandays * 0.9) {
        worstStatus = 'warning';
      }
    }
  }

  return worstStatus;
}
