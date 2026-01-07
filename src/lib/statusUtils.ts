/**
 * Status utility functions - centralized compliance status styling
 * 
 * Provides consistent CSS classes for the three compliance states:
 * - valid: Green, indicates compliance
 * - warning: Amber, indicates approaching limits
 * - violation: Red, indicates constraint breach
 */

import { ComplianceStatus, HOURS_PER_DAY_LIMIT } from '@/types/audit';

// ============================================================================
// Status Color Mappings
// ============================================================================

/** Map of status to background + border classes (for filled elements) */
const STATUS_FILLED_CLASSES: Record<ComplianceStatus, string> = {
  valid: 'bg-status-valid border-status-valid',
  warning: 'bg-status-warning border-status-warning',
  violation: 'bg-status-violation border-status-violation',
};

/** Map of status to border-only classes */
const STATUS_BORDER_CLASSES: Record<ComplianceStatus, string> = {
  valid: 'border-status-valid',
  warning: 'border-status-warning',
  violation: 'border-status-violation',
};

/** Map of status to border + light background classes (for panels) */
const STATUS_PANEL_CLASSES: Record<ComplianceStatus, string> = {
  valid: 'border-status-valid bg-status-valid-bg',
  warning: 'border-status-warning bg-status-warning-bg',
  violation: 'border-status-violation bg-status-violation-bg',
};

// ============================================================================
// Status Functions
// ============================================================================

/**
 * Get filled background + border classes for a status
 * Use for segment bars and solid status indicators
 * 
 * @param status - The compliance status
 * @returns Tailwind classes for bg and border colors
 */
export function getStatusColor(status: ComplianceStatus): string {
  return STATUS_FILLED_CLASSES[status];
}

/**
 * Get border-only classes for a status
 * Use for outlined elements like summaries
 * 
 * @param status - The compliance status
 * @returns Tailwind classes for border color
 */
export function getStatusBorder(status: ComplianceStatus): string {
  return STATUS_BORDER_CLASSES[status];
}

/**
 * Get border + light background classes for a status
 * Use for panel backgrounds with status indication
 * 
 * @param status - The compliance status
 * @returns Tailwind classes for border and background colors
 */
export function getStatusClasses(status: ComplianceStatus): string {
  return STATUS_PANEL_CLASSES[status];
}

/**
 * Get status classes based on daily hour count
 * Determines severity based on proximity to daily limit
 * 
 * @param hours - Number of hours worked in a day
 * @returns Tailwind classes for the appropriate status
 */
export function getDailyStatusClass(hours: number): string {
  if (hours > HOURS_PER_DAY_LIMIT) {
    return 'bg-status-violation-bg border-status-violation text-status-violation';
  }
  if (hours > HOURS_PER_DAY_LIMIT - 1) {
    return 'bg-status-warning-bg border-status-warning text-status-warning';
  }
  return 'border-border/30';
}

/**
 * Determine worst status from a collection
 * violation > warning > valid
 * 
 * @param statuses - Array of compliance statuses
 * @returns The most severe status in the array
 */
export function getWorstStatus(statuses: ComplianceStatus[]): ComplianceStatus {
  if (statuses.includes('violation')) return 'violation';
  if (statuses.includes('warning')) return 'warning';
  return 'valid';
}
