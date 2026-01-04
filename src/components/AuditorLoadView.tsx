import { format } from 'date-fns';
import { 
  AuditSegment, 
  Auditor, 
  Process, 
  AuditorSummary, 
  HOURS_PER_DAY_LIMIT, 
  formatHours,
  formatTimeLabel
} from '@/types/audit';
import { getSegmentComplianceStatus } from '@/lib/compliance';
import { cn } from '@/lib/utils';
import { BilingualLabel, BilingualText } from '@/components/BilingualLabel';
import { 
  TimelineHeader, 
  TimelineGrid, 
  DateSwitcher, 
  SegmentBar 
} from '@/components/gantt';
import { getDailyStatusClass } from '@/lib/statusUtils';
import {
  TIMELINE_START,
  TIMELINE_HOURS,
  HOUR_WIDTH,
  AUDITOR_ROW_HEIGHT,
  FROZEN_COL_WIDTH
} from '@/constants/timeline';
import { DEFAULT_START_HOUR } from '@/types/audit';

interface AuditorLoadViewProps {
  segments: AuditSegment[];
  auditors: Auditor[];
  processes: Process[];
  summaries: AuditorSummary[];
  selectedDate: Date | null;
  auditDates: Date[];
  onSelectDate: (date: Date) => void;
}

export function AuditorLoadView({
  segments,
  auditors,
  processes,
  summaries,
  selectedDate,
  auditDates,
  onSelectDate
}: AuditorLoadViewProps) {
  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const daySegments = segments.filter(s => s.date === dateStr);
  const chartWidth = TIMELINE_HOURS * HOUR_WIDTH;

  if (!selectedDate) {
    return (
      <div className="border-2 border-border bg-card p-8 text-center">
        <p className="text-muted-foreground font-mono">
          <BilingualLabel labelKey="selectAuditDay" />
        </p>
      </div>
    );
  }

  return (
    <div className="border-2 border-border bg-card">
      <div className="border-b-2 border-border p-4 flex items-center gap-4 flex-wrap">
        <h2 className="text-lg font-bold uppercase tracking-wide">
          <BilingualLabel labelKey="auditorLoadView" />
        </h2>
        <DateSwitcher
          selectedDate={selectedDate}
          auditDates={auditDates}
          onSelectDate={onSelectDate}
        />
        <div className="text-xs font-mono text-muted-foreground ml-auto">
          <BilingualText 
            en={`Capacity & availability control — Max ${HOURS_PER_DAY_LIMIT}h/day`}
            fr={`Contrôle capacité — Max ${HOURS_PER_DAY_LIMIT}h/jour`}
          />
        </div>
      </div>

      {/* View with frozen column */}
      <div className="flex">
        {/* Frozen column */}
        <div className="flex-shrink-0 border-r-2 border-border" style={{ width: FROZEN_COL_WIDTH }}>
          <div className="h-12 border-b-2 border-border bg-secondary p-2 font-bold text-sm flex items-center">
            <BilingualLabel labelKey="auditor" />
          </div>
          {auditors.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground font-mono text-sm">
              <BilingualLabel labelKey="noAuditors" />
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
                  style={{ height: AUDITOR_ROW_HEIGHT }}
                >
                  <div className="font-bold text-sm truncate">{auditor.name}</div>
                  <div className="text-xs font-mono text-muted-foreground mt-1 space-y-0.5">
                    <div>
                      <BilingualText en="Today" fr="Auj." showFr={false} />:{' '}
                      <span className={cn("font-bold", getDailyStatusClass(dayHours))}>
                        {formatHours(dayHours)}
                      </span> / {HOURS_PER_DAY_LIMIT}h
                    </div>
                    <div>
                      <BilingualText en="Total" fr="Total" showFr={false} />:{' '}
                      {summary ? formatHours(summary.totalHours) : '0h'}
                    </div>
                    <div>
                      <BilingualText en="MD" fr="JH" showFr={false} />:{' '}
                      {summary ? summary.mandaysUsed.toFixed(2) : '0'} / {auditor.maxMandays}
                    </div>
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
            <TimelineHeader />

            {/* Auditor rows */}
            {auditors.map(auditor => {
              const auditorDaySegments = daySegments.filter(s => s.auditorIds.includes(auditor.id));

              return (
                <div
                  key={auditor.id}
                  className="border-b border-border/50 relative"
                  style={{ height: AUDITOR_ROW_HEIGHT }}
                >
                  <TimelineGrid />

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

                    return (
                      <SegmentBar
                        key={segment.id}
                        startHour={segment.startHour}
                        duration={segment.duration}
                        status={status}
                        processName={process?.name}
                        showDetails={false}
                      />
                    );
                  })}
                </div>
              );
            })}

            {/* Empty state */}
            {auditors.length === 0 && (
              <div className="h-20 flex items-center justify-center text-muted-foreground font-mono text-sm">
                <BilingualLabel labelKey="noAuditors" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
