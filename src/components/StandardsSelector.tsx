import { ISOStandard } from '@/types/audit';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface StandardsSelectorProps {
  allStandards: ISOStandard[];
  selectedStandards: ISOStandard[];
  onToggle: (standard: ISOStandard) => void;
}

export function StandardsSelector({ allStandards, selectedStandards, onToggle }: StandardsSelectorProps) {
  return (
    <div className="border-2 border-border p-4 bg-card">
      <h2 className="text-lg font-bold mb-3 uppercase tracking-wide">Audit Standards in Scope</h2>
      <div className="flex flex-wrap gap-4">
        {allStandards.map(standard => (
          <div key={standard} className="flex items-center gap-2">
            <Checkbox
              id={standard}
              checked={selectedStandards.includes(standard)}
              onCheckedChange={() => onToggle(standard)}
              className="border-2"
            />
            <Label htmlFor={standard} className="font-mono text-sm cursor-pointer">
              {standard}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
