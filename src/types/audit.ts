export type ISOStandard = 'ISO 9001' | 'ISO 14001' | 'ISO 45001';

export interface Auditor {
  id: string;
  name: string;
  eacCodes: string[];
  qualifiedStandards: ISOStandard[];
  maxMandays: number;
}

export interface Process {
  id: string;
  name: string;
  requiredStandards: ISOStandard[];
  requiredEacCodes: string[];
}

export interface AuditSegment {
  id: string;
  processId: string;
  auditorId: string;
  day: number;
  startHour: number;
  duration: number; // in hours
}

export type ComplianceStatus = 'valid' | 'warning' | 'violation';

export interface ComplianceIssue {
  type: 'qualification' | 'eac' | 'daily_limit' | 'manday_exceeded';
  severity: ComplianceStatus;
  message: string;
  segmentId?: string;
  auditorId?: string;
}

export interface AuditorSummary {
  auditorId: string;
  totalHours: number;
  mandaysUsed: number;
  maxMandays: number;
  dailyHours: Record<number, number>;
  issues: ComplianceIssue[];
  status: ComplianceStatus;
}
