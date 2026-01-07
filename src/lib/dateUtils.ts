/**
 * Date utility functions - centralized date formatting and manipulation
 * Avoids repeated format() calls scattered throughout the codebase
 */

import { format } from 'date-fns';

/**
 * Standard date format used throughout the app for segment dates and keys
 */
export const DATE_FORMAT = 'yyyy-MM-dd';

/**
 * Convert a Date to the standard YYYY-MM-DD string format
 * This is the primary date representation for audit segments and storage
 * 
 * @param date - The Date object to format
 * @returns ISO date string (YYYY-MM-DD)
 */
export function toDateStr(date: Date): string {
  return format(date, DATE_FORMAT);
}

/**
 * Check if two dates represent the same day
 * 
 * @param a - First date
 * @param b - Second date
 * @returns true if both dates are the same calendar day
 */
export function isSameDay(a: Date, b: Date): boolean {
  return toDateStr(a) === toDateStr(b);
}

/**
 * Check if a date exists in an array of dates (by day comparison)
 * 
 * @param date - The date to search for
 * @param dates - Array of dates to search in
 * @returns true if the date exists in the array
 */
export function dateExistsIn(date: Date, dates: Date[]): boolean {
  const dateStr = toDateStr(date);
  return dates.some(d => toDateStr(d) === dateStr);
}

/**
 * Format a date for display purposes (e.g., "15 Jan 2024")
 * 
 * @param date - The Date object to format
 * @returns Human-readable date string
 */
export function formatDisplayDate(date: Date): string {
  return format(date, 'dd MMM yyyy');
}

/**
 * Format a date with full weekday (e.g., "Monday, 15 January 2024")
 * 
 * @param date - The Date object to format
 * @returns Full date string with weekday
 */
export function formatFullDate(date: Date): string {
  return format(date, 'EEEE, dd MMMM yyyy');
}
