import { cn } from '@/lib/utils';
import { DEFAULT_START_HOUR, DEFAULT_END_HOUR } from '@/types/audit';
import { TIMELINE_HOURS, TIMELINE_START, HOUR_WIDTH, QUARTER_WIDTH } from '@/constants/timeline';

interface TimelineGridProps {
  className?: string;
}

export function TimelineGrid({ className }: TimelineGridProps) {
  return (
    <div className={cn("absolute inset-0 flex", className)}>
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
  );
}
