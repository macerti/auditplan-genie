import { useAuditStore } from '@/hooks/useAuditStore';
import { DateSelector } from '@/components/DateSelector';
import { AuditorPanel } from '@/components/AuditorPanel';
import { ProcessPanel } from '@/components/ProcessPanel';
import { GanttChart } from '@/components/GanttChart';
import { AuditorLoadView } from '@/components/AuditorLoadView';
import { SummaryPanel } from '@/components/SummaryPanel';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BilingualLabel, BilingualText } from '@/components/BilingualLabel';

const Index = () => {
  const {
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
    auditDates,
    addAuditDate,
    removeAuditDate,
    selectedDate,
    setSelectedDate,
    getAuditorSummaries,
    totalRequiredMandays,
    setTotalRequiredMandays,
    auditorMandaysSum,
    effectiveTotalMandays,
    getExpectedHoursForDay
  } = useAuditStore();

  const summaries = getAuditorSummaries();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-4 border-border bg-card p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">
            <BilingualLabel labelKey="appTitle" />
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">
            <BilingualLabel labelKey="appSubtitle" frClassName="block mt-0.5" />
          </p>
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-6">
        {/* Date Selection */}
        <DateSelector
          auditDates={auditDates}
          selectedDate={selectedDate}
          onAddDate={addAuditDate}
          onRemoveDate={removeAuditDate}
          onSelectDate={setSelectedDate}
          totalRequiredMandays={totalRequiredMandays}
          onSetTotalRequiredMandays={setTotalRequiredMandays}
          auditorMandaysSum={auditorMandaysSum}
          effectiveTotalMandays={effectiveTotalMandays}
        />

        <Separator className="border-2" />

        {/* Team and Processes */}
        <div className="grid lg:grid-cols-2 gap-4">
          <AuditorPanel
            auditors={auditors}
            onAdd={addAuditor}
            onUpdate={updateAuditor}
            onRemove={removeAuditor}
            summaries={summaries}
          />
          <ProcessPanel
            processes={processes}
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
              <BilingualLabel labelKey="processView" showFr={false} />
            </TabsTrigger>
            <TabsTrigger value="auditor" className="font-mono uppercase text-xs">
              <BilingualLabel labelKey="auditorLoadView" showFr={false} />
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="process">
            <GanttChart
              segments={segments}
              auditors={auditors}
              processes={processes}
              summaries={summaries}
              selectedDate={selectedDate}
              auditDates={auditDates}
              onSelectDate={setSelectedDate}
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
              selectedDate={selectedDate}
              auditDates={auditDates}
              onSelectDate={setSelectedDate}
            />
          </TabsContent>
        </Tabs>

        <Separator className="border-2" />

        {/* Compliance Summary */}
        <SummaryPanel 
          auditors={auditors} 
          summaries={summaries} 
          segments={segments}
          processes={processes}
          auditDates={auditDates}
          getExpectedHoursForDay={getExpectedHoursForDay}
          effectiveTotalMandays={effectiveTotalMandays}
        />
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-border bg-card p-4 mt-8">
        <div className="container mx-auto text-center text-sm font-mono text-muted-foreground">
          <BilingualLabel labelKey="footer" />
        </div>
      </footer>
    </div>
  );
};

export default Index;