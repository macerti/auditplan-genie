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
  /** Restrict hours to 8-18 (default for segment creation) */
  restrictedHours?: boolean;
}

const MINUTE_OPTIONS = [0, 15, 30, 45] as const;
const FULL_HOURS = Array.from({ length: 24 }, (_, h) => h);
const RESTRICTED_HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8-18

export function TimeSelect({
  hourValue,
  minuteValue,
  onHourChange,
  onMinuteChange,
  restrictedHours = true,
}: TimeSelectProps) {
  const hourOptions = restrictedHours ? RESTRICTED_HOURS : FULL_HOURS;

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
