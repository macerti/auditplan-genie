/**
 * Timeline Configuration Constants
 * 
 * Shared constants for the Gantt chart timeline display.
 * Used by GanttChart, AuditorLoadView, and timeline components.
 */

// ============================================================================
// Time Range
// ============================================================================

/** Timeline start hour (06:00) */
export const TIMELINE_START = 6;

/** Timeline end hour (18:00) */
export const TIMELINE_END = 18;

/** Total hours displayed in timeline */
export const TIMELINE_HOURS = TIMELINE_END - TIMELINE_START;

// ============================================================================
// Dimensions (pixels)
// ============================================================================

/** Width of one hour on the timeline */
export const HOUR_WIDTH = 100;

/** Width of one quarter hour (15 min) */
export const QUARTER_WIDTH = HOUR_WIDTH / 4;

/** Height of a segment row in the Gantt chart */
export const GANTT_ROW_HEIGHT = 100;

/** Height of an auditor row in the load view */
export const AUDITOR_ROW_HEIGHT = 110;

/** Width of the frozen left column (process/auditor names) */
export const FROZEN_COL_WIDTH = 200;
