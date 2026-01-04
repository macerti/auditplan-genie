import { BilingualLabel } from '@/components/BilingualLabel';

export function StatusLegend() {
  return (
    <div className="flex items-center gap-4 px-4 py-2 border-b-2 border-border text-sm">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-status-valid border-2 border-status-valid"></div>
        <span className="font-mono"><BilingualLabel labelKey="ok" showFr={false} /></span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-status-warning border-2 border-status-warning"></div>
        <span className="font-mono"><BilingualLabel labelKey="warning" showFr={false} /></span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-status-violation border-2 border-status-violation"></div>
        <span className="font-mono"><BilingualLabel labelKey="violation" showFr={false} /></span>
      </div>
    </div>
  );
}
