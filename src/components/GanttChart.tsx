import { useRef, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { 
  AuditSegment, 
  Auditor, 
  Process, 
  AuditorSummary, 
  ComplianceStatus, 
  TIME_INCREMENT, 
  formatHours, 
  roundToIncrement,
  formatTimeLabel,
  DEFAULT_START_HOUR,
  DEFAULT_END_HOUR,
  parseDecimalInput
} from '@/types/audit';
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
import { Input } from '@/components/ui/input';
import { Trash2, Plus, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { BilingualLabel, BilingualText } from '@/components/BilingualLabel';

interface GanttChartProps {
  segments: AuditSegment[];
  auditors: Auditor[];
  processes: Process[];
  summaries: AuditorSummary[];
  selectedDate: Date | null;
  onAddSegment: (segment: Omit<AuditSegment, 'id'>) => void;
  onUpdateSegment: (id: string, updates: Partial<AuditSegment>) => void;
  onRemoveSegment: (id: string) => void;
}

// Timeline configuration
const TIMELINE_START = 6; // 06:00
const TIMELINE_END = 18; // 18:00
const TIMELINE_HOURS = TIMELINE_END - TIMELINE_START;
const HOUR_WIDTH = 100; // pixels per hour
const QUARTER_WIDTH = HOUR_WIDTH / 4;
const ROW_HEIGHT = 80;
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

export function GanttChart({
  segments,
  auditors,
  processes,
  summaries,
  selectedDate,
  onAddSegment,
  onUpdateSegment,
  onRemoveSegment
}: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ id: string; startX: number; originalStart: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; startX: number; originalDuration: number } | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<string>('');
  const [selectedAuditors, setSelectedAuditors] = useState<string[]>([]);
  const [newDurationInput, setNewDurationInput] = useState('2');

  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const daySegments = segments.filter(s => s.date === dateStr);
  const chartWidth = TIMELINE_HOURS * HOUR_WIDTH;

  const handleMouseDown = useCallback((e: React.MouseEvent, segmentId: string, type: 'drag' | 'resize') => {
    e.preventDefault();
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;

    if (type === 'drag') {
      setDragging({ id: segmentId, startX: e.clientX, originalStart: segment.startHour });
    } else {
      setResizing({ id: segmentId, startX: e.clientX, originalDuration: segment.duration });
    }
  }, [segments]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging) {
      const deltaX = e.clientX - dragging.startX;
      const deltaHours = roundToIncrement(deltaX / HOUR_WIDTH);
      const newStart = Math.max(0, roundToIncrement(dragging.originalStart + deltaHours));
      onUpdateSegment(dragging.id, { startHour: newStart });
    }
    if (resizing) {
      const deltaX = e.clientX - resizing.startX;
      const deltaHours = roundToIncrement(deltaX / HOUR_WIDTH);
      const newDuration = Math.max(TIME_INCREMENT, roundToIncrement(resizing.originalDuration + deltaHours));
      onUpdateSegment(resizing.id, { duration: newDuration });
    }
  }, [dragging, resizing, onUpdateSegment]);

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
    if (!selectedProcess || selectedAuditors.length === 0 || !dateStr) return;
    const duration = parseDecimalInput(newDurationInput) || 2;
    onAddSegment({
      processId: selectedProcess,
      auditorIds: selectedAuditors,
      date: dateStr,
      startHour: DEFAULT_START_HOUR,
      duration
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

  const handleDurationIncrement = (delta: number) => {
    const current = parseDecimalInput(newDurationInput) || 0;
    const newVal = Math.max(0.25, current + delta);
    setNewDurationInput(newVal.toString());
  };

  // Group segments for display
  const segmentRows = daySegments.map((segment, idx) => ({
    segment,
    rowIndex: idx,
    process: processes.find(p => p.id === segment.processId),
    segmentAuditors: auditors.filter(a => segment.auditorIds.includes(a.id))
  }));

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
          <BilingualLabel labelKey="auditSchedule" />
        </h2>
        <span className="font-mono text-sm bg-secondary px-2 py-1 border-2">
          {format(selectedDate, 'EEEE, dd MMMM yyyy')}
        </span>
        <div className="text-xs font-mono text-muted-foreground ml-auto">
          <BilingualLabel labelKey="timePrecision" />
        </div>
      </div>

      {/* Add segment form */}
      <div className="border-b-2 border-border p-4 bg-secondary/30">
        <div className="flex items-start gap-4 flex-wrap">
          <div>
            <Label className="text-xs mb-1 block">
              <BilingualLabel labelKey="process" />
            </Label>
            <Select value={selectedProcess} onValueChange={setSelectedProcess}>
              <SelectTrigger className="w-48 border-2">
                <SelectValue placeholder="Select process / Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {processes.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">
              <BilingualLabel labelKey="durationHours" />
            </Label>
            <div className="flex items-center gap-1">
              <Input
                value={newDurationInput}
                onChange={e => setNewDurationInput(e.target.value)}
                className="border-2 w-20"
                placeholder="2"
              />
              <div className="flex flex-col">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="h-5 px-1 border"
                  onClick={() => handleDurationIncrement(0.25)}
                >
                  <ChevronUp className="w-3 h-3" />
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="h-5 px-1 border"
                  onClick={() => handleDurationIncrement(-0.25)}
                >
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">
              <BilingualLabel labelKey="multiSelect" />
            </Label>
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
              <BilingualLabel labelKey="addSegment" showFr={false} />
            </Button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-b-2 border-border text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-status-valid border-2 border-status-valid"></div>
          <span className="font-mono"><BilingualLabel labelKey="ok" showFr={false} /></span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-status-warning border-2 border-status-warning"></div>
          <span className="font-mono"><BilingualLabel labelKey="warning" showFr={false} /></span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-status-violation border-2 border-status-violation"></div>
          <span className="font-mono"><BilingualLabel labelKey="violation" showFr={false} /></span>
        </div>
      </div>

      {/* Gantt chart with frozen column */}
      <div className="flex">
        {/* Frozen column */}
        <div className="flex-shrink-0 border-r-2 border-border" style={{ width: FROZEN_COL_WIDTH }}>
          {/* Header */}
          <div className="h-12 border-b-2 border-border bg-secondary p-2 font-bold text-sm flex items-center">
            <BilingualLabel labelKey="processAuditors" />
          </div>
          {/* Rows */}
          {segmentRows.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground font-mono text-sm">
              <BilingualLabel labelKey="noSegments" />
            </div>
          ) : (
            segmentRows.map(({ segment, process, segmentAuditors }) => (
              <div
                key={segment.id}
                className="border-b border-border/50 p-2 bg-secondary/50"
                style={{ height: ROW_HEIGHT }}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{process?.name || 'Unknown'}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {segmentAuditors.map(a => (
                        <span 
                          key={a.id} 
                          className="inline-flex items-center gap-0.5 bg-background px-1 py-0.5 border text-xs"
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
              </div>
            ))
          )}
        </div>

        {/* Scrollable timeline */}
        <div
          ref={containerRef}
          className="flex-1 overflow-x-auto"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
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

            {/* Segment rows */}
            {segmentRows.map(({ segment, process, segmentAuditors }) => {
              const status = getSegmentComplianceStatus(segment, auditors, summaries);
              const segmentLeft = (segment.startHour - TIMELINE_START) * HOUR_WIDTH;
              const segmentWidth = segment.duration * HOUR_WIDTH;

              return (
                <div
                  key={segment.id}
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

                  {/* Segment bar */}
                  <div
                    className={cn(
                      "absolute top-2 bottom-2 border-2 cursor-move flex flex-col justify-center text-xs font-mono select-none px-2 z-10",
                      getStatusColor(status),
                      "text-primary-foreground"
                    )}
                    style={{
                      left: Math.max(0, segmentLeft),
                      width: Math.max(segmentWidth - 4, QUARTER_WIDTH)
                    }}
                    onMouseDown={e => handleMouseDown(e, segment.id, 'drag')}
                  >
                    <div className="font-bold truncate">{process?.name}</div>
                    <div className="flex items-center gap-2 text-[10px] opacity-90">
                      <span>{formatTimeLabel(segment.startHour)}-{formatTimeLabel(segment.startHour + segment.duration)}</span>
                      <span>({formatHours(segment.duration)})</span>
                    </div>
                    <div className="truncate text-[10px] opacity-75">
                      {segmentAuditors.map(a => a.name).join(', ')}
                    </div>
                    {/* Resize handle */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize bg-foreground/20 hover:bg-foreground/40"
                      onMouseDown={e => {
                        e.stopPropagation();
                        handleMouseDown(e, segment.id, 'resize');
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Empty state row */}
            {segmentRows.length === 0 && (
              <div className="h-20 flex items-center justify-center text-muted-foreground font-mono text-sm">
                Add processes and auditors, then create segments above
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
