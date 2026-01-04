import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TimeSelectProps {
  hourValue: string;
  minuteValue: string;
  onHourChange: (value: string) => void;
  onMinuteChange: (value: string) => void;
}

const MINUTE_OPTIONS = [0, 15, 30, 45] as const;

export function TimeSelect({
  hourValue,
  minuteValue,
  onHourChange,
  onMinuteChange,
}: TimeSelectProps) {
  const hourOptions = useMemo(() => Array.from({ length: 24 }).map((_, h) => h), []);

  return (
    <div className="flex gap-2">
      <Select value={hourValue} onValueChange={onHourChange}>
        <SelectTrigger className="w-20 border-2 font-mono">
          <SelectValue placeholder="08" />
        </SelectTrigger>
        <SelectContent>
          {hourOptions.map((h) => (
            <SelectItem key={h} value={String(h)} className="font-mono">
              {String(h).padStart(2, '0')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={minuteValue} onValueChange={onMinuteChange}>
        <SelectTrigger className="w-20 border-2 font-mono">
          <SelectValue placeholder="00" />
        </SelectTrigger>
        <SelectContent>
          {MINUTE_OPTIONS.map((m) => (
            <SelectItem key={m} value={String(m)} className="font-mono">
              {String(m).padStart(2, '0')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
