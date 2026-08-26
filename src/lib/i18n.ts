/**
 * Internationalization (i18n) Module
 * 
 * Provides bilingual labels (English primary, French secondary)
 * for the entire application. Labels are displayed simultaneously
 * per the app specification (no toggle).
 * 
 * To add a new label:
 * 1. Add the key-value pair to the labels object
 * 2. The LabelKey type is automatically inferred
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Structure for bilingual text
 */
export interface BilingualLabel {
  en: string;
  fr: string;
}

// ============================================================================
// Label Definitions
// ============================================================================

/**
 * All application labels organized by category
 * Keys should be camelCase and descriptive
 */
export const labels = {
  // === Headers ===
  appTitle: { en: 'ISO Audit Planner', fr: 'Planificateur d\'Audit ISO' },
  appSubtitle: { 
    en: 'Time-based audit scheduling with 0.25h precision — Workload & overlap control', 
    fr: 'Planification d\'audit basée sur le temps avec précision de 0,25h — Contrôle de charge et chevauchement' 
  },
  
  // === Panel Titles ===
  auditTeam: { en: 'Audit Team', fr: 'Équipe d\'Audit' },
  auditProcesses: { en: 'Audit Processes', fr: 'Processus d\'Audit' },
  auditDays: { en: 'Audit Days', fr: 'Jours d\'Audit' },
  complianceSummary: { en: 'Compliance Summary', fr: 'Résumé de Conformité' },
  
  // === View Names ===
  processView: { en: 'Process View', fr: 'Vue Processus' },
  auditorLoadView: { en: 'Auditor Load View', fr: 'Vue Charge Auditeur' },
  auditSchedule: { en: 'Audit Schedule', fr: 'Planning d\'Audit' },
  
  // === Actions ===
  addAuditor: { en: 'Add Auditor', fr: 'Ajouter Auditeur' },
  addProcess: { en: 'Add Process', fr: 'Ajouter Processus' },
  addSegment: { en: 'Add Segment', fr: 'Ajouter Segment' },
  addDate: { en: 'Add Date', fr: 'Ajouter Date' },
  exportAuditPlan: { en: 'Export Audit Plan', fr: 'Exporter le Plan' },
  
  // === Form Labels ===
  name: { en: 'Name', fr: 'Nom' },
  processName: { en: 'Process Name', fr: 'Nom du Processus' },
  process: { en: 'Process', fr: 'Processus' },
  auditors: { en: 'Auditors', fr: 'Auditeurs' },
  auditor: { en: 'Auditor', fr: 'Auditeur' },
  duration: { en: 'Duration', fr: 'Durée' },
  durationHours: { en: 'Duration (hours)', fr: 'Durée (heures)' },
  maxMandays: { en: 'Max Mandays', fr: 'Jours-Homme Max' },
  mandays: { en: 'Mandays', fr: 'Jours-Homme' },
  
  // === KPI Labels ===
  dailyAuditSpan: { en: 'Daily Audit Presence', fr: 'Présence Journalière' },
  idleAuditTime: { en: 'Idle Audit Time', fr: 'Temps Mort' },
  
  // === Status Labels ===
  ok: { en: 'OK', fr: 'OK' },
  compliant: { en: 'COMPLIANT', fr: 'CONFORME' },
  warning: { en: 'Warning', fr: 'Avertissement' },
  violation: { en: 'Violation', fr: 'Violation' },
  violations: { en: 'Violations', fr: 'Violations' },
  warnings: { en: 'Warnings', fr: 'Avertissements' },
  
  // === Info Labels ===
  timePrecision: { en: 'Time precision: 0.25h (15 min)', fr: 'Précision: 0,25h (15 min)' },
  capacityControl: { en: 'Capacity & availability control', fr: 'Contrôle capacité & disponibilité' },
  maxPerDay: { en: 'Max 7h/day', fr: 'Max 7h/jour' },
  mandayEquiv: { en: '1 manday = 7h', fr: '1 jour-homme = 7h' },
  spanLimit: { en: 'Span limit: 7h', fr: 'Limite amplitude: 7h' },
  lunchDeducted: { en: '1h lunch deducted', fr: '1h déjeuner déduit' },
  
  // === Empty States ===
  noAuditors: { en: 'No auditors defined', fr: 'Aucun auditeur défini' },
  noProcesses: { en: 'No processes defined', fr: 'Aucun processus défini' },
  noSegments: { en: 'No segments', fr: 'Aucun segment' },
  noAssignments: { en: 'No auditor assignments yet', fr: 'Aucune affectation' },
  selectAuditDay: { en: 'Select an audit day to view the schedule', fr: 'Sélectionner un jour d\'audit pour voir le planning' },
  selectDate: { en: 'Select audit days', fr: 'Sélectionner les jours d\'audit' },
  
  // === Footer ===
  footer: { en: 'ISO Audit Planning Tool — Temporal coherence & manday constraint verification', fr: 'Outil de Planification d\'Audit ISO — Vérification de cohérence temporelle et contraintes' },
  
  // === Misc ===
  multiSelect: { en: 'Auditors (multi-select)', fr: 'Auditeurs (multi-sélection)' },
  today: { en: 'Today', fr: 'Aujourd\'hui' },
  total: { en: 'Total', fr: 'Total' },
  processAuditors: { en: 'Process / Auditors', fr: 'Processus / Auditeurs' },

  // === Plan Save/Load (MariaDB backend) ===
  newPlan: { en: 'New Plan', fr: 'Nouveau Plan' },
  loadPlan: { en: 'Load', fr: 'Charger' },
  savePlan: { en: 'Save', fr: 'Enregistrer' },
  unsavedPlan: { en: 'Unsaved plan', fr: 'Plan non enregistré' },
  planNamePrompt: { en: 'Plan name', fr: 'Nom du plan' },
  planNamePlaceholder: { en: 'e.g. ISO 9001 Audit – Client X – Sept 2026', fr: 'ex : Audit ISO 9001 – Client X – Sept 2026' },
  noSavedPlans: { en: 'No saved plans yet', fr: 'Aucun plan enregistré pour l\'instant' },
  lastUpdated: { en: 'Updated', fr: 'Mis à jour' },
  backendConnected: { en: 'Database connected', fr: 'Base de données connectée' },
  backendOffline: { en: 'Offline — local draft only', fr: 'Hors-ligne — brouillon local uniquement' },
  confirmNewPlan: { en: 'Start a new blank plan? Unsaved changes to the current plan will be lost from this view (your last local draft stays in the browser).', fr: 'Démarrer un nouveau plan vierge ? Les modifications non enregistrées du plan actuel seront perdues de cette vue (votre dernier brouillon local reste dans le navigateur).' }
} as const;

/**
 * Type for valid label keys (auto-generated from labels object)
 */
export type LabelKey = keyof typeof labels;
