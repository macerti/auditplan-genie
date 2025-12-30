import { useRef, useState, useCallback } from 'react';
import { AuditSegment, Auditor, Process, AuditorSummary, ComplianceStatus, TIME_INCREMENT, formatHours, roundToIncrement } from '@/types/audit';
import { getSegmentComplianceStatus } from '@/lib/compliance';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, X } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface GanttChartProps {
  segments: AuditSegment[];
  auditors: Auditor[];
  processes: Process[];
  summaries: AuditorSummary[];
  days: number;
  onAddSegment: (segment: Omit<AuditSegment, 'id'>) => void;
  onUpdateSegment: (id: string, updates: Partial<AuditSegment>) => void;
  onRemoveSegment: (id: string) => void;
}

const HOURS_PER_DAY = 8;
const HOUR_WIDTH = 80; // Wider to accommodate 0.25h precision
const QUARTER_WIDTH = HOUR_WIDTH / 4;
const ROW_HEIGHT = 56;
const LEFT_LABEL_WIDTH = 240;

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

export function GanttChart({
  segments,
  auditors,
  processes,
  summaries,
  days,
  onAddSegment,
  onUpdateSegment,
  onRemoveSegment
}: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ id: string; startX: number; originalStart: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; startX: number; originalDuration: number } | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<string>('');
  const [selectedAuditors, setSelectedAuditors] = useState<string[]>([]);

  const totalHours = days * HOURS_PER_DAY;
  const chartWidth = totalHours * HOUR_WIDTH;

  const handleMouseDown = useCallback((e: React.MouseEvent, segmentId: string, type: 'drag' | 'resize') => {
    e.preventDefault();
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;

    if (type === 'drag') {
      setDragging({ id: segmentId, startX: e.clientX, originalStart: segment.startHour + (segment.day - 1) * HOURS_PER_DAY });
    } else {
      setResizing({ id: segmentId, startX: e.clientX, originalDuration: segment.duration });
    }
  }, [segments]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging) {
      const deltaX = e.clientX - dragging.startX;
      const deltaHours = roundToIncrement(deltaX / HOUR_WIDTH);
      const newAbsoluteStart = Math.max(0, Math.min(totalHours - TIME_INCREMENT, dragging.originalStart + deltaHours));
      const roundedStart = roundToIncrement(newAbsoluteStart);
      const newDay = Math.floor(roundedStart / HOURS_PER_DAY) + 1;
      const newStartHour = roundedStart % HOURS_PER_DAY;
      onUpdateSegment(dragging.id, { day: newDay, startHour: newStartHour });
    }
    if (resizing) {
      const deltaX = e.clientX - resizing.startX;
      const deltaHours = roundToIncrement(deltaX / HOUR_WIDTH);
      const newDuration = Math.max(TIME_INCREMENT, Math.min(HOURS_PER_DAY, roundToIncrement(resizing.originalDuration + deltaHours)));
      onUpdateSegment(resizing.id, { duration: newDuration });
    }
  }, [dragging, resizing, totalHours, onUpdateSegment]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setResizing(null);
  }, []);

  const toggleAuditorSelection = (auditorId: string) => {
    setSelectedAuditors(prev => 
      prev.includes(auditorId) 
        ? prev.filter(id => id !== auditorId)
        : [...prev, auditorId]
    );
  };

  const handleAddSegment = () => {
    if (!selectedProcess || selectedAuditors.length === 0) return;
    onAddSegment({
      processId: selectedProcess,
      auditorIds: selectedAuditors,
      day: 1,
      startHour: 0,
      duration: 2
    });
    setSelectedProcess('');
    setSelectedAuditors([]);
  };

  const removeAuditorFromSegment = (segmentId: string, auditorId: string) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;
    const newAuditorIds = segment.auditorIds.filter(id => id !== auditorId);
    if (newAuditorIds.length === 0) {
      onRemoveSegment(segmentId);
    } else {
      onUpdateSegment(segmentId, { auditorIds: newAuditorIds });
    }
  };

  // Group segments by row (process + segment combination for display)
  const segmentRows = segments.map((segment, idx) => ({
    segment,
    rowIndex: idx,
    process: processes.find(p => p.id === segment.processId),
    segmentAuditors: auditors.filter(a => segment.auditorIds.includes(a.id))
  }));

  return (
    <div className="border-2 border-border bg-card">
      <div className="border-b-2 border-border p-4 flex items-center gap-4 flex-wrap">
        <h2 className="text-lg font-bold uppercase tracking-wide">Audit Schedule (Process View)</h2>
        <div className="text-xs font-mono text-muted-foreground">
          Time precision: 0.25h (15 min)
        </div>
      </div>

      {/* Add segment form */}
      <div className="border-b-2 border-border p-4 bg-secondary/30">
        <div className="flex items-start gap-4 flex-wrap">
          <div>
            <Label className="text-xs mb-1 block">Process</Label>
            <Select value={selectedProcess} onValueChange={setSelectedProcess}>
              <SelectTrigger className="w-48 border-2">
                <SelectValue placeholder="Select process" />
              </SelectTrigger>
              <SelectContent>
                {processes.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Auditors (multi-select)</Label>
            <div className="flex flex-wrap gap-2 max-w-md">
              {auditors.map(a => (
                <div key={a.id} className="flex items-center gap-1">
                  <Checkbox
                    id={`seg-aud-${a.id}`}
                    checked={selectedAuditors.includes(a.id)}
                    onCheckedChange={() => toggleAuditorSelection(a.id)}
                    className="border-2"
                  />
                  <Label htmlFor={`seg-aud-${a.id}`} className="font-mono text-xs cursor-pointer">{a.name}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-end">
            <Button 
              onClick={handleAddSegment} 
              size="sm" 
              disabled={!selectedProcess || selectedAuditors.length === 0} 
              className="shadow-xs"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Segment
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 px-4 py-2 border-b-2 border-border text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-status-valid border-2 border-status-valid"></div>
          <span className="font-mono">Valid</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-status-warning border-2 border-status-warning"></div>
          <span className="font-mono">Warning</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-status-violation border-2 border-status-violation"></div>
          <span className="font-mono">Violation</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="overflow-x-auto"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Header row with hours */}
        <div className="flex border-b-2 border-border" style={{ minWidth: LEFT_LABEL_WIDTH + chartWidth }}>
          <div className="flex-shrink-0 border-r-2 border-border bg-secondary p-2 font-bold text-sm" style={{ width: LEFT_LABEL_WIDTH }}>
            Process / Auditors
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

        {/* Segment rows */}
        {segmentRows.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground font-mono">
            No audit segments. Add processes and auditors, then create segments above.
          </div>
        ) : (
          segmentRows.map(({ segment, rowIndex, process, segmentAuditors }) => {
            const status = getSegmentComplianceStatus(segment, auditors, process, summaries);
            const absoluteStart = (segment.day - 1) * HOURS_PER_DAY + segment.startHour;

            return (
              <div
                key={segment.id}
                className="flex border-b border-border/50 last:border-b-0"
                style={{ minWidth: LEFT_LABEL_WIDTH + chartWidth, height: ROW_HEIGHT }}
              >
                <div
                  className="flex-shrink-0 border-r-2 border-border bg-secondary/50 p-2 text-xs font-mono flex items-start justify-between gap-2"
                  style={{ width: LEFT_LABEL_WIDTH }}
                >
                  <div className="truncate flex-1 min-w-0">
                    <div className="font-bold truncate">{process?.name || 'Unknown'}</div>
                    <div className="text-muted-foreground truncate flex flex-wrap gap-1 mt-1">
                      {segmentAuditors.map(a => (
                        <span 
                          key={a.id} 
                          className="inline-flex items-center gap-0.5 bg-background px-1 py-0.5 border"
                        >
                          {a.name}
                          <button
                            onClick={() => removeAuditorFromSegment(segment.id, a.id)}
                            className="hover:text-status-violation ml-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemoveSegment(segment.id)}
                    className="border flex-shrink-0 h-6 w-6 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="relative flex-1" style={{ width: chartWidth }}>
                  {/* Grid lines for days */}
                  {Array.from({ length: days }).map((_, dayIndex) => (
                    <div
                      key={dayIndex}
                      className="absolute top-0 bottom-0 border-l-2 border-border/30"
                      style={{ left: dayIndex * HOURS_PER_DAY * HOUR_WIDTH }}
                    />
                  ))}
                  
                  {/* Quarter hour grid lines (subtle) */}
                  {Array.from({ length: totalHours * 4 }).map((_, qIdx) => (
                    qIdx % 4 !== 0 && (
                      <div
                        key={qIdx}
                        className="absolute top-0 bottom-0 border-l border-border/10"
                        style={{ left: qIdx * QUARTER_WIDTH }}
                      />
                    )
                  ))}

                  {/* Segment bar */}
                  <div
                    className={cn(
                      "absolute top-2 bottom-2 border-2 cursor-move flex items-center justify-between text-xs font-mono select-none px-2",
                      getStatusColor(status),
                      "text-primary-foreground"
                    )}
                    style={{
                      left: absoluteStart * HOUR_WIDTH,
                      width: Math.max(segment.duration * HOUR_WIDTH - 4, QUARTER_WIDTH)
                    }}
                    onMouseDown={e => handleMouseDown(e, segment.id, 'drag')}
                  >
                    <span className="truncate">{formatHours(segment.duration)}</span>
                    <span className="text-[10px] opacity-75">
                      {formatHours(segment.startHour)}-{formatHours(segment.startHour + segment.duration)}
                    </span>
                    {/* Resize handle */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize bg-foreground/20"
                      onMouseDown={e => {
                        e.stopPropagation();
                        handleMouseDown(e, segment.id, 'resize');
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
