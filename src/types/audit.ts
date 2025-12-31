export interface Auditor {
  id: string;
  name: string;
  maxMandays: number;
}

export interface Process {
  id: string;
  name: string;
}

export interface AuditSegment {
  id: string;
  processId: string;
  auditorIds: string[]; // Multiple auditors can be assigned simultaneously
  date: string; // ISO date string (YYYY-MM-DD)
  startHour: number; // In 0.25h increments from 0 (e.g., 8, 8.25, 8.5...)
  duration: number; // In 0.25h increments (minimum 0.25)
}

export type ComplianceStatus = 'valid' | 'warning' | 'violation';

export interface ComplianceIssue {
  type: 'daily_limit' | 'manday_exceeded' | 'overlap';
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
  dailyHours: Record<string, number>; // Key is date string
  issues: ComplianceIssue[];
  status: ComplianceStatus;
}

// Time constants
export const TIME_INCREMENT = 0.25; // 15 minutes
export const HOURS_PER_DAY_LIMIT = 7;
export const HOURS_PER_MANDAY = 7;
export const DEFAULT_START_HOUR = 8; // 08:00
export const DEFAULT_END_HOUR = 16; // 16:00

// Helper to round to nearest time increment
export function roundToIncrement(value: number): number {
  return Math.round(value / TIME_INCREMENT) * TIME_INCREMENT;
}

// Helper to format hours with quarter precision (e.g., 1.5 -> "1h30")
export function formatHours(hours: number): string {
  const whole = Math.floor(hours);
  const fraction = hours - whole;
  if (fraction === 0) return `${whole}h`;
  if (fraction === 0.25) return `${whole}h15`;
  if (fraction === 0.5) return `${whole}h30`;
  if (fraction === 0.75) return `${whole}h45`;
  return `${hours.toFixed(2)}h`;
}

// Helper to format time as HH'H'mm (e.g., 8.5 -> "08H30")
export function formatTimeLabel(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${h.toString().padStart(2, '0')}H${m.toString().padStart(2, '0')}`;
}

// Parse value accepting comma or dot as decimal separator
export function parseDecimalInput(value: string): number | null {
  const normalized = value.replace(',', '.');
  const num = parseFloat(normalized);
  if (isNaN(num)) return null;
  return roundToIncrement(num);
}
