/**
 * Tests des utilitaires de temps (src/types/audit.ts)
 *
 * Ces fonctions gèrent l'arrondi au quart d'heure et le parsing des
 * saisies utilisateur (virgule ou point décimal) — une source classique
 * de bugs silencieux si elles régressent.
 */

import { describe, expect, it } from 'vitest';
import {
  roundToIncrement,
  formatHours,
  formatTimeLabel,
  parseDecimalInput,
} from '@/types/audit';

describe('roundToIncrement', () => {
  it('rounds to the nearest 0.25h increment', () => {
    expect(roundToIncrement(1.1)).toBe(1);
    expect(roundToIncrement(1.13)).toBe(1.25);
    expect(roundToIncrement(1.37)).toBe(1.25);
    expect(roundToIncrement(1.38)).toBe(1.5);
  });

  it('leaves exact increments unchanged', () => {
    expect(roundToIncrement(2)).toBe(2);
    expect(roundToIncrement(2.25)).toBe(2.25);
    expect(roundToIncrement(2.5)).toBe(2.5);
    expect(roundToIncrement(2.75)).toBe(2.75);
  });
});

describe('formatHours', () => {
  it('formats whole hours without minutes', () => {
    expect(formatHours(1)).toBe('1h');
    expect(formatHours(7)).toBe('7h');
  });

  it('formats quarter-hour fractions', () => {
    expect(formatHours(1.25)).toBe('1h15');
    expect(formatHours(1.5)).toBe('1h30');
    expect(formatHours(2.75)).toBe('2h45');
  });
});

describe('formatTimeLabel', () => {
  it('formats decimal hours as HHhMM labels', () => {
    expect(formatTimeLabel(8)).toBe('08H00');
    expect(formatTimeLabel(8.5)).toBe('08H30');
    expect(formatTimeLabel(13.25)).toBe('13H15');
  });
});

describe('parseDecimalInput', () => {
  it('accepts a dot as the decimal separator', () => {
    expect(parseDecimalInput('2.5')).toBe(2.5);
  });

  it('accepts a comma as the decimal separator (French input)', () => {
    expect(parseDecimalInput('2,5')).toBe(2.5);
  });

  it('rounds the parsed value to the nearest increment', () => {
    expect(parseDecimalInput('2,6')).toBe(2.5);
  });

  it('returns null for non-numeric input', () => {
    expect(parseDecimalInput('abc')).toBeNull();
    expect(parseDecimalInput('')).toBeNull();
  });
});
