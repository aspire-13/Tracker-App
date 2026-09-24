import type { Frequency, Habit } from '../types';
import { WEEKDAY_SHORT } from './dates';

/** Русская форма множественного числа: plural(5, ['день', 'дня', 'дней']). */
export function plural(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

export const daysWord = (n: number) => plural(n, ['день', 'дня', 'дней']);
export const weeksWord = (n: number) => plural(n, ['неделя', 'недели', 'недель']);
export const timesWord = (n: number) => plural(n, ['раз', 'раза', 'раз']);

export function frequencyLabel(f: Frequency): string {
  switch (f.type) {
    case 'daily':
      return 'Каждый день';
    case 'weekdays':
      if (f.days.length === 7) return 'Каждый день';
      if (f.days.join() === '0,1,2,3,4') return 'По будням';
      if (f.days.join() === '5,6') return 'По выходным';
      return f.days.map((d) => WEEKDAY_SHORT[d]).join(', ');
    case 'timesPerWeek':
      return `${f.count} ${timesWord(f.count)} в неделю`;
  }
}

export function streakLabel(n: number, unit: 'days' | 'weeks'): string {
  return `${n} ${unit === 'days' ? daysWord(n) : weeksWord(n)}`;
}

export function sortHabits(habits: readonly Habit[]): Habit[] {
  return [...habits].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'ru'));
}

export const activeHabits = (habits: readonly Habit[]) => sortHabits(habits.filter((h) => !h.archivedAt));
export const archivedHabits = (habits: readonly Habit[]) => sortHabits(habits.filter((h) => h.archivedAt));
