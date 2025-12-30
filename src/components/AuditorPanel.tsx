import { useState } from 'react';
import { Auditor, ISOStandard, AuditorSummary, ComplianceStatus, formatHours } from '@/types/audit';
import { EAC_CODES, getEACCodeShort } from '@/data/eacCodes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, User, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface AuditorPanelProps {
  auditors: Auditor[];
  selectedStandards: ISOStandard[];
  onAdd: (auditor: Omit<Auditor, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Auditor>) => void;
  onRemove: (id: string) => void;
  summaries: AuditorSummary[];
}

function getStatusClasses(status: ComplianceStatus) {
  switch (status) {
    case 'valid':
      return 'border-status-valid bg-status-valid-bg';
    case 'warning':
      return 'border-status-warning bg-status-warning-bg';
    case 'violation':
      return 'border-status-violation bg-status-violation-bg';
  }
}

export function AuditorPanel({ auditors, selectedStandards, onAdd, onUpdate, onRemove, summaries }: AuditorPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [eacCodes, setEacCodes] = useState<string[]>([]);
  const [qualifiedStandards, setQualifiedStandards] = useState<ISOStandard[]>([]);
  const [maxMandays, setMaxMandays] = useState(5);
  const [eacExpanded, setEacExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), eacCodes, qualifiedStandards, maxMandays });
    setName('');
    setEacCodes([]);
    setQualifiedStandards([]);
    setMaxMandays(5);
    setShowForm(false);
  };

  const toggleEac = (code: string) => {
    setEacCodes(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };

  const toggleStandard = (std: ISOStandard) => {
    setQualifiedStandards(prev => prev.includes(std) ? prev.filter(s => s !== std) : [...prev, std]);
  };

  return (
    <div className="border-2 border-border p-4 bg-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold uppercase tracking-wide">Audit Team</h2>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="shadow-xs">
          <Plus className="w-4 h-4 mr-1" />
          Add Auditor
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border-2 border-border p-4 mb-4 bg-secondary space-y-4">
          <div>
            <Label htmlFor="auditor-name">Name</Label>
            <Input
              id="auditor-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Auditor name"
              className="border-2"
            />
          </div>

          <div>
            <Label className="block mb-2">ISO Qualifications</Label>
            <div className="flex flex-wrap gap-3">
              {selectedStandards.map(std => (
                <div key={std} className="flex items-center gap-2">
                  <Checkbox
                    id={`qual-${std}`}
                    checked={qualifiedStandards.includes(std)}
                    onCheckedChange={() => toggleStandard(std)}
                    className="border-2"
                  />
                  <Label htmlFor={`qual-${std}`} className="font-mono text-xs cursor-pointer">{std}</Label>
                </div>
              ))}
            </div>
          </div>

          <Collapsible open={eacExpanded} onOpenChange={setEacExpanded}>
            <div className="flex items-center justify-between">
              <Label className="block">EAC Sector Codes ({eacCodes.length} selected)</Label>
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
                      eacCodes.includes(eac.code)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-accent"
                    )}
                    title={eac.name}
                  >
                    {getEACCodeShort(eac.code)}
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div>
            <Label htmlFor="max-mandays">Max Mandays</Label>
            <Input
              id="max-mandays"
              type="number"
              min={0.5}
              max={30}
              step={0.5}
              value={maxMandays}
              onChange={e => setMaxMandays(Number(e.target.value))}
              className="border-2 w-24"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm" className="shadow-xs">Save Auditor</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {auditors.length === 0 && (
          <p className="text-muted-foreground text-sm font-mono">No auditors defined</p>
        )}
        {auditors.map(auditor => {
          const summary = summaries.find(s => s.auditorId === auditor.id);
          return (
            <div
              key={auditor.id}
              className={cn(
                "border-2 p-3 flex items-start justify-between gap-4 transition-colors",
                summary ? getStatusClasses(summary.status) : "border-border"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4" />
                  <span className="font-bold">{auditor.name}</span>
                </div>
                <div className="text-xs font-mono space-y-1 text-muted-foreground">
                  <div>Standards: {auditor.qualifiedStandards.join(', ') || 'None'}</div>
                  <div className="truncate" title={auditor.eacCodes.map(c => getEACCodeShort(c)).join(', ')}>
                    EAC: {auditor.eacCodes.length > 0 ? auditor.eacCodes.map(c => getEACCodeShort(c)).join(', ') : 'None'}
                  </div>
                  <div>
                    Mandays: {summary ? `${summary.mandaysUsed.toFixed(2)}` : '0'} / {auditor.maxMandays}
                    {summary && (
                      <span className="ml-2">({formatHours(summary.totalHours)})</span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemove(auditor.id)}
                className="border-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
