import { format } from 'date-fns';
import { 
  AuditSegment, 
  Auditor, 
  Process, 
  AuditorSummary, 
  ComplianceStatus, 
  HOURS_PER_DAY_LIMIT, 
  formatHours,
  formatTimeLabel,
  DEFAULT_START_HOUR,
  DEFAULT_END_HOUR
} from '@/types/audit';
import { getSegmentComplianceStatus } from '@/lib/compliance';
import { cn } from '@/lib/utils';

interface AuditorLoadViewProps {
  segments: AuditSegment[];
  auditors: Auditor[];
  processes: Process[];
  summaries: AuditorSummary[];
  selectedDate: Date | null;
  auditDates: Date[];
}

// Timeline configuration
const TIMELINE_START = 6; // 06:00
const TIMELINE_END = 18; // 18:00
const TIMELINE_HOURS = TIMELINE_END - TIMELINE_START;
const HOUR_WIDTH = 80;
const QUARTER_WIDTH = HOUR_WIDTH / 4;
const ROW_HEIGHT = 72;
const FROZEN_COL_WIDTH = 200;

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
    return 'bg-status-violation-bg border-status-violation text-status-violation';
  }
  if (hours > HOURS_PER_DAY_LIMIT - 1) {
    return 'bg-status-warning-bg border-status-warning text-status-warning';
  }
  return 'border-border/30';
}

