import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DateSwitcherProps {
  selectedDate: Date;
  auditDates: Date[];
  onSelectDate: (date: Date) => void;
}

export function DateSwitcher({ selectedDate, auditDates, onSelectDate }: DateSwitcherProps) {
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  if (auditDates.length === 0) {
    return (
      <span className="font-mono text-sm bg-secondary px-2 py-1 border-2">
        {format(selectedDate, 'EEEE, dd MMMM yyyy')}
      </span>
    );
  }

  return (
    <Select
      value={dateStr}
      onValueChange={(val) => {
        const next = auditDates.find(d => format(d, 'yyyy-MM-dd') === val);
        if (next) onSelectDate(next);
      }}
    >
      <SelectTrigger className="w-auto border-2 font-mono text-sm">
        <SelectValue placeholder={format(selectedDate, 'EEEE, dd MMMM yyyy')} />
      </SelectTrigger>
      <SelectContent>
        {auditDates.map((d, idx) => {
          const dStr = format(d, 'yyyy-MM-dd');
          return (
            <SelectItem key={dStr} value={dStr} className="font-mono">
              D{idx + 1}: {format(d, 'dd MMM yyyy')}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
