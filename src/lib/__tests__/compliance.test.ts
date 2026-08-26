/**
 * Tests du moteur de calcul de conformité (src/lib/compliance.ts)
 *
 * Ce module est le cœur métier de l'application : c'est lui qui décide
 * si un plan d'audit est conforme (vert), en alerte (orange) ou en
 * violation (rouge). Toute régression ici a un impact direct sur la
 * fiabilité des plans validés par l'outil — d'où une couverture dédiée.
 */

import { describe, expect, it } from 'vitest';
import {
  checkAuditorOverlaps,
  calculateAuditorSummary,
  getSegmentComplianceStatus,
} from '@/lib/compliance';
import { Auditor, AuditSegment } from '@/types/audit';

function makeAuditor(overrides: Partial<Auditor> = {}): Auditor {
  return { id: 'aud-1', name: 'Jane Doe', maxMandays: 5, ...overrides };
}

function makeSegment(overrides: Partial<AuditSegment> = {}): AuditSegment {
  return {
    id: 'seg-1',
    processId: 'proc-1',
    auditorIds: ['aud-1'],
    date: '2026-09-01',
    startHour: 8,
    duration: 2,
    ...overrides,
  };
}

describe('checkAuditorOverlaps', () => {
  it('returns no issues when segments do not overlap in time', () => {
    const segments = [
      makeSegment({ id: 's1', startHour: 8, duration: 2 }),
      makeSegment({ id: 's2', startHour: 10, duration: 2 }),
    ];
    expect(checkAuditorOverlaps('aud-1', segments)).toHaveLength(0);
  });

  it('returns no issues when overlapping segments are on different dates', () => {
    const segments = [
      makeSegment({ id: 's1', date: '2026-09-01', startHour: 8, duration: 3 }),
      makeSegment({ id: 's2', date: '2026-09-02', startHour: 9, duration: 3 }),
    ];
    expect(checkAuditorOverlaps('aud-1', segments)).toHaveLength(0);
  });

  it('detects an overlap when two segments for the same auditor intersect in time', () => {
    const segments = [
      makeSegment({ id: 's1', startHour: 8, duration: 2 }), // 08:00-10:00
      makeSegment({ id: 's2', startHour: 9, duration: 2 }), // 09:00-11:00
    ];
    const issues = checkAuditorOverlaps('aud-1', segments);
    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe('overlap');
    expect(issues[0].severity).toBe('violation');
  });

  it('does not flag back-to-back segments that only touch at the boundary', () => {
    const segments = [
      makeSegment({ id: 's1', startHour: 8, duration: 2 }), // ends at 10:00
      makeSegment({ id: 's2', startHour: 10, duration: 2 }), // starts at 10:00
    ];
    expect(checkAuditorOverlaps('aud-1', segments)).toHaveLength(0);
  });

  it('ignores segments belonging to other auditors', () => {
    const segments = [
      makeSegment({ id: 's1', auditorIds: ['aud-1'], startHour: 8, duration: 2 }),
      makeSegment({ id: 's2', auditorIds: ['aud-2'], startHour: 8, duration: 2 }),
    ];
    expect(checkAuditorOverlaps('aud-1', segments)).toHaveLength(0);
  });
});

