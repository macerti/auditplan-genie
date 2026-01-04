import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { parseDecimalInput } from '@/types/audit';

interface DurationInputProps {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  step?: number;
  className?: string;
  inputClassName?: string;
}

export function DurationInput({
  value,
  onChange,
  min = 0.25,
  step = 0.25,
  className,
  inputClassName,
}: DurationInputProps) {
  const handleIncrement = (delta: number) => {
    const current = parseDecimalInput(value) || 0;
    const newVal = Math.max(min, current + delta);
    onChange(newVal.toString());
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`border-2 w-20 ${inputClassName}`}
        inputMode="decimal"
      />
      <div className="flex flex-col">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-5 px-1 border"
          onClick={() => handleIncrement(step)}
        >
          <ChevronUp className="w-3 h-3" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-5 px-1 border"
          onClick={() => handleIncrement(-step)}
        >
          <ChevronDown className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
