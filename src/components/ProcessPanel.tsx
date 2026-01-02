import { useState } from 'react';
import { Process } from '@/types/audit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Cog } from 'lucide-react';
import { BilingualLabel, BilingualText } from '@/components/BilingualLabel';

interface ProcessPanelProps {
  processes: Process[];
  onAdd: (process: Omit<Process, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Process>) => void;
  onRemove: (id: string) => void;
}

export function ProcessPanel({ processes, onAdd, onUpdate, onRemove }: ProcessPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim() });
    setName('');
    setShowForm(false);
  };

  return (
    <div className="border-2 border-border p-4 bg-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold uppercase tracking-wide">
          <BilingualLabel labelKey="auditProcesses" />
        </h2>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="shadow-xs">
          <Plus className="w-4 h-4 mr-1" />
          <BilingualLabel labelKey="addProcess" showFr={false} />
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border-2 border-border p-4 mb-4 bg-secondary space-y-4">
          <div>
            <Label htmlFor="process-name">
              <BilingualLabel labelKey="processName" />
            </Label>
            <Input
              id="process-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Document Control, Opening Meeting"
              className="border-2"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm" className="shadow-xs">
              <BilingualText en="Save Process" fr="Enregistrer" showFr={false} />
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
              <BilingualText en="Cancel" fr="Annuler" showFr={false} />
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {processes.length === 0 && (
          <p className="text-muted-foreground text-sm font-mono">
            <BilingualLabel labelKey="noProcesses" />
          </p>
        )}
        {processes.map(process => (
          <div
            key={process.id}
            className="border-2 border-border p-3 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2">
              <Cog className="w-4 h-4" />
              <span className="font-bold">{process.name}</span>
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