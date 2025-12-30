import { AuditSegment, Auditor, Process, AuditorSummary, ComplianceStatus, HOURS_PER_DAY_LIMIT, formatHours } from '@/types/audit';
import { getSegmentComplianceStatus } from '@/lib/compliance';
import { cn } from '@/lib/utils';

interface AuditorLoadViewProps {
  segments: AuditSegment[];
  auditors: Auditor[];
  processes: Process[];
  summaries: AuditorSummary[];
  days: number;
}

const HOURS_PER_DAY = 8;
const HOUR_WIDTH = 60;
const ROW_HEIGHT = 64;
const LEFT_LABEL_WIDTH = 180;

function getStatusColor(status: ComplianceStatus) {
  switch (status) {
    case 'valid':
      return 'bg-status-valid border-status-valid';
    case 'warning':
      return 'bg-status-warning border-status-warning';
    case 'violation':
      return 'bg-status-violation border-status-violation';
  }
}

function getDailyStatusClass(hours: number): string {
  if (hours > HOURS_PER_DAY_LIMIT) {
    return 'bg-status-violation-bg border-status-violation';
  }
  if (hours > HOURS_PER_DAY_LIMIT - 1) {
    return 'bg-status-warning-bg border-status-warning';
  }
  return 'border-border/30';
}

export function AuditorLoadView({
  segments,
  auditors,
  processes,
  summaries,
  days
}: AuditorLoadViewProps) {
  const totalHours = days * HOURS_PER_DAY;
  const chartWidth = totalHours * HOUR_WIDTH;

  return (
    <div className="border-2 border-border bg-card">
      <div className="border-b-2 border-border p-4 flex items-center gap-4">
        <h2 className="text-lg font-bold uppercase tracking-wide">Auditor Load View</h2>
        <div className="text-xs font-mono text-muted-foreground">
          Capacity & availability control — Max {HOURS_PER_DAY_LIMIT}h/day
        </div>
      </div>

      <div className="overflow-x-auto">
        {/* Header row with hours */}
        <div className="flex border-b-2 border-border" style={{ minWidth: LEFT_LABEL_WIDTH + chartWidth }}>
          <div className="flex-shrink-0 border-r-2 border-border bg-secondary p-2 font-bold text-sm" style={{ width: LEFT_LABEL_WIDTH }}>
            Auditor
          </div>
          <div className="flex">
            {Array.from({ length: days }).map((_, dayIndex) => (
              <div key={dayIndex} className="flex border-r-2 border-border last:border-r-0">
                {Array.from({ length: HOURS_PER_DAY }).map((_, hourIndex) => (
                  <div
                    key={hourIndex}
                    className={cn(
                      "flex-shrink-0 text-center text-xs font-mono py-2 border-r border-border/50",
                      hourIndex === 0 && "border-l-2 border-border"
                    )}
                    style={{ width: HOUR_WIDTH }}
                  >
                    {hourIndex === 0 && <div className="font-bold mb-1">Day {dayIndex + 1}</div>}
                    {hourIndex}h
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Auditor rows */}
        {auditors.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground font-mono">
            No auditors defined.
          </div>
        ) : (
          auditors.map(auditor => {
            const summary = summaries.find(s => s.auditorId === auditor.id);
            // Get segments for this auditor
            const auditorSegments = segments.filter(s => s.auditorIds.includes(auditor.id));

            return (
              <div
                key={auditor.id}
                className="flex border-b border-border/50 last:border-b-0"
                style={{ minWidth: LEFT_LABEL_WIDTH + chartWidth, minHeight: ROW_HEIGHT }}
              >
                <div
                  className={cn(
                    "flex-shrink-0 border-r-2 border-border bg-secondary/50 p-2 text-xs font-mono",
                    summary && summary.status !== 'valid' && (
                      summary.status === 'violation' ? 'bg-status-violation-bg' : 'bg-status-warning-bg'
                    )
                  )}
                  style={{ width: LEFT_LABEL_WIDTH }}
                >
                  <div className="font-bold truncate">{auditor.name}</div>
                  <div className="text-muted-foreground mt-1">
                    {summary ? formatHours(summary.totalHours) : '0h'} / {auditor.maxMandays * 7}h
                  </div>
                  <div className="text-muted-foreground">
                    {summary ? summary.mandaysUsed.toFixed(2) : '0'} / {auditor.maxMandays} MD
                  </div>
                  {/* Daily breakdown */}
                  {summary && Object.keys(summary.dailyHours).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {Array.from({ length: days }).map((_, dayIndex) => {
                        const dayNum = dayIndex + 1;
                        const hours = summary.dailyHours[dayNum] || 0;
                        if (hours === 0) return null;
                        return (
                          <span 
                            key={dayNum}
                            className={cn(
                              "px-1 border text-[10px]",
                              getDailyStatusClass(hours)
                            )}
                          >
                            D{dayNum}:{formatHours(hours)}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="relative flex-1" style={{ width: chartWidth }}>
                  {/* Day separators */}
                  {Array.from({ length: days }).map((_, dayIndex) => (
                    <div
                      key={dayIndex}
                      className="absolute top-0 bottom-0 border-l-2 border-border/30"
                      style={{ left: dayIndex * HOURS_PER_DAY * HOUR_WIDTH }}
                    />
                  ))}

                  {/* 7h limit indicator for each day */}
                  {Array.from({ length: days }).map((_, dayIndex) => (
                    <div
                      key={`limit-${dayIndex}`}
                      className="absolute top-0 bottom-0 border-l border-dashed border-status-warning/50"
                      style={{ left: (dayIndex * HOURS_PER_DAY + HOURS_PER_DAY_LIMIT) * HOUR_WIDTH }}
                      title={`${HOURS_PER_DAY_LIMIT}h daily limit`}
                    />
                  ))}

                  {/* Segment bars */}
                  {auditorSegments.map(segment => {
                    const process = processes.find(p => p.id === segment.processId);
                    const status = getSegmentComplianceStatus(segment, auditors, process, summaries);
                    const absoluteStart = (segment.day - 1) * HOURS_PER_DAY + segment.startHour;

                    return (
                      <div
                        key={segment.id}
                        className={cn(
                          "absolute top-2 bottom-2 border-2 flex items-center justify-center text-xs font-mono select-none px-1",
                          getStatusColor(status),
                          "text-primary-foreground"
                        )}
                        style={{
                          left: absoluteStart * HOUR_WIDTH + 2,
                          width: Math.max(segment.duration * HOUR_WIDTH - 6, 20)
                        }}
                        title={`${process?.name || 'Unknown'}: ${formatHours(segment.startHour)}-${formatHours(segment.startHour + segment.duration)}`}
                      >
                        <span className="truncate text-[10px]">{process?.name?.slice(0, 10) || '?'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
