import { useState } from 'react';
import { Auditor, ISOStandard, AuditorSummary, ComplianceStatus } from '@/types/audit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditorPanelProps {
  auditors: Auditor[];
  selectedStandards: ISOStandard[];
  onAdd: (auditor: Omit<Auditor, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Auditor>) => void;
  onRemove: (id: string) => void;
  summaries: AuditorSummary[];
}

const EAC_CODES = ['EA-01', 'EA-02', 'EA-03', 'EA-04', 'EA-17', 'EA-18', 'EA-28', 'EA-29', 'EA-31', 'EA-33'];

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

          <div>
            <Label className="block mb-2">EAC Sector Codes</Label>
            <div className="flex flex-wrap gap-2">
              {EAC_CODES.map(code => (
                <button
                  key={code}
                  type="button"
                  onClick={() => toggleEac(code)}
                  className={cn(
                    "px-2 py-1 text-xs font-mono border-2 transition-colors",
                    eacCodes.includes(code)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-accent"
                  )}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="max-mandays">Max Mandays</Label>
            <Input
              id="max-mandays"
              type="number"
              min={1}
              max={30}
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
                  <div>EAC: {auditor.eacCodes.join(', ') || 'None'}</div>
                  <div>
                    Mandays: {summary ? `${summary.mandaysUsed.toFixed(1)}` : '0'} / {auditor.maxMandays}
                    {summary && (
                      <span className="ml-2">({summary.totalHours}h)</span>
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
