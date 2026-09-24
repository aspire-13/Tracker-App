import { describe, expect, it } from 'vitest';
import { daysWord, frequencyLabel } from '../format';

describe('format', () => {
  it('склоняет «день»', () => {
    expect([1, 2, 5, 11, 12, 21, 22, 25, 111].map(daysWord)).toEqual([
      'день', 'дня', 'дней', 'дней', 'дней', 'день', 'дня', 'дней', 'дней',
    ]);
  });

  it('подписывает частоту', () => {
    expect(frequencyLabel({ type: 'weekdays', days: [0, 1, 2, 3, 4] })).toBe('По будням');
    expect(frequencyLabel({ type: 'weekdays', days: [0, 2] })).toBe('Пн, Ср');
    expect(frequencyLabel({ type: 'timesPerWeek', count: 3 })).toBe('3 раза в неделю');
  });
});
