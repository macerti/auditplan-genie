import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X, Pencil, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BilingualLabel, BilingualText } from '@/components/BilingualLabel';
import { parseDecimalInput, formatHours, HOURS_PER_MANDAY } from '@/types/audit';

interface DateSelectorProps {
  auditDates: Date[];
  selectedDate: Date | null;
  onAddDate: (date: Date) => void;
  onRemoveDate: (date: Date) => void;
  onSelectDate: (date: Date) => void;
  totalRequiredMandays: number | null;
  onSetTotalRequiredMandays: (value: number | null) => void;
  auditorMandaysSum: number;
  effectiveTotalMandays: number;
}

export function DateSelector({
  auditDates,
  selectedDate,
  onAddDate,
  onRemoveDate,
  onSelectDate,
  totalRequiredMandays,
  onSetTotalRequiredMandays,
  auditorMandaysSum,
  effectiveTotalMandays
}: DateSelectorProps) {
  const [isEditingMandays, setIsEditingMandays] = useState(false);
  const [mandaysInput, setMandaysInput] = useState('');

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onAddDate(date);
    }
  };

  const disabledDates = (date: Date) => {
    return auditDates.some(d => format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
  };

  const startEditingMandays = () => {
    setMandaysInput(totalRequiredMandays?.toString() ?? '');
    setIsEditingMandays(true);
  };

  const saveMandays = () => {
    const value = mandaysInput.trim();
    if (value === '') {
      onSetTotalRequiredMandays(null); // Auto mode
    } else {
      const parsed = parseDecimalInput(value);
      if (parsed && parsed > 0) {
        onSetTotalRequiredMandays(parsed);
      }
    }
    setIsEditingMandays(false);
  };

  const cancelEditMandays = () => {
    setIsEditingMandays(false);
    setMandaysInput('');
  };

  // Calculate partial day info
  const fullDays = Math.floor(effectiveTotalMandays);
  const partialDay = effectiveTotalMandays - fullDays;
  const partialHours = partialDay * HOURS_PER_MANDAY;

  return (
    <div className="border-2 border-border p-4 bg-card">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
        <h2 className="text-lg font-bold uppercase tracking-wide">
          <BilingualLabel labelKey="auditDays" />
        </h2>
        
        {/* Total Required Mandays */}
        <div className="flex items-center gap-2 border-2 border-border px-3 py-1.5 bg-secondary">
          <span className="text-xs font-mono text-muted-foreground">
            <BilingualText en="Total MD" fr="JH Total" showFr={false} />:
          </span>
          {isEditingMandays ? (
            <div className="flex items-center gap-1">
              <Input
                value={mandaysInput}
                onChange={e => setMandaysInput(e.target.value)}
                placeholder="Auto"
                className="border w-16 h-6 text-xs px-1"
                inputMode="decimal"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') saveMandays();
                  if (e.key === 'Escape') cancelEditMandays();
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={saveMandays}
              >
                <Check className="w-3 h-3 text-status-valid" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={cancelEditMandays}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="font-bold font-mono text-sm">
                {effectiveTotalMandays.toFixed(2)}
              </span>
              {totalRequiredMandays === null && auditorMandaysSum > 0 && (
                <span className="text-[10px] text-muted-foreground">(auto)</span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 ml-1"
                onClick={startEditingMandays}
                title="Edit total mandays"
              >
                <Pencil className="w-3 h-3" />
              </Button>
            </div>
          )}
          {partialDay > 0 && (
            <span className="text-[10px] text-muted-foreground border-l border-border pl-2 ml-1">
              {fullDays} <BilingualText en="days" fr="jours" showFr={false} /> + {formatHours(partialHours)}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-start gap-4 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="border-2">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <BilingualLabel labelKey="addDate" showFr={false} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              onSelect={handleSelect}
              disabled={disabledDates}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <div className="flex flex-wrap gap-2">
          {auditDates.length === 0 && (
            <p className="text-muted-foreground text-sm font-mono">
              <BilingualText en="No dates selected" fr="Aucune date sélectionnée" />
            </p>
          )}
          {auditDates.map((date, idx) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateStr;
            const isLastDay = idx === auditDates.length - 1;
            const isPartialDay = isLastDay && partialDay > 0;
            
            return (
              <div
                key={dateStr}
                className={cn(
                  "flex items-center gap-1 border-2 px-2 py-1 cursor-pointer transition-colors",
                  isSelected 
                    ? "border-primary bg-primary/10" 
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => onSelectDate(date)}
              >
                <span className="font-mono text-sm">
                  D{idx + 1}: {format(date, 'dd MMM yyyy')}
                  {isPartialDay && (
                    <span className="ml-1 text-[10px] text-muted-foreground">
                      ({formatHours(partialHours)})
                    </span>
                  )}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveDate(date);
                  }}
                  className="hover:text-destructive ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground font-mono mt-3">
        <BilingualText 
          en="Max 7h/day per auditor • 1 manday = 7h • Last day can be partial if total MD requires it" 
          fr="Max 7h/jour par auditeur • 1 jour-homme = 7h • Dernier jour partiel si JH total l'exige"
        />
      </p>
    </div>
  );
}