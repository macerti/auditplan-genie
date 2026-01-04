import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { format } from 'date-fns';
import {
  AuditSegment,
  Auditor,
  Process,
  AuditorSummary,
  TIME_INCREMENT,
  formatHours,
  roundToIncrement,
  formatTimeLabel,
  DEFAULT_START_HOUR,
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
import { Trash2, Plus, X, Pencil } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { BilingualLabel, BilingualText } from '@/components/BilingualLabel';
import { SegmentEditDialog } from '@/components/SegmentEditDialog';
import { 
  TimelineHeader, 
  TimelineGrid, 
  DateSwitcher, 
  StatusLegend, 
  SegmentBar 
} from '@/components/gantt';
import { DurationInput, TimeSelect } from '@/components/forms';
import {
  TIMELINE_START,
  TIMELINE_HOURS,
  HOUR_WIDTH,
  GANTT_ROW_HEIGHT,
  FROZEN_COL_WIDTH
} from '@/constants/timeline';

interface GanttChartProps {
  segments: AuditSegment[];
  auditors: Auditor[];
  processes: Process[];
  summaries: AuditorSummary[];
  selectedDate: Date | null;
  auditDates: Date[];
  onSelectDate: (date: Date) => void;
  onAddSegment: (segment: Omit<AuditSegment, 'id'>) => void;
  onUpdateSegment: (id: string, updates: Partial<AuditSegment>) => void;
  onRemoveSegment: (id: string) => void;
}

export function GanttChart({
  segments,
  auditors,
  processes,
  summaries,
  selectedDate,
  auditDates,
  onSelectDate,
  onAddSegment,
  onUpdateSegment,
  onRemoveSegment
}: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [dragging, setDragging] = useState<{ id: string; startX: number; originalStart: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; startX: number; originalDuration: number } | null>(null);

  const [selectedProcess, setSelectedProcess] = useState<string>('');
  const [selectedAuditors, setSelectedAuditors] = useState<string[]>([]);
  const [newStartHourStr, setNewStartHourStr] = useState<string>(String(DEFAULT_START_HOUR));
  const [newStartMinuteStr, setNewStartMinuteStr] = useState<string>('0');
  const [newDurationInput, setNewDurationInput] = useState('2');

  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);

  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const daySegments = segments.filter(s => s.date === dateStr);
  const chartWidth = TIMELINE_HOURS * HOUR_WIDTH;

  const handlePointerDown = useCallback((e: React.PointerEvent, segmentId: string, type: 'drag' | 'resize') => {
    e.preventDefault();
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;

    if (type === 'drag') {
      setDragging({ id: segmentId, startX: e.clientX, originalStart: segment.startHour });
    } else {
      setResizing({ id: segmentId, startX: e.clientX, originalDuration: segment.duration });
    }
  }, [segments]);

  useEffect(() => {
    if (!dragging && !resizing) return;

    const handlePointerMove = (e: PointerEvent) => {
      e.preventDefault();

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
    };

    const handlePointerUp = () => {
      setDragging(null);
      setResizing(null);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove as any);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [dragging, resizing, onUpdateSegment]);

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
    const startHour = (Number(newStartHourStr) || DEFAULT_START_HOUR) + (Number(newStartMinuteStr) || 0) / 60;

    onAddSegment({
      processId: selectedProcess,
      auditorIds: selectedAuditors,
      date: dateStr,
      startHour,
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

  // Group segments for display
  const segmentRows = daySegments.map((segment) => ({
    segment,
    process: processes.find(p => p.id === segment.processId),
    segmentAuditors: auditors.filter(a => segment.auditorIds.includes(a.id))
  }));

  const editingSegment = editingSegmentId ? segments.find(s => s.id === editingSegmentId) || null : null;
  const editingProcess = editingSegment ? processes.find(p => p.id === editingSegment.processId) : undefined;
  const editingAuditorNames = editingSegment
    ? auditors.filter(a => editingSegment.auditorIds.includes(a.id)).map(a => a.name).join(', ')
    : '';

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
      {/* Header */}
      <div className="border-b-2 border-border p-4 flex items-center gap-4 flex-wrap">
        <h2 className="text-lg font-bold uppercase tracking-wide">
          <BilingualLabel labelKey="auditSchedule" />
        </h2>
        <DateSwitcher
          selectedDate={selectedDate}
          auditDates={auditDates}
          onSelectDate={onSelectDate}
        />
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
              <BilingualText en="Start" fr="Début" />
            </Label>
            <TimeSelect
              hourValue={newStartHourStr}
              minuteValue={newStartMinuteStr}
              onHourChange={setNewStartHourStr}
              onMinuteChange={setNewStartMinuteStr}
            />
          </div>

          <div>
            <Label className="text-xs mb-1 block">
              <BilingualLabel labelKey="durationHours" />
            </Label>
            <DurationInput
              value={newDurationInput}
              onChange={setNewDurationInput}
            />
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

      <StatusLegend />

      {/* Gantt chart with frozen column */}
      <div className="flex">
        {/* Frozen column */}
        <div className="flex-shrink-0 border-r-2 border-border" style={{ width: FROZEN_COL_WIDTH }}>
          <div className="h-12 border-b-2 border-border bg-secondary p-2 font-bold text-sm flex items-center">
            <BilingualLabel labelKey="processAuditors" />
          </div>
          {segmentRows.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground font-mono text-sm">
              <BilingualLabel labelKey="noSegments" />
            </div>
          ) : (
            segmentRows.map(({ segment, process, segmentAuditors }) => (
              <div
                key={segment.id}
                className="border-b border-border/50 p-2 bg-secondary/50"
                style={{ height: GANTT_ROW_HEIGHT }}
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
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingSegmentId(segment.id)}
                      className="border flex-shrink-0 h-6 w-6 p-0"
                      title="Edit"
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
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
              </div>
            ))
          )}
        </div>

        {/* Scrollable timeline */}
        <div ref={containerRef} className="flex-1 overflow-x-auto">
          <div style={{ minWidth: chartWidth }}>
            <TimelineHeader />

            {/* Segment rows */}
            {segmentRows.map(({ segment, process, segmentAuditors }) => {
              const status = getSegmentComplianceStatus(segment, auditors, summaries);

              return (
                <div
                  key={segment.id}
                  className="border-b border-border/50 relative"
                  style={{ height: GANTT_ROW_HEIGHT }}
                >
                  <TimelineGrid />
                  <SegmentBar
                    startHour={segment.startHour}
                    duration={segment.duration}
                    status={status}
                    processName={process?.name}
                    auditorNames={segmentAuditors.map(a => a.name).join(', ')}
                    onPointerDown={e => handlePointerDown(e, segment.id, 'drag')}
                    onResizePointerDown={e => handlePointerDown(e, segment.id, 'resize')}
                  />
                </div>
              );
            })}

            {/* Empty state row */}
            {segmentRows.length === 0 && (
              <div className="h-20 flex items-center justify-center text-muted-foreground font-mono text-sm">
                <BilingualText
                  en="Add processes and auditors, then create segments above"
                  fr="Ajoutez processus et auditeurs, puis créez des segments ci-dessus"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <SegmentEditDialog
        open={!!editingSegmentId}
        onOpenChange={(open) => setEditingSegmentId(open ? editingSegmentId : null)}
        segment={editingSegment}
        title={editingProcess?.name || 'Unknown'}
        subtitle={editingSegment ? `${editingSegment.date} • ${editingAuditorNames}` : ''}
        onSave={(updates) => {
          if (!editingSegmentId) return;
          onUpdateSegment(editingSegmentId, updates);
        }}
      />
    </div>
  );
}
