/**
 * Bilingual labels: English primary, French below (smaller, lighter)
 * No toggle - both displayed simultaneously
 */

export interface BilingualLabel {
  en: string;
  fr: string;
}

export const labels = {
  // Headers
  appTitle: { en: 'ISO Audit Planner', fr: 'Planificateur d\'Audit ISO' },
  appSubtitle: { en: 'Time-based audit scheduling with 0.25h precision — Workload & overlap control', fr: 'Planification d\'audit basée sur le temps avec précision de 0,25h — Contrôle de charge et chevauchement' },
  
  // Panels
  auditTeam: { en: 'Audit Team', fr: 'Équipe d\'Audit' },
  auditProcesses: { en: 'Audit Processes', fr: 'Processus d\'Audit' },
  auditDays: { en: 'Audit Days', fr: 'Jours d\'Audit' },
  complianceSummary: { en: 'Compliance Summary', fr: 'Résumé de Conformité' },
  
  // Views
  processView: { en: 'Process View', fr: 'Vue Processus' },
  auditorLoadView: { en: 'Auditor Load View', fr: 'Vue Charge Auditeur' },
  auditSchedule: { en: 'Audit Schedule', fr: 'Planning d\'Audit' },
  
  // Actions
  addAuditor: { en: 'Add Auditor', fr: 'Ajouter Auditeur' },
  addProcess: { en: 'Add Process', fr: 'Ajouter Processus' },
  addSegment: { en: 'Add Segment', fr: 'Ajouter Segment' },
  addDate: { en: 'Add Date', fr: 'Ajouter Date' },
  exportAuditPlan: { en: 'Export Audit Plan', fr: 'Exporter le Plan' },
  
  // Labels
  name: { en: 'Name', fr: 'Nom' },
  processName: { en: 'Process Name', fr: 'Nom du Processus' },
  process: { en: 'Process', fr: 'Processus' },
  auditors: { en: 'Auditors', fr: 'Auditeurs' },
  auditor: { en: 'Auditor', fr: 'Auditeur' },
  duration: { en: 'Duration', fr: 'Durée' },
  durationHours: { en: 'Duration (hours)', fr: 'Durée (heures)' },
  maxMandays: { en: 'Max Mandays', fr: 'Jours-Homme Max' },
  mandays: { en: 'Mandays', fr: 'Jours-Homme' },
  
  // KPIs
  dailyAuditSpan: { en: 'Daily Audit Presence', fr: 'Présence Journalière' },
  idleAuditTime: { en: 'Idle Audit Time', fr: 'Temps Mort' },
  
  // Status
  ok: { en: 'OK', fr: 'OK' },
  compliant: { en: 'COMPLIANT', fr: 'CONFORME' },
  warning: { en: 'Warning', fr: 'Avertissement' },
  violation: { en: 'Violation', fr: 'Violation' },
  violations: { en: 'Violations', fr: 'Violations' },
  warnings: { en: 'Warnings', fr: 'Avertissements' },
  
  // Info
  timePrecision: { en: 'Time precision: 0.25h (15 min)', fr: 'Précision: 0,25h (15 min)' },
  capacityControl: { en: 'Capacity & availability control', fr: 'Contrôle capacité & disponibilité' },
  maxPerDay: { en: 'Max 7h/day', fr: 'Max 7h/jour' },
  mandayEquiv: { en: '1 manday = 7h', fr: '1 jour-homme = 7h' },
  spanLimit: { en: 'Span limit: 7h', fr: 'Limite amplitude: 7h' },
  lunchDeducted: { en: '1h lunch deducted', fr: '1h déjeuner déduit' },
  
  // Helpers
  noAuditors: { en: 'No auditors defined', fr: 'Aucun auditeur défini' },
  noProcesses: { en: 'No processes defined', fr: 'Aucun processus défini' },
  noSegments: { en: 'No segments', fr: 'Aucun segment' },
  noAssignments: { en: 'No auditor assignments yet', fr: 'Aucune affectation' },
  selectAuditDay: { en: 'Select an audit day to view the schedule', fr: 'Sélectionner un jour d\'audit pour voir le planning' },
  selectDate: { en: 'Select audit days', fr: 'Sélectionner les jours d\'audit' },
  
  // Footer
  footer: { en: 'ISO Audit Planning Tool — Temporal coherence & manday constraint verification', fr: 'Outil de Planification d\'Audit ISO — Vérification de cohérence temporelle et contraintes' },
  
  // Multi-select
  multiSelect: { en: 'Auditors (multi-select)', fr: 'Auditeurs (multi-sélection)' },
  
  // Today
  today: { en: 'Today', fr: 'Aujourd\'hui' },
  total: { en: 'Total', fr: 'Total' },
  
  // Process/Auditors column
  processAuditors: { en: 'Process / Auditors', fr: 'Processus / Auditeurs' },
  
  // Total mandays
  totalRequiredMandays: { en: 'Total Required Mandays', fr: 'Jours-Homme Requis' },
  autoCalculated: { en: 'Auto (from auditors)', fr: 'Auto (des auditeurs)' },
  partialDay: { en: 'Partial Day', fr: 'Jour Partiel' },
  expectedPresence: { en: 'Expected', fr: 'Attendu' }
} as const;

export type LabelKey = keyof typeof labels;
