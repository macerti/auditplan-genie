import { useState } from 'react';
import { Process, ISOStandard } from '@/types/audit';
import { EAC_CODES, getEACCodeShort } from '@/data/eacCodes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Cog, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ProcessPanelProps {
  processes: Process[];
  selectedStandards: ISOStandard[];
  onAdd: (process: Omit<Process, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Process>) => void;
  onRemove: (id: string) => void;
}

export function ProcessPanel({ processes, selectedStandards, onAdd, onUpdate, onRemove }: ProcessPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [requiredStandards, setRequiredStandards] = useState<ISOStandard[]>([]);
  const [requiredEacCodes, setRequiredEacCodes] = useState<string[]>([]);
  const [eacExpanded, setEacExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), requiredStandards, requiredEacCodes });
    setName('');
    setRequiredStandards([]);
    setRequiredEacCodes([]);
    setShowForm(false);
  };

  const toggleStandard = (std: ISOStandard) => {
    setRequiredStandards(prev => prev.includes(std) ? prev.filter(s => s !== std) : [...prev, std]);
  };

  const toggleEac = (code: string) => {
    setRequiredEacCodes(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };

  return (
    <div className="border-2 border-border p-4 bg-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold uppercase tracking-wide">Audit Processes</h2>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="shadow-xs">
          <Plus className="w-4 h-4 mr-1" />
          Add Process
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border-2 border-border p-4 mb-4 bg-secondary space-y-4">
          <div>
            <Label htmlFor="process-name">Process Name</Label>
            <Input
              id="process-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Document Control"
              className="border-2"
            />
          </div>

          <div>
            <Label className="block mb-2">Required ISO Standards</Label>
            <div className="flex flex-wrap gap-3">
              {selectedStandards.map(std => (
                <div key={std} className="flex items-center gap-2">
                  <Checkbox
                    id={`proc-std-${std}`}
                    checked={requiredStandards.includes(std)}
                    onCheckedChange={() => toggleStandard(std)}
                    className="border-2"
                  />
                  <Label htmlFor={`proc-std-${std}`} className="font-mono text-xs cursor-pointer">{std}</Label>
                </div>
              ))}
            </div>
          </div>

          <Collapsible open={eacExpanded} onOpenChange={setEacExpanded}>
            <div className="flex items-center justify-between">
              <Label className="block">Required EAC Codes ({requiredEacCodes.length} selected) — Optional</Label>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" type="button">
                  {eacExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <div className="flex flex-wrap gap-1 mt-2 max-h-48 overflow-y-auto border p-2">
                {EAC_CODES.map(eac => (
                  <button
                    key={eac.code}
                    type="button"
                    onClick={() => toggleEac(eac.code)}
                    className={cn(
                      "px-2 py-1 text-xs font-mono border transition-colors text-left",
                      requiredEacCodes.includes(eac.code)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-accent"
                    )}
                    title={eac.name}
                  >
                    {getEACCodeShort(eac.code)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty for processes without sector requirements (e.g., opening/closing meetings)
              </p>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex gap-2">
            <Button type="submit" size="sm" className="shadow-xs">Save Process</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {processes.length === 0 && (
          <p className="text-muted-foreground text-sm font-mono">No processes defined</p>
        )}
        {processes.map(process => (
          <div
            key={process.id}
            className="border-2 border-border p-3 flex items-start justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Cog className="w-4 h-4" />
                <span className="font-bold">{process.name}</span>
              </div>
              <div className="text-xs font-mono space-y-1 text-muted-foreground">
                <div>Standards: {process.requiredStandards.join(', ') || 'None'}</div>
                <div className="truncate" title={process.requiredEacCodes.map(c => getEACCodeShort(c)).join(', ')}>
                  EAC: {process.requiredEacCodes.length > 0 ? process.requiredEacCodes.map(c => getEACCodeShort(c)).join(', ') : 'No requirement'}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemove(process.id)}
              className="border-2"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
