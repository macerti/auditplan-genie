import { cn } from '@/lib/utils';
import { ComplianceStatus, formatTimeLabel, formatHours } from '@/types/audit';
import { HOUR_WIDTH, TIMELINE_START, QUARTER_WIDTH } from '@/constants/timeline';

interface SegmentBarProps {
  startHour: number;
  duration: number;
  status: ComplianceStatus;
  processName?: string;
  auditorNames?: string;
  showDetails?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onResizePointerDown?: (e: React.PointerEvent) => void;
  className?: string;
}

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

export function SegmentBar({
  startHour,
  duration,
  status,
  processName,
  auditorNames,
  showDetails = true,
  onPointerDown,
  onResizePointerDown,
  className,
}: SegmentBarProps) {
  const segmentLeft = (startHour - TIMELINE_START) * HOUR_WIDTH;
  const segmentWidth = duration * HOUR_WIDTH;

  return (
    <div
      className={cn(
        "absolute top-2 bottom-2 border-2 flex flex-col justify-center text-xs font-mono select-none px-2 z-10 touch-none",
        getStatusColor(status),
        "text-primary-foreground",
        onPointerDown && "cursor-move",
        className
      )}
      style={{
        left: Math.max(0, segmentLeft),
        width: Math.max(segmentWidth - 4, QUARTER_WIDTH)
      }}
      onPointerDown={onPointerDown}
    >
      {showDetails && processName && (
        <div className="font-bold truncate">{processName}</div>
      )}
      {showDetails && (
        <div className="flex items-center gap-2 text-[10px] opacity-90">
          <span>{formatTimeLabel(startHour)}-{formatTimeLabel(startHour + duration)}</span>
          <span>({formatHours(duration)})</span>
        </div>
      )}
      {showDetails && auditorNames && (
        <div className="truncate text-[10px] opacity-75">{auditorNames}</div>
      )}
      {!showDetails && processName && (
        <span className="truncate text-[10px]">{processName.slice(0, 12)}</span>
      )}
      {/* Resize handle */}
      {onResizePointerDown && (
        <div
          className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize bg-foreground/20 hover:bg-foreground/40 touch-none"
          onPointerDown={(e) => {
            e.stopPropagation();
            onResizePointerDown(e);
          }}
        />
      )}
    </div>
  );
}
