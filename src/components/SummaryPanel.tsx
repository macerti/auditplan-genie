import { format } from 'date-fns';
import { Auditor, AuditorSummary, ComplianceStatus, formatHours } from '@/types/audit';
import { AlertTriangle, CheckCircle, XCircle, FileText, Clock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AuditSegment, Process } from '@/types/audit';
import { BilingualLabel, BilingualText } from '@/components/BilingualLabel';
import { getDailyMetrics, formatSpan, DailyAuditMetrics } from '@/lib/dailyMetrics';
import { getStatusBorder } from '@/lib/statusUtils';
import { exportAuditPlan } from '@/lib/exportUtils';

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

  // Count presence violations
  const presenceViolations = dailyMetrics.filter(m => m.presenceStatus === 'violation').length;
  const idleWarnings = dailyMetrics.filter(m => m.idleStatus === 'warning').length;

  const overallStatus: ComplianceStatus =
    (totalViolations > 0 || presenceViolations > 0) ? 'violation' :
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
        <div className={cn("border-2 p-3", (totalViolations > 0 || presenceViolations > 0) ? "border-status-violation bg-status-violation-bg" : "border-border")}>
          <div className="text-2xl font-bold font-mono">{totalViolations + presenceViolations}</div>
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
          en="Daily audit presence must be 7h • Idle gaps allowed: 1h lunch" 
          fr="La présence d'audit doit être de 7h • Pauses tolérées: 1h déjeuner"
        />
      </p>

      {/* Daily Audit Presence & Idle Time Section */}
      {dailyMetrics.length > 0 && dailyMetrics.some(m => m.presence > 0) && (
        <div className="mb-4 border-2 border-border p-3">
          <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <BilingualLabel labelKey="dailyAuditSpan" />
          </h3>
          <div className="space-y-2">
            {auditDates.map((date, idx) => {
              const metrics = dailyMetrics[idx];
              if (metrics.presence === 0) return null;

              return (
                <div
                  key={metrics.date}
                  className={cn(
                    "border p-2 font-mono text-xs",
                    metrics.presenceStatus === 'violation' && "border-status-violation bg-status-violation-bg",
                    metrics.presenceStatus === 'valid' && "border-border"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">D{idx + 1}: {format(date, 'dd MMM')}</span>
                    <div className="flex items-center gap-2">
                      <span>{formatSpan(metrics.windowStart, metrics.windowEnd)}</span>
                      <span
                        className={cn(
                          "font-bold",
                          metrics.presenceStatus === 'violation' && "text-status-violation",
                          metrics.presenceStatus === 'valid' && "text-status-valid"
                        )}
                      >
                        = {formatHours(metrics.presence)}
                      </span>
                      {metrics.presenceStatus === 'valid' && <CheckCircle className="w-3 h-3 text-status-valid" />}
                      {metrics.presenceStatus === 'violation' && <XCircle className="w-3 h-3 text-status-violation" />}
                    </div>
                  </div>

                  {metrics.totalGaps > 0 && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      <BilingualText en="Gaps" fr="Pauses" showFr={false} />: {formatHours(metrics.totalGaps)}
                      {metrics.lunchDeducted && ' (1h lunch)'}
                    </div>
                  )}

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
