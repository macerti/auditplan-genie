import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Save, FolderOpen, FilePlus2, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { BilingualLabel } from '@/components/BilingualLabel';
import { labels } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import {
  PlanPayload,
  PlanSummary,
  checkHealth,
  createPlan,
  updatePlan,
  deletePlan,
  listPlans,
  getPlan,
} from '@/lib/api';

interface PlanBarProps {
  getSnapshot: () => PlanPayload;
  loadSnapshot: (data: PlanPayload) => void;
}

/**
 * Toolbar for saving/loading named audit plans against the MariaDB
 * backend. The current working state (auditors/processes/segments/dates)
 * always keeps auto-saving to localStorage as before — this bar adds an
 * explicit, opt-in "Save to database" / "Load from database" layer on
 * top of that, so the tool keeps working offline even if the backend
 * (api/config.php) hasn't been configured yet.
 */
export function PlanBar({ getSnapshot, loadSnapshot }: PlanBarProps) {
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);
  const [currentPlanName, setCurrentPlanName] = useState('');
  const [saving, setSaving] = useState(false);

  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const [loadOpen, setLoadOpen] = useState(false);
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    checkHealth().then(ok => {
      if (!cancelled) setBackendOnline(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const doSave = async (id: number | null, name: string) => {
    setSaving(true);
    try {
      const payload = getSnapshot();
      if (id === null) {
        const newId = await createPlan(name, payload);
        setCurrentPlanId(newId);
        setCurrentPlanName(name);
        toast.success(`"${name}" ${labels.savePlan.fr.toLowerCase()} ✓`);
      } else {
        await updatePlan(id, { name, payload });
        setCurrentPlanName(name);
        toast.success(`"${name}" mis à jour ✓`);
      }
      setBackendOnline(true);
    } catch (err) {
      setBackendOnline(false);
      toast.error(err instanceof Error ? err.message : 'Échec de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClick = () => {
    if (currentPlanId === null) {
      setNameInput(currentPlanName);
      setNameDialogOpen(true);
      return;
    }
    void doSave(currentPlanId, currentPlanName);
  };

  const handleConfirmName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setNameDialogOpen(false);
    void doSave(currentPlanId, trimmed);
  };

  const openLoadDialog = async () => {
    setLoadOpen(true);
    setLoadingList(true);
    try {
      const rows = await listPlans();
      setPlans(rows);
      setBackendOnline(true);
    } catch (err) {
      setBackendOnline(false);
      toast.error(err instanceof Error ? err.message : 'Impossible de charger la liste des plans');
    } finally {
      setLoadingList(false);
    }
  };

  const handleLoadPlan = async (id: number) => {
    try {
      const detail = await getPlan(id);
      loadSnapshot(detail.payload);
      setCurrentPlanId(detail.id);
      setCurrentPlanName(detail.name);
      setLoadOpen(false);
      toast.success(`"${detail.name}" chargé`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Échec du chargement');
    }
  };

  const handleDeletePlan = async (id: number, name: string) => {
    setDeletingId(id);
    try {
      await deletePlan(id);
      setPlans(prev => prev.filter(p => p.id !== id));
      if (currentPlanId === id) {
        setCurrentPlanId(null);
        setCurrentPlanName('');
      }
      toast.success(`"${name}" supprimé`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Échec de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const handleNewPlan = () => {
    if (!window.confirm(labels.confirmNewPlan.fr)) return;
    loadSnapshot({ auditors: [], processes: [], segments: [], auditDates: [], selectedDate: null });
    setCurrentPlanId(null);
    setCurrentPlanName('');
    toast(labels.newPlan.fr);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-2 border-border bg-card p-3">
      <div className="flex-1 min-w-[180px] font-mono text-sm flex items-center gap-2">
        <span
          className={cn(
            'inline-block w-2 h-2 rounded-full shrink-0',
            backendOnline === null && 'bg-muted-foreground/40',
            backendOnline === true && 'bg-emerald-500',
            backendOnline === false && 'bg-destructive'
          )}
          title={backendOnline ? labels.backendConnected.fr : labels.backendOffline.fr}
        />
        {currentPlanName ? (
          <span className="font-semibold truncate">{currentPlanName}</span>
        ) : (
          <span className="text-muted-foreground italic">
            <BilingualLabel labelKey="unsavedPlan" showFr={false} />
          </span>
        )}
      </div>

      <Button size="sm" variant="outline" onClick={handleNewPlan}>
        <FilePlus2 className="w-4 h-4 mr-1" />
        <BilingualLabel labelKey="newPlan" showFr={false} />
      </Button>

      <Button size="sm" variant="outline" onClick={openLoadDialog}>
        <FolderOpen className="w-4 h-4 mr-1" />
        <BilingualLabel labelKey="loadPlan" showFr={false} />
      </Button>

      <Button size="sm" onClick={handleSaveClick} disabled={saving}>
        {saving ? (
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-1" />
        )}
        <BilingualLabel labelKey="savePlan" showFr={false} />
      </Button>

      {/* Save-as name dialog */}
      <Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <BilingualLabel labelKey="planNamePrompt" />
            </DialogTitle>
          </DialogHeader>
          <Input
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            placeholder={labels.planNamePlaceholder.fr}
            onKeyDown={e => e.key === 'Enter' && handleConfirmName()}
            autoFocus
          />
          <DialogFooter>
            <Button onClick={handleConfirmName} disabled={!nameInput.trim()}>
              <BilingualLabel labelKey="savePlan" showFr={false} />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load dialog */}
      <Dialog open={loadOpen} onOpenChange={setLoadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <BilingualLabel labelKey="loadPlan" />
            </DialogTitle>
          </DialogHeader>
          {loadingList ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> …
            </div>
          ) : plans.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              <BilingualLabel labelKey="noSavedPlans" showFr={false} />
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-1">
              {plans.map(p => (
                <div
                  key={p.id}
                  className="w-full flex items-center gap-2 border border-border p-2 hover:bg-accent transition-colors"
                >
                  <button
                    onClick={() => handleLoadPlan(p.id)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {labels.lastUpdated.fr} : {new Date(p.updatedAt).toLocaleString('fr-FR')}
                    </div>
                  </button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0 h-8 w-8"
                    disabled={deletingId === p.id}
                    onClick={() => handleDeletePlan(p.id, p.name)}
                    aria-label="Supprimer"
                  >
                    {deletingId === p.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
