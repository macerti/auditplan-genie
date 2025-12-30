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
  requiredEacCodes: string[]; // Optional - empty array means no EAC requirement
}

export interface AuditSegment {
  id: string;
  processId: string;
  auditorIds: string[]; // Multiple auditors can be assigned simultaneously
  day: number;
  startHour: number; // In 0.25h increments (e.g., 0, 0.25, 0.5, 0.75, 1, 1.25...)
  duration: number; // In 0.25h increments (minimum 0.25)
}

export type ComplianceStatus = 'valid' | 'warning' | 'violation';

export interface ComplianceIssue {
  type: 'qualification' | 'eac' | 'daily_limit' | 'manday_exceeded' | 'overlap';
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

// Time constants
export const TIME_INCREMENT = 0.25; // 15 minutes
export const HOURS_PER_DAY_LIMIT = 7;
export const HOURS_PER_MANDAY = 7;

// Helper to round to nearest time increment
export function roundToIncrement(value: number): number {
  return Math.round(value / TIME_INCREMENT) * TIME_INCREMENT;
}

// Helper to format hours with quarter precision
export function formatHours(hours: number): string {
  const whole = Math.floor(hours);
  const fraction = hours - whole;
  if (fraction === 0) return `${whole}h`;
  if (fraction === 0.25) return `${whole}h15`;
  if (fraction === 0.5) return `${whole}h30`;
  if (fraction === 0.75) return `${whole}h45`;
  return `${hours.toFixed(2)}h`;
}
