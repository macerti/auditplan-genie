import { cn } from '@/lib/utils';
import { formatTimeLabel, DEFAULT_START_HOUR, DEFAULT_END_HOUR } from '@/types/audit';
import { TIMELINE_HOURS, TIMELINE_START, HOUR_WIDTH } from '@/constants/timeline';

interface TimelineHeaderProps {
  className?: string;
}

export function TimelineHeader({ className }: TimelineHeaderProps) {
  return (
    <div className={cn("h-12 border-b-2 border-border bg-secondary flex relative", className)}>
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
  );
}
