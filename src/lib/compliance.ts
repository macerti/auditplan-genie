import { Auditor, Process, AuditSegment, ComplianceIssue, ComplianceStatus, AuditorSummary } from '@/types/audit';

const HOURS_PER_DAY_LIMIT = 7;
const HOURS_PER_MANDAY = 7;

export function checkAuditorQualification(
  auditor: Auditor,
  process: Process
): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];

  // Check ISO standard qualifications
  const missingStandards = process.requiredStandards.filter(
    std => !auditor.qualifiedStandards.includes(std)
  );

  if (missingStandards.length > 0) {
    issues.push({
      type: 'qualification',
      severity: 'violation',
      message: `${auditor.name} is not qualified for: ${missingStandards.join(', ')}`,
      auditorId: auditor.id
    });
  }

  // Check EAC sector codes
  const missingEacCodes = process.requiredEacCodes.filter(
    code => !auditor.eacCodes.includes(code)
  );

  if (missingEacCodes.length > 0) {
    issues.push({
      type: 'eac',
      severity: 'violation',
      message: `${auditor.name} lacks EAC codes: ${missingEacCodes.join(', ')}`,
      auditorId: auditor.id
    });
  }

  return issues;
}

export function calculateAuditorSummary(
  auditor: Auditor,
  segments: AuditSegment[],
  processes: Process[]
): AuditorSummary {
  const auditorSegments = segments.filter(s => s.auditorId === auditor.id);
  const dailyHours: Record<number, number> = {};
  let totalHours = 0;
  const issues: ComplianceIssue[] = [];

  auditorSegments.forEach(segment => {
    totalHours += segment.duration;
    dailyHours[segment.day] = (dailyHours[segment.day] || 0) + segment.duration;

    // Check qualification for each segment
    const process = processes.find(p => p.id === segment.processId);
    if (process) {
      const qualificationIssues = checkAuditorQualification(auditor, process);
      qualificationIssues.forEach(issue => {
        issue.segmentId = segment.id;
        if (!issues.some(i => i.message === issue.message && i.segmentId === segment.id)) {
          issues.push(issue);
        }
      });
    }
  });

  // Check daily limits
  Object.entries(dailyHours).forEach(([day, hours]) => {
    if (hours > HOURS_PER_DAY_LIMIT) {
      issues.push({
        type: 'daily_limit',
        severity: 'violation',
        message: `Day ${day}: ${hours}h exceeds ${HOURS_PER_DAY_LIMIT}h limit`,
        auditorId: auditor.id
      });
    } else if (hours > HOURS_PER_DAY_LIMIT - 1) {
      issues.push({
        type: 'daily_limit',
        severity: 'warning',
        message: `Day ${day}: ${hours}h approaching daily limit`,
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
      message: `${mandaysUsed.toFixed(1)} mandays exceeds limit of ${auditor.maxMandays}`,
      auditorId: auditor.id
    });
  } else if (mandaysUsed > auditor.maxMandays * 0.9) {
    issues.push({
      type: 'manday_exceeded',
      severity: 'warning',
      message: `${mandaysUsed.toFixed(1)} mandays approaching limit of ${auditor.maxMandays}`,
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
  auditor: Auditor | undefined,
  process: Process | undefined,
  auditorSummary: AuditorSummary | undefined
): ComplianceStatus {
  if (!auditor || !process) return 'violation';

  const qualificationIssues = checkAuditorQualification(auditor, process);
  if (qualificationIssues.some(i => i.severity === 'violation')) {
    return 'violation';
  }

  if (auditorSummary) {
    const dayHours = auditorSummary.dailyHours[segment.day] || 0;
    if (dayHours > HOURS_PER_DAY_LIMIT) return 'violation';
    if (auditorSummary.mandaysUsed > auditor.maxMandays) return 'violation';
    if (dayHours > HOURS_PER_DAY_LIMIT - 1 || auditorSummary.mandaysUsed > auditor.maxMandays * 0.9) {
      return 'warning';
    }
  }

  return 'valid';
}