describe('calculateAuditorSummary', () => {
  it('reports a fully compliant auditor with no issues', () => {
    const auditor = makeAuditor({ maxMandays: 5 });
    const segments = [makeSegment({ duration: 4 })];
    const summary = calculateAuditorSummary(auditor, segments);

    expect(summary.status).toBe('valid');
    expect(summary.issues).toHaveLength(0);
    expect(summary.totalHours).toBe(4);
    expect(summary.mandaysUsed).toBeCloseTo(4 / 7);
  });

  it('flags a violation when daily hours exceed the 7h/day limit', () => {
    const auditor = makeAuditor({ maxMandays: 10 });
    const segments = [makeSegment({ duration: 8 })];
    const summary = calculateAuditorSummary(auditor, segments);

    expect(summary.status).toBe('violation');
    expect(summary.issues.some(i => i.type === 'daily_limit' && i.severity === 'violation')).toBe(true);
  });

  it('flags a warning when daily hours approach the 7h/day limit', () => {
    const auditor = makeAuditor({ maxMandays: 10 });
    const segments = [makeSegment({ duration: 6.5 })]; // > 7 - 1, <= 7
    const summary = calculateAuditorSummary(auditor, segments);

    expect(summary.status).toBe('warning');
    expect(summary.issues.some(i => i.type === 'daily_limit' && i.severity === 'warning')).toBe(true);
  });

  it('flags a violation when total mandays exceed the mission budget', () => {
    const auditor = makeAuditor({ maxMandays: 1 }); // 7h budget
    const segments = [
      makeSegment({ id: 's1', date: '2026-09-01', duration: 7 }),
      makeSegment({ id: 's2', date: '2026-09-02', duration: 7 }),
    ];
    const summary = calculateAuditorSummary(auditor, segments);

    expect(summary.mandaysUsed).toBeCloseTo(2);
    expect(summary.issues.some(i => i.type === 'manday_exceeded' && i.severity === 'violation')).toBe(true);
    expect(summary.status).toBe('violation');
  });

  it('flags a warning when mandays approach (>90% of) the mission budget', () => {
    const auditor = makeAuditor({ maxMandays: 1 }); // 7h budget, 90% = 6.3h
    const segments = [makeSegment({ duration: 6.5 })];
    const summary = calculateAuditorSummary(auditor, segments);

    expect(summary.issues.some(i => i.type === 'manday_exceeded' && i.severity === 'warning')).toBe(true);
  });

  it('deduplicates identical overlap messages between paired segments', () => {
    const auditor = makeAuditor({ maxMandays: 10 });
    const segments = [
      makeSegment({ id: 's1', startHour: 8, duration: 2 }),
      makeSegment({ id: 's2', startHour: 9, duration: 2 }),
    ];
    const summary = calculateAuditorSummary(auditor, segments);
    const overlapIssues = summary.issues.filter(i => i.type === 'overlap');
    expect(overlapIssues).toHaveLength(1);
  });

  it('sums hours correctly across multiple days independently', () => {
    const auditor = makeAuditor({ maxMandays: 10 });
    const segments = [
      makeSegment({ id: 's1', date: '2026-09-01', duration: 5 }),
      makeSegment({ id: 's2', date: '2026-09-02', duration: 3 }),
    ];
    const summary = calculateAuditorSummary(auditor, segments);

    expect(summary.dailyHours['2026-09-01']).toBe(5);
    expect(summary.dailyHours['2026-09-02']).toBe(3);
    expect(summary.totalHours).toBe(8);
    expect(summary.status).toBe('valid');
  });
});

describe('getSegmentComplianceStatus', () => {
  it('returns violation when a segment has no auditors assigned', () => {
    const segment = makeSegment({ auditorIds: [] });
    const status = getSegmentComplianceStatus(segment, [makeAuditor()], []);
    expect(status).toBe('violation');
  });

  it('returns violation when a segment references an unknown auditor id', () => {
    const segment = makeSegment({ auditorIds: ['ghost-auditor'] });
    const status = getSegmentComplianceStatus(segment, [makeAuditor()], []);
    expect(status).toBe('violation');
  });

  it('returns valid for a compliant segment with a known, unproblematic auditor', () => {
    const auditor = makeAuditor({ maxMandays: 10 });
    const segments = [makeSegment({ duration: 3 })];
    const summaries = [calculateAuditorSummary(auditor, segments)];
    const status = getSegmentComplianceStatus(segments[0], [auditor], summaries);
    expect(status).toBe('valid');
  });

  it('returns violation for a segment whose auditor is over the manday budget', () => {
    const auditor = makeAuditor({ maxMandays: 1 });
    const segments = [
      makeSegment({ id: 's1', date: '2026-09-01', duration: 7 }),
      makeSegment({ id: 's2', date: '2026-09-02', duration: 7 }),
    ];
    const summaries = [calculateAuditorSummary(auditor, segments)];
    const status = getSegmentComplianceStatus(segments[1], [auditor], summaries);
    expect(status).toBe('violation');
  });
});
