/**
 * Core Audit Types and Constants
 * 
 * This module defines the fundamental data structures and constants
 * for the ISO Audit Planner application.
 */

// ============================================================================
// Entity Types
// ============================================================================

/**
 * Auditor - A team member who performs audits
 */
export interface Auditor {
  id: string;
  name: string;
  maxMandays: number; // Maximum allocated mandays for this audit
}

/**
 * Process - An audit activity or organizational unit to be audited
 */
export interface Process {
  id: string;
  name: string;
}

/**
 * AuditSegment - A scheduled block of audit time
 * Represents a specific process being audited by specific auditors at a specific time
 */
export interface AuditSegment {
  id: string;
  processId: string;      // Which process is being audited
  auditorIds: string[];   // Multiple auditors can be assigned simultaneously
  date: string;           // ISO date string (YYYY-MM-DD)
  startHour: number;      // Start time in decimal hours (e.g., 8.5 = 08:30)
  duration: number;       // Duration in hours (minimum 0.25)
}

// ============================================================================
// Compliance Types
// ============================================================================

/**
 * ComplianceStatus - Three-state compliance indicator
 * - valid: All constraints satisfied
 * - warning: Approaching limits
 * - violation: Constraint breach
 */
export type ComplianceStatus = 'valid' | 'warning' | 'violation';

/**
 * ComplianceIssue - A specific compliance problem
 */
export interface ComplianceIssue {
  type: 'daily_limit' | 'manday_exceeded' | 'overlap';
  severity: ComplianceStatus;
  message: string;
  segmentId?: string;
  auditorId?: string;
}

/**
 * AuditorSummary - Comprehensive compliance summary for an auditor
 */
export interface AuditorSummary {
  auditorId: string;
  totalHours: number;
  mandaysUsed: number;
  maxMandays: number;
  dailyHours: Record<string, number>; // Key is date string (YYYY-MM-DD)
  issues: ComplianceIssue[];
  status: ComplianceStatus;
}

// ============================================================================
// Time Constants
// ============================================================================

/** Minimum time increment (15 minutes = 0.25 hours) */
export const TIME_INCREMENT = 0.25;

/** Maximum hours per auditor per day */
export const HOURS_PER_DAY_LIMIT = 7;

/** Hours that equal one manday */
export const HOURS_PER_MANDAY = 7;

/** Default working day start hour */
export const DEFAULT_START_HOUR = 8; // 08:00

/** Default working day end hour */
export const DEFAULT_END_HOUR = 16; // 16:00

// ============================================================================
// Time Utility Functions
// ============================================================================

/**
 * Round a number to the nearest time increment (0.25h)
 * 
 * @param value - The value to round
 * @returns Value rounded to nearest 0.25
 */
export function roundToIncrement(value: number): number {
  return Math.round(value / TIME_INCREMENT) * TIME_INCREMENT;
}

/**
 * Format hours with quarter precision for display
 * Examples: 1 -> "1h", 1.5 -> "1h30", 2.75 -> "2h45"
 * 
 * @param hours - Hours to format
 * @returns Formatted string (e.g., "1h30")
 */
export function formatHours(hours: number): string {
  const whole = Math.floor(hours);
  const fraction = hours - whole;
  
  if (fraction === 0) return `${whole}h`;
  if (fraction === 0.25) return `${whole}h15`;
  if (fraction === 0.5) return `${whole}h30`;
  if (fraction === 0.75) return `${whole}h45`;
  
  // Fallback for non-standard fractions
  return `${hours.toFixed(2)}h`;
}

/**
 * Format time as HH'H'mm for timeline display
 * Examples: 8 -> "08H00", 8.5 -> "08H30"
 * 
 * @param hour - Hour in decimal format
 * @returns Formatted time string (e.g., "08H30")
 */
export function formatTimeLabel(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${h.toString().padStart(2, '0')}H${m.toString().padStart(2, '0')}`;
}

/**
 * Parse a decimal input string accepting comma or dot as separator
 * Used for duration and manday inputs
 * 
 * @param value - Input string (e.g., "2,5" or "2.5")
 * @returns Parsed number rounded to increment, or null if invalid
 */
export function parseDecimalInput(value: string): number | null {
  // Normalize decimal separator
  const normalized = value.replace(',', '.');
  const num = parseFloat(normalized);
  
  if (isNaN(num)) return null;
  
  return roundToIncrement(num);
}
