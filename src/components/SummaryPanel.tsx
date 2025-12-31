import { format } from 'date-fns';
import { Auditor, AuditorSummary, ComplianceStatus, formatHours } from '@/types/audit';
import { AlertTriangle, CheckCircle, XCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AuditSegment, Process } from '@/types/audit';

interface SummaryPanelProps {
  auditors: Auditor[];
  summaries: AuditorSummary[];
  segments: AuditSegment[];
  processes: Process[];
  auditDates: Date[];
}

function getStatusIcon(status: ComplianceStatus) {
  switch (status) {
    case 'valid':
      return <CheckCircle className="w-5 h-5 text-status-valid" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-status-warning" />;
    case 'violation':
      return <XCircle className="w-5 h-5 text-status-violation" />;
  }
}

function getStatusBorder(status: ComplianceStatus) {
  switch (status) {
    case 'valid':
      return 'border-status-valid';
    case 'warning':
      return 'border-status-warning';
    case 'violation':
      return 'border-status-violation';
  }
}

function exportAuditPlan(segments: AuditSegment[], processes: Process[], auditors: Auditor[]) {
  // Sort segments chronologically
  const sortedSegments = [...segments].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.startHour - b.startHour;
  });

  const formatExportTime = (hour: number): string => {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}H${m.toString().padStart(2, '0')}`;
  };

  const rows = sortedSegments.map(segment => {
    const process = processes.find(p => p.id === segment.processId);
    const segmentAuditors = auditors.filter(a => segment.auditorIds.includes(a.id));
    const date = new Date(segment.date);
    
    return {
      date: format(date, 'dd MMM yyyy'),
      time: `${formatExportTime(segment.startHour)}–${formatExportTime(segment.startHour + segment.duration)} (${formatHours(segment.duration)})`,
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

export function SummaryPanel({ auditors, summaries, segments, processes, auditDates }: SummaryPanelProps) {
  const totalViolations = summaries.reduce(
    (acc, s) => acc + s.issues.filter(i => i.severity === 'violation').length,
    0
  );
  const totalWarnings = summaries.reduce(
    (acc, s) => acc + s.issues.filter(i => i.severity === 'warning').length,
    0
  );

  const overallStatus: ComplianceStatus = totalViolations > 0 ? 'violation' : totalWarnings > 0 ? 'warning' : 'valid';

  return (
    <div className="border-2 border-border p-4 bg-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold uppercase tracking-wide">Compliance Summary</h2>
          {getStatusIcon(overallStatus)}
        </div>
        <Button 
          onClick={() => exportAuditPlan(segments, processes, auditors)}
          variant="outline"
          className="border-2"
          disabled={segments.length === 0}
        >
          <FileText className="w-4 h-4 mr-2" />
          Export Audit Plan
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
        <div className={cn("border-2 p-3", totalViolations > 0 ? "border-status-violation bg-status-violation-bg" : "border-border")}>
          <div className="text-2xl font-bold font-mono">{totalViolations}</div>
          <div className="text-xs uppercase text-muted-foreground">Violations</div>
        </div>
        <div className={cn("border-2 p-3", totalWarnings > 0 ? "border-status-warning bg-status-warning-bg" : "border-border")}>
          <div className="text-2xl font-bold font-mono">{totalWarnings}</div>
          <div className="text-xs uppercase text-muted-foreground">Warnings</div>
        </div>
        <div className={cn("border-2 p-3", overallStatus === 'valid' ? "border-status-valid bg-status-valid-bg" : "border-border")}>
          <div className="text-2xl font-bold font-mono">{summaries.filter(s => s.status === 'valid').length}</div>
          <div className="text-xs uppercase text-muted-foreground">Compliant</div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground font-mono mb-4">
        Max 7h/day per auditor • 1 manday = 7h
      </p>

      <div className="space-y-3">
        {summaries.map(summary => {
          const auditor = auditors.find(a => a.id === summary.auditorId);
          if (!auditor) return null;

          return (
            <div
              key={summary.auditorId}
              className={cn("border-2 p-3", getStatusBorder(summary.status))}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold">{auditor.name}</div>
                <div className="flex items-center gap-2">
                  {summary.status === 'valid' && summary.totalHours > 0 && (
                    <span className="text-xs font-mono text-status-valid font-bold">OK</span>
                  )}
                  {getStatusIcon(summary.status)}
                </div>
              </div>
              <div className="text-sm font-mono mb-2">
                <span className="text-muted-foreground">Mandays: </span>
                <span className="font-bold">{summary.mandaysUsed.toFixed(2)} / {summary.maxMandays}</span>
              </div>
              {Object.entries(summary.dailyHours).length > 0 && (
                <div className="text-xs font-mono text-muted-foreground mb-2">
                  {auditDates.map((date, idx) => {
                    const dStr = format(date, 'yyyy-MM-dd');
                    const hours = summary.dailyHours[dStr];
                    if (!hours) return null;
                    return (
                      <span key={dStr} className="mr-2">
                        D{idx + 1}: {formatHours(hours)}
                      </span>
                    );
                  })}
                </div>
              )}
              {summary.issues.length > 0 && (
                <div className="space-y-1 mt-2">
                  {summary.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "text-xs font-mono p-2 border",
                        issue.severity === 'violation' ? "bg-status-violation-bg border-status-violation" : "bg-status-warning-bg border-status-warning"
                      )}
                    >
                      {issue.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {summaries.length === 0 && (
          <p className="text-muted-foreground text-sm font-mono">No auditor assignments yet</p>
        )}
      </div>
    </div>
  );
}
