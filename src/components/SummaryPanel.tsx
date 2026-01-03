import { format } from 'date-fns';
import { Auditor, AuditorSummary, ComplianceStatus, formatHours } from '@/types/audit';
import { AlertTriangle, CheckCircle, XCircle, FileText, Clock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AuditSegment, Process } from '@/types/audit';
import { BilingualLabel, BilingualText } from '@/components/BilingualLabel';
import { getDailyMetrics, formatSpan, DailyAuditMetrics } from '@/lib/dailyMetrics';

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

  // Calculate daily metrics for all dates
  const dailyMetrics: DailyAuditMetrics[] = auditDates.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return getDailyMetrics(segments, dateStr);
  });

  // Count span violations
  const spanViolations = dailyMetrics.filter(m => m.spanStatus === 'violation').length;
  const idleWarnings = dailyMetrics.filter(m => m.idleStatus === 'warning').length;

  const overallStatus: ComplianceStatus = 
    (totalViolations > 0 || spanViolations > 0) ? 'violation' : 
    (totalWarnings > 0 || idleWarnings > 0) ? 'warning' : 'valid';

  return (
    <div className="border-2 border-border p-4 bg-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold uppercase tracking-wide">
            <BilingualLabel labelKey="complianceSummary" />
          </h2>
          {getStatusIcon(overallStatus)}
        </div>
        <Button 
          onClick={() => exportAuditPlan(segments, processes, auditors)}
          variant="outline"
          className="border-2"
          disabled={segments.length === 0}
        >
          <FileText className="w-4 h-4 mr-2" />
          <BilingualLabel labelKey="exportAuditPlan" showFr={false} />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
        <div className={cn("border-2 p-3", (totalViolations > 0 || spanViolations > 0) ? "border-status-violation bg-status-violation-bg" : "border-border")}>
          <div className="text-2xl font-bold font-mono">{totalViolations + spanViolations}</div>
          <div className="text-xs uppercase text-muted-foreground">
            <BilingualLabel labelKey="violations" />
          </div>
        </div>
        <div className={cn("border-2 p-3", (totalWarnings > 0 || idleWarnings > 0) ? "border-status-warning bg-status-warning-bg" : "border-border")}>
          <div className="text-2xl font-bold font-mono">{totalWarnings + idleWarnings}</div>
          <div className="text-xs uppercase text-muted-foreground">
            <BilingualLabel labelKey="warnings" />
          </div>
        </div>
        <div className={cn("border-2 p-3", overallStatus === 'valid' ? "border-status-valid bg-status-valid-bg" : "border-border")}>
          <div className="text-2xl font-bold font-mono">{summaries.filter(s => s.status === 'valid').length}</div>
          <div className="text-xs uppercase text-muted-foreground">
            <BilingualLabel labelKey="compliant" />
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground font-mono mb-4">
        <BilingualText 
          en="Max 7h/day per auditor • 1 manday = 7h • Span limit: 8h (7h audit + 1h lunch)" 
          fr="Max 7h/jour par auditeur • 1 jour-homme = 7h • Limite amplitude: 8h (7h audit + 1h pause)"
        />
      </p>

      {/* Daily Audit Span & Idle Time Section */}
      {dailyMetrics.length > 0 && dailyMetrics.some(m => m.span > 0) && (
        <div className="mb-4 border-2 border-border p-3">
          <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <BilingualLabel labelKey="dailyAuditSpan" />
          </h3>
          <div className="space-y-2">
            {auditDates.map((date, idx) => {
              const metrics = dailyMetrics[idx];
              if (metrics.span === 0) return null;
              
              return (
                <div 
                  key={metrics.date}
                  className={cn(
                    "border p-2 font-mono text-xs",
                    metrics.spanStatus === 'violation' && "border-status-violation bg-status-violation-bg",
                    metrics.spanStatus === 'valid' && "border-border"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">D{idx + 1}: {format(date, 'dd MMM')}</span>
                    <div className="flex items-center gap-2">
                      <span>{formatSpan(metrics.spanStart, metrics.spanEnd)}</span>
                      <span className={cn(
                        "font-bold",
                        metrics.spanStatus === 'violation' && "text-status-violation",
                        metrics.spanStatus === 'valid' && "text-status-valid"
                      )}>
                        = {formatHours(metrics.span)}
                      </span>
                      {metrics.spanStatus === 'valid' && <CheckCircle className="w-3 h-3 text-status-valid" />}
                      {metrics.spanStatus === 'violation' && <XCircle className="w-3 h-3 text-status-violation" />}
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    <BilingualText en="Effective audit" fr="Audit effectif" showFr={false} />: {formatHours(metrics.effectiveAuditTime)}
                    {metrics.totalGaps > 0 && (
                      <span className="ml-2">
                        • <BilingualText en="Gaps" fr="Pauses" showFr={false} />: {formatHours(metrics.totalGaps)}
                        {metrics.lunchDeducted && ' (1h lunch)'}
                      </span>
                    )}
                  </div>
                  {metrics.idleTime > 0 && (
                    <div className="flex items-center justify-between mt-1 text-status-warning">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        <BilingualText en="Idle time" fr="Temps mort" showFr={false} />
                      </span>
                      <span>{formatHours(metrics.idleTime)} {metrics.lunchDeducted && '(1h lunch deducted)'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Auditor summaries */}
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
                <span className="text-muted-foreground">
                  <BilingualText en="Mandays" fr="J-H" showFr={false} />:{' '}
                </span>
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
          <p className="text-muted-foreground text-sm font-mono">
            <BilingualLabel labelKey="noAssignments" />
          </p>
        )}
      </div>
    </div>
  );
}