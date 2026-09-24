import { describe, expect, it } from 'vitest';
import { addDays, addMonths, diffDays, isValidKey, rangeKeys, weekday, weekStart } from '../dates';

// Тесты запускаются в поясе Europe/Berlin (см. vite.config.ts), где есть переход на летнее время.
describe('dates', () => {
  it('addDays переходит через месяцы, годы и переход на летнее время', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29');
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
  });

  it('weekday: 0 — понедельник, 6 — воскресенье', () => {
    expect(weekday('2026-09-21')).toBe(0);
    expect(weekday('2026-09-27')).toBe(6);
  });

  it('weekStart возвращает понедельник, в том числе через смену года', () => {
    expect(weekStart('2026-09-24')).toBe('2026-09-21');
    expect(weekStart('2026-01-01')).toBe('2025-12-29');
    expect(weekStart('2026-09-21')).toBe('2026-09-21');
  });

  it('addMonths ограничивает день концом месяца', () => {
    expect(addMonths('2026-08-31', -6)).toBe('2026-02-28');
    expect(addMonths('2026-03-15', -6)).toBe('2025-09-15');
  });

  it('diffDays и rangeKeys', () => {
    expect(diffDays('2025-12-30', '2026-01-02')).toBe(3);
    expect(diffDays('2026-03-28', '2026-03-30')).toBe(2);
    expect(rangeKeys('2026-02-27', '2026-03-01')).toEqual(['2026-02-27', '2026-02-28', '2026-03-01']);
  });

  it('isValidKey', () => {
    expect(isValidKey('2026-02-28')).toBe(true);
    expect(isValidKey('2026-02-30')).toBe(false);
    expect(isValidKey('26-2-1')).toBe(false);
  });
});
