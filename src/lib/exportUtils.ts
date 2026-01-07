/**
 * Export Utilities Module
 * 
 * Handles exporting audit plans to various formats.
 * Currently supports HTML export that opens in a new tab.
 */

import { AuditSegment, Auditor, Process, formatHours, formatTimeLabel } from '@/types/audit';
import { formatDisplayDate } from '@/lib/dateUtils';

// ============================================================================
// Types
// ============================================================================

/** Row data for export table */
interface ExportRow {
  date: string;
  time: string;
  auditors: string;
  process: string;
  contact: string;
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export audit plan as HTML and open in new tab
 * Generates a printable table with all scheduled segments
 * 
 * @param segments - All audit segments
 * @param processes - All processes
 * @param auditors - All auditors
 */
export function exportAuditPlan(
  segments: AuditSegment[],
  processes: Process[],
  auditors: Auditor[]
): void {
  // Sort segments chronologically (by date, then by start time)
  const sortedSegments = [...segments].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.startHour - b.startHour;
  });

  // Transform segments to export rows
  const rows: ExportRow[] = sortedSegments.map(segment => {
    const process = processes.find(p => p.id === segment.processId);
    const segmentAuditors = auditors.filter(a => segment.auditorIds.includes(a.id));
    const date = new Date(segment.date);
    const endHour = segment.startHour + segment.duration;
    
    return {
      date: formatDisplayDate(date),
      time: `${formatTimeLabel(segment.startHour)}–${formatTimeLabel(endHour)} (${formatHours(segment.duration)})`,
      auditors: segmentAuditors.map(a => a.name).join(', '),
      process: process?.name || 'Unknown',
      contact: '' // Placeholder for manual entry
    };
  });

  // Generate HTML document
  const html = generateExportHTML(rows);

  // Open in new tab
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

/**
 * Generate HTML document for export
 * 
 * @param rows - Table row data
 * @returns Complete HTML document string
 */
function generateExportHTML(rows: ExportRow[]): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Audit Plan Export</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      margin: 20px; 
    }
    h1 {
      margin-bottom: 20px;
    }
    table { 
      border-collapse: collapse; 
      width: 100%; 
    }
    th, td { 
      border: 1px solid #333; 
      padding: 8px; 
      text-align: left; 
    }
    th { 
      background-color: #f0f0f0; 
      font-weight: bold; 
    }
    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>
  <h1>Audit Plan</h1>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Heure</th>
        <th>Auditeur</th>
        <th>Unités Organisationnelles et Fonctionnelles / Processus et Activités</th>
        <th>Contact principal</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map(row => `
        <tr>
          <td>${escapeHtml(row.date)}</td>
          <td>${escapeHtml(row.time)}</td>
          <td>${escapeHtml(row.auditors)}</td>
          <td>${escapeHtml(row.process)}</td>
          <td>${escapeHtml(row.contact)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
  `;
}

/**
 * Escape HTML special characters to prevent XSS
 * 
 * @param text - Raw text to escape
 * @returns HTML-safe string
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}