export function AuditorLoadView({
  segments,
  auditors,
  processes,
  summaries,
  selectedDate,
  auditDates
}: AuditorLoadViewProps) {
  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const daySegments = segments.filter(s => s.date === dateStr);
  const chartWidth = TIMELINE_HOURS * HOUR_WIDTH;

  if (!selectedDate) {
    return (
      <div className="border-2 border-border bg-card p-8 text-center">
        <p className="text-muted-foreground font-mono">Select an audit day to view auditor loads</p>
      </div>
    );
  }

  return (
    <div className="border-2 border-border bg-card">
      <div className="border-b-2 border-border p-4 flex items-center gap-4 flex-wrap">
        <h2 className="text-lg font-bold uppercase tracking-wide">Auditor Load View</h2>
        <span className="font-mono text-sm bg-secondary px-2 py-1 border-2">
          {format(selectedDate, 'EEEE, dd MMMM yyyy')}
        </span>
        <div className="text-xs font-mono text-muted-foreground ml-auto">
          Capacity & availability control — Max {HOURS_PER_DAY_LIMIT}h/day
        </div>
      </div>

      {/* View with frozen column */}
      <div className="flex">
        {/* Frozen column */}
        <div className="flex-shrink-0 border-r-2 border-border" style={{ width: FROZEN_COL_WIDTH }}>
          {/* Header */}
          <div className="h-12 border-b-2 border-border bg-secondary p-2 font-bold text-sm flex items-center">
            Auditor
          </div>
          {/* Auditor rows */}
          {auditors.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground font-mono text-sm">
              No auditors
            </div>
          ) : (
            auditors.map(auditor => {
              const summary = summaries.find(s => s.auditorId === auditor.id);
              const dayHours = summary?.dailyHours[dateStr] || 0;
              
              return (
                <div
                  key={auditor.id}
                  className={cn(
                    "border-b border-border/50 p-2",
                    summary && summary.status !== 'valid' && (
                      summary.status === 'violation' ? 'bg-status-violation-bg' : 'bg-status-warning-bg'
                    )
                  )}
                  style={{ height: ROW_HEIGHT }}
                >
                  <div className="font-bold text-sm truncate">{auditor.name}</div>
                  <div className="text-xs font-mono text-muted-foreground mt-1">
                    <div>Today: <span className={cn("font-bold", getDailyStatusClass(dayHours))}>{formatHours(dayHours)}</span> / {HOURS_PER_DAY_LIMIT}h</div>
                    <div>Total: {summary ? formatHours(summary.totalHours) : '0h'}</div>
                    <div>MD: {summary ? summary.mandaysUsed.toFixed(2) : '0'} / {auditor.maxMandays}</div>
                  </div>
                  {/* Per-day breakdown */}
                  {summary && Object.keys(summary.dailyHours).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {auditDates.map((date, idx) => {
                        const dStr = format(date, 'yyyy-MM-dd');
                        const hours = summary.dailyHours[dStr] || 0;
                        if (hours === 0) return null;
                        return (
                          <span 
                            key={dStr}
                            className={cn(
                              "px-1 border text-[9px]",
                              getDailyStatusClass(hours)
                            )}
                          >
                            D{idx + 1}:{formatHours(hours)}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Scrollable timeline */}
        <div className="flex-1 overflow-x-auto">
          <div style={{ minWidth: chartWidth }}>
            {/* Timeline header with ruler */}
            <div className="h-12 border-b-2 border-border bg-secondary flex relative">
              {Array.from({ length: TIMELINE_HOURS }).map((_, hourIndex) => {
                const hour = TIMELINE_START + hourIndex;
                const isLunchHour = hour === 12;
                const isOutsideWork = hour < DEFAULT_START_HOUR || hour >= DEFAULT_END_HOUR;
                
                return (
                  <div
                    key={hourIndex}
                    className={cn(
                      "flex-shrink-0 border-r border-border/30 relative",
                      isLunchHour && "bg-muted/50",
                      isOutsideWork && "bg-muted/30"
                    )}
                    style={{ width: HOUR_WIDTH }}
                  >
                    <div className={cn(
                      "text-xs font-mono font-bold px-1 py-1",
                      isOutsideWork && "text-muted-foreground"
                    )}>
                      {formatTimeLabel(hour)}
                    </div>
                    {/* Quarter hour marks */}
                    <div className="absolute bottom-0 left-0 right-0 flex h-3">
                      {[0, 1, 2, 3].map((q) => (
                        <div 
                          key={q} 
                          className={cn(
                            "flex-1 border-r",
                            q === 0 ? "border-border" : "border-border/20"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Auditor rows */}
            {auditors.map(auditor => {
              const auditorDaySegments = daySegments.filter(s => s.auditorIds.includes(auditor.id));
              const summary = summaries.find(s => s.auditorId === auditor.id);

              return (
                <div
                  key={auditor.id}
                  className="border-b border-border/50 relative"
                  style={{ height: ROW_HEIGHT }}
                >
                  {/* Background grid */}
                  <div className="absolute inset-0 flex">
                    {Array.from({ length: TIMELINE_HOURS }).map((_, hourIndex) => {
                      const hour = TIMELINE_START + hourIndex;
                      const isLunchHour = hour === 12;
                      const isOutsideWork = hour < DEFAULT_START_HOUR || hour >= DEFAULT_END_HOUR;
                      
                      return (
                        <div
                          key={hourIndex}
                          className={cn(
                            "flex-shrink-0 border-r relative",
                            hourIndex === 0 ? "border-border" : "border-border/20",
                            isLunchHour && "bg-muted/30",
                            isOutsideWork && "bg-muted/20"
                          )}
                          style={{ width: HOUR_WIDTH }}
                        >
                          {/* Quarter hour lines */}
                          {[1, 2, 3].map((q) => (
                            <div
                              key={q}
                              className="absolute top-0 bottom-0 border-l border-border/10"
                              style={{ left: q * QUARTER_WIDTH }}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>

                  {/* 7h limit indicator */}
                  <div
                    className="absolute top-0 bottom-0 border-l-2 border-dashed border-status-warning/50 z-5"
                    style={{ left: (DEFAULT_START_HOUR - TIMELINE_START + HOURS_PER_DAY_LIMIT) * HOUR_WIDTH }}
                    title={`${HOURS_PER_DAY_LIMIT}h daily limit`}
                  />

                  {/* Segment bars */}
                  {auditorDaySegments.map(segment => {
                    const process = processes.find(p => p.id === segment.processId);
                    const status = getSegmentComplianceStatus(segment, auditors, summaries);
                    const segmentLeft = (segment.startHour - TIMELINE_START) * HOUR_WIDTH;
                    const segmentWidth = segment.duration * HOUR_WIDTH;

                    return (
                      <div
                        key={segment.id}
                        className={cn(
                          "absolute top-2 bottom-2 border-2 flex items-center justify-center text-xs font-mono select-none px-1 z-10",
                          getStatusColor(status),
                          "text-primary-foreground"
                        )}
                        style={{
                          left: Math.max(0, segmentLeft),
                          width: Math.max(segmentWidth - 4, 20)
                        }}
                        title={`${process?.name || 'Unknown'}: ${formatTimeLabel(segment.startHour)}-${formatTimeLabel(segment.startHour + segment.duration)}`}
                      >
                        <span className="truncate text-[10px]">{process?.name?.slice(0, 12) || '?'}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Empty state */}
            {auditors.length === 0 && (
              <div className="h-20 flex items-center justify-center text-muted-foreground font-mono text-sm">
                No auditors defined
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
