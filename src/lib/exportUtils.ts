import { format } from 'date-fns';
import { AuditSegment, Auditor, Process, formatHours, formatTimeLabel } from '@/types/audit';

export function exportAuditPlan(
  segments: AuditSegment[],
  processes: Process[],
  auditors: Auditor[]
): void {
  // Sort segments chronologically
  const sortedSegments = [...segments].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.startHour - b.startHour;
  });

  const rows = sortedSegments.map(segment => {
    const process = processes.find(p => p.id === segment.processId);
    const segmentAuditors = auditors.filter(a => segment.auditorIds.includes(a.id));
    const date = new Date(segment.date);
    
    return {
      date: format(date, 'dd MMM yyyy'),
      time: `${formatTimeLabel(segment.startHour)}–${formatTimeLabel(segment.startHour + segment.duration)} (${formatHours(segment.duration)})`,
      auditors: segmentAuditors.map(a => a.name).join(', '),
      process: process?.name || 'Unknown',
      contact: ''
    };
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Audit Plan Export</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #333; padding: 8px; text-align: left; }
    th { background-color: #f0f0f0; font-weight: bold; }
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
          <td>${row.date}</td>
          <td>${row.time}</td>
          <td>${row.auditors}</td>
          <td>${row.process}</td>
          <td>${row.contact}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
