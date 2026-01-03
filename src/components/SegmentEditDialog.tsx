import { useEffect, useMemo, useState } from "react";
import { AuditSegment, parseDecimalInput } from "@/types/audit";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronUp } from "lucide-react";
import { BilingualText } from "@/components/BilingualLabel";

interface SegmentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment: AuditSegment | null;
  title: string;
  subtitle: string;
  onSave: (updates: Pick<AuditSegment, "startHour" | "duration">) => void;
}

const MINUTES_OPTIONS = [0, 15, 30, 45] as const;

export function SegmentEditDialog({
  open,
  onOpenChange,
  segment,
  title,
  subtitle,
  onSave,
}: SegmentEditDialogProps) {
  const [hourStr, setHourStr] = useState("8");
  const [minuteStr, setMinuteStr] = useState("0");
  const [durationInput, setDurationInput] = useState("2");

  const hourOptions = useMemo(() => Array.from({ length: 24 }).map((_, h) => h), []);

  useEffect(() => {
    if (!segment) return;
    const h = Math.floor(segment.startHour);
    const m = Math.round((segment.startHour - h) * 60);
    const snappedM = MINUTES_OPTIONS.includes(m as any) ? m : 0;
    setHourStr(String(h));
    setMinuteStr(String(snappedM));
    setDurationInput(String(segment.duration));
  }, [segment]);

  const handleDurationIncrement = (delta: number) => {
    const current = parseDecimalInput(durationInput) ?? 0;
    const next = Math.max(0.25, current + delta);
    setDurationInput(String(next));
  };

  const handleSave = () => {
    if (!segment) return;
    const h = Number(hourStr);
    const m = Number(minuteStr);
    const startHour = h + m / 60;
    const duration = parseDecimalInput(durationInput) ?? segment.duration;

    onSave({ startHour, duration });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-2">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase text-sm">
            <BilingualText en="Edit Segment" fr="Modifier segment" showFr={false} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-border bg-secondary/30 p-3">
            <div className="font-bold text-sm">{title}</div>
            <div className="text-xs font-mono text-muted-foreground mt-1">{subtitle}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">
                <BilingualText en="Start time" fr="Heure de début" />
              </Label>
              <div className="mt-1 flex gap-2">
                <Select value={hourStr} onValueChange={setHourStr}>
                  <SelectTrigger className="border-2 font-mono">
                    <SelectValue placeholder="08" />
                  </SelectTrigger>
                  <SelectContent>
                    {hourOptions.map((h) => (
                      <SelectItem key={h} value={String(h)} className="font-mono">
                        {String(h).padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={minuteStr} onValueChange={setMinuteStr}>
                  <SelectTrigger className="border-2 font-mono">
                    <SelectValue placeholder="00" />
                  </SelectTrigger>
                  <SelectContent>
                    {MINUTES_OPTIONS.map((m) => (
                      <SelectItem key={m} value={String(m)} className="font-mono">
                        {String(m).padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono mt-1">
                <BilingualText en="15-minute increments" fr="Incréments de 15 minutes" showFr={false} />
              </p>
            </div>

            <div>
              <Label className="text-xs">
                <BilingualText en="Duration (hours)" fr="Durée (heures)" />
              </Label>
              <div className="mt-1 flex items-center gap-1">
                <Input
                  value={durationInput}
                  onChange={(e) => setDurationInput(e.target.value)}
                  className="border-2 font-mono"
                  inputMode="decimal"
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
              <p className="text-[11px] text-muted-foreground font-mono mt-1">
                <BilingualText en="Comma or dot accepted" fr="Virgule ou point acceptés" showFr={false} />
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            <BilingualText en="Cancel" fr="Annuler" showFr={false} />
          </Button>
          <Button type="button" onClick={handleSave}>
            <BilingualText en="Save" fr="Enregistrer" showFr={false} />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
