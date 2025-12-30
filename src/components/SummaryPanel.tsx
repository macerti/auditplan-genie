import { Auditor, AuditorSummary, ComplianceStatus } from '@/types/audit';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryPanelProps {
  auditors: Auditor[];
  summaries: AuditorSummary[];
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

export function SummaryPanel({ auditors, summaries }: SummaryPanelProps) {
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
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-bold uppercase tracking-wide">Compliance Summary</h2>
        {getStatusIcon(overallStatus)}
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
                {getStatusIcon(summary.status)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm font-mono mb-2">
                <div>
                  <span className="text-muted-foreground">Hours: </span>
                  {summary.totalHours}h
                </div>
                <div>
                  <span className="text-muted-foreground">Mandays: </span>
                  {summary.mandaysUsed.toFixed(1)} / {summary.maxMandays}
                </div>
              </div>
              {Object.entries(summary.dailyHours).length > 0 && (
                <div className="text-xs font-mono text-muted-foreground mb-2">
                  Daily: {Object.entries(summary.dailyHours).map(([day, hours]) => `D${day}:${hours}h`).join(', ')}
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
