import { useState } from 'react';
import { useAuditStore } from '@/hooks/useAuditStore';
import { StandardsSelector } from '@/components/StandardsSelector';
import { AuditorPanel } from '@/components/AuditorPanel';
import { ProcessPanel } from '@/components/ProcessPanel';
import { GanttChart } from '@/components/GanttChart';
import { AuditorLoadView } from '@/components/AuditorLoadView';
import { SummaryPanel } from '@/components/SummaryPanel';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const {
    allStandards,
    selectedStandards,
    toggleStandard,
    auditors,
    addAuditor,
    updateAuditor,
    removeAuditor,
    processes,
    addProcess,
    updateProcess,
    removeProcess,
    segments,
    addSegment,
    updateSegment,
    removeSegment,
    auditDays,
    setAuditDays,
    getAuditorSummaries
  } = useAuditStore();

  const summaries = getAuditorSummaries();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-4 border-border bg-card p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">
            ISO Audit Planner
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">
            Visual Gantt for audit compliance validation — 0.25h precision
          </p>
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-6">
        {/* Standards and Days Configuration */}
        <div className="grid md:grid-cols-2 gap-4">
          <StandardsSelector
            allStandards={allStandards}
            selectedStandards={selectedStandards}
            onToggle={toggleStandard}
          />
          <div className="border-2 border-border p-4 bg-card">
            <h2 className="text-lg font-bold mb-3 uppercase tracking-wide">Audit Duration</h2>
            <div className="flex items-center gap-3">
              <Label htmlFor="audit-days" className="font-mono">Number of Days:</Label>
              <Input
                id="audit-days"
                type="number"
                min={1}
                max={14}
                value={auditDays}
                onChange={e => setAuditDays(Math.max(1, Math.min(14, Number(e.target.value))))}
                className="w-20 border-2"
              />
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-2">
              Max 7h/day per auditor • 1 manday = 7h
            </p>
          </div>
        </div>

        <Separator className="border-2" />

        {/* Team and Processes */}
        <div className="grid lg:grid-cols-2 gap-4">
          <AuditorPanel
            auditors={auditors}
            selectedStandards={selectedStandards}
            onAdd={addAuditor}
            onUpdate={updateAuditor}
            onRemove={removeAuditor}
            summaries={summaries}
          />
          <ProcessPanel
            processes={processes}
            selectedStandards={selectedStandards}
            onAdd={addProcess}
            onUpdate={updateProcess}
            onRemove={removeProcess}
          />
        </div>

        <Separator className="border-2" />

        {/* Gantt Views with Tabs */}
        <Tabs defaultValue="process" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
            <TabsTrigger value="process" className="font-mono uppercase text-xs">
              Process View
            </TabsTrigger>
            <TabsTrigger value="auditor" className="font-mono uppercase text-xs">
              Auditor Load View
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="process">
            <GanttChart
              segments={segments}
              auditors={auditors}
              processes={processes}
              summaries={summaries}
              days={auditDays}
              onAddSegment={addSegment}
              onUpdateSegment={updateSegment}
              onRemoveSegment={removeSegment}
            />
          </TabsContent>
          
          <TabsContent value="auditor">
            <AuditorLoadView
              segments={segments}
              auditors={auditors}
              processes={processes}
              summaries={summaries}
              days={auditDays}
            />
          </TabsContent>
        </Tabs>

        <Separator className="border-2" />

        {/* Compliance Summary */}
        <SummaryPanel auditors={auditors} summaries={summaries} />
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-border bg-card p-4 mt-8">
        <div className="container mx-auto text-center text-sm font-mono text-muted-foreground">
          ISO Audit Planning Tool — Compliance verification before approval
        </div>
      </footer>
    </div>
  );
};

export default Index;
