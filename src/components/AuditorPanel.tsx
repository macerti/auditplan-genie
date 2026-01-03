import { useState } from 'react';
import { Auditor, AuditorSummary, ComplianceStatus, formatHours, parseDecimalInput } from '@/types/audit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, User, ChevronUp, ChevronDown, Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BilingualLabel, BilingualText } from '@/components/BilingualLabel';

interface AuditorPanelProps {
  auditors: Auditor[];
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

export function AuditorPanel({ auditors, onAdd, onUpdate, onRemove, summaries }: AuditorPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [maxMandaysInput, setMaxMandaysInput] = useState('5');
  const [editingAuditorId, setEditingAuditorId] = useState<string | null>(null);
  const [editingMaxMandays, setEditingMaxMandays] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const maxMandays = parseDecimalInput(maxMandaysInput) || 5;
    onAdd({ name: name.trim(), maxMandays });
    setName('');
    setMaxMandaysInput('5');
    setShowForm(false);
  };

  const handleMandaysIncrement = (delta: number) => {
    const current = parseDecimalInput(maxMandaysInput) || 0;
    const newVal = Math.max(0.25, current + delta);
    setMaxMandaysInput(newVal.toString());
  };

  const startEditingMandays = (auditor: Auditor) => {
    setEditingAuditorId(auditor.id);
    setEditingMaxMandays(auditor.maxMandays.toString());
  };

  const saveEditingMandays = () => {
    if (!editingAuditorId) return;
    const newMaxMandays = parseDecimalInput(editingMaxMandays);
    if (newMaxMandays && newMaxMandays > 0) {
      onUpdate(editingAuditorId, { maxMandays: newMaxMandays });
    }
    setEditingAuditorId(null);
    setEditingMaxMandays('');
  };

  const cancelEditingMandays = () => {
    setEditingAuditorId(null);
    setEditingMaxMandays('');
  };

  const handleEditMandaysIncrement = (delta: number) => {
    const current = parseDecimalInput(editingMaxMandays) || 0;
    const newVal = Math.max(0.25, current + delta);
    setEditingMaxMandays(newVal.toString());
  };

  return (
    <div className="border-2 border-border p-4 bg-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold uppercase tracking-wide">
          <BilingualLabel labelKey="auditTeam" />
        </h2>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="shadow-xs">
          <Plus className="w-4 h-4 mr-1" />
          <BilingualLabel labelKey="addAuditor" showFr={false} />
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border-2 border-border p-4 mb-4 bg-secondary space-y-4">
          <div>
            <Label htmlFor="auditor-name">
              <BilingualLabel labelKey="name" />
            </Label>
            <Input
              id="auditor-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Auditor name / Nom de l'auditeur"
              className="border-2"
            />
          </div>

          <div>
            <Label htmlFor="max-mandays">
              <BilingualText en="Max Mandays (0.25 increments)" fr="Jours-homme max (incréments de 0,25)" />
            </Label>
            <div className="flex items-center gap-1">
              <Input
                id="max-mandays"
                value={maxMandaysInput}
                onChange={e => setMaxMandaysInput(e.target.value)}
                className="border-2 w-24"
                placeholder="e.g. 3,5"
              />
              <div className="flex flex-col">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="h-5 px-1 border"
                  onClick={() => handleMandaysIncrement(0.25)}
                >
                  <ChevronUp className="w-3 h-3" />
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="h-5 px-1 border"
                  onClick={() => handleMandaysIncrement(-0.25)}
                >
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <BilingualText 
                en="Use comma or dot as decimal (e.g., 3,5 or 3.5)" 
                fr="Virgule ou point pour décimales (ex: 3,5 ou 3.5)"
              />
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm" className="shadow-xs">
              <BilingualText en="Save Auditor" fr="Enregistrer" showFr={false} />
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
              <BilingualText en="Cancel" fr="Annuler" showFr={false} />
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {auditors.length === 0 && (
          <p className="text-muted-foreground text-sm font-mono">
            <BilingualLabel labelKey="noAuditors" />
          </p>
        )}
        {auditors.map(auditor => {
          const summary = summaries.find(s => s.auditorId === auditor.id);
          const isEditing = editingAuditorId === auditor.id;
          
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
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <BilingualText en="Max MD" fr="JH max" showFr={false} />:{' '}
                      <Input
                        value={editingMaxMandays}
                        onChange={e => setEditingMaxMandays(e.target.value)}
                        className="border w-16 h-6 text-xs px-1"
                        inputMode="decimal"
                        autoFocus
                      />
                      <div className="flex flex-col">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="h-4 px-0.5 border"
                          onClick={() => handleEditMandaysIncrement(0.25)}
                        >
                          <ChevronUp className="w-2 h-2" />
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="h-4 px-0.5 border"
                          onClick={() => handleEditMandaysIncrement(-0.25)}
                        >
                          <ChevronDown className="w-2 h-2" />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={saveEditingMandays}
                      >
                        <Check className="w-3 h-3 text-status-valid" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={cancelEditingMandays}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <BilingualText en="Mandays" fr="J-H" showFr={false} />:{' '}
                      {summary ? `${summary.mandaysUsed.toFixed(2)}` : '0'} / {auditor.maxMandays}
                      {summary && (
                        <span className="ml-2">({formatHours(summary.totalHours)})</span>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 ml-1"
                        onClick={() => startEditingMandays(auditor)}
                        title="Edit max mandays"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  {summary && summary.status === 'valid' && summary.totalHours > 0 && !isEditing && (
                    <div className="text-status-valid font-bold">
                      ✓ <BilingualLabel labelKey="compliant" showFr={false} />
                    </div>
                  )}
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