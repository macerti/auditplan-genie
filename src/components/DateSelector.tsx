/**
 * DateSelector Component
 * 
 * Allows users to select and manage audit dates.
 * Features:
 * - Calendar picker for adding new dates
 * - Visual indication of selected date
 * - Click to select, X to remove
 */

import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BilingualLabel, BilingualText } from '@/components/BilingualLabel';
import { toDateStr, formatDisplayDate } from '@/lib/dateUtils';

interface DateSelectorProps {
  auditDates: Date[];
  selectedDate: Date | null;
  onAddDate: (date: Date) => void;
  onRemoveDate: (date: Date) => void;
  onSelectDate: (date: Date) => void;
}

export function DateSelector({
  auditDates,
  selectedDate,
  onAddDate,
  onRemoveDate,
  onSelectDate
}: DateSelectorProps) {
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onAddDate(date);
    }
  };

  const disabledDates = (date: Date) => {
    return auditDates.some(d => toDateStr(d) === toDateStr(date));
  };

  return (
    <div className="border-2 border-border p-4 bg-card">
      <h2 className="text-lg font-bold mb-3 uppercase tracking-wide">
        <BilingualLabel labelKey="auditDays" />
      </h2>
      
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
            const dateStr = toDateStr(date);
            const isSelected = selectedDate && toDateStr(selectedDate) === dateStr;
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
                  D{idx + 1}: {formatDisplayDate(date)}
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
          en="Max 7h/day per auditor • 1 manday = 7h • Click a date to view/edit" 
          fr="Max 7h/jour par auditeur • 1 jour-homme = 7h • Cliquer pour voir/éditer"
        />
      </p>
    </div>
  );
}