import type { Completion, CompletionStatus, DateKey, Frequency, Habit } from '../../types';
import { buildCompletionMap } from '../streaks';

export function habit(frequency: Frequency, createdAt: DateKey, extra: Partial<Habit> = {}): Habit {
  return { id: 'h', name: 'Тест', emoji: '✅', color: '#10b981', frequency, createdAt, order: 0, ...extra };
}

/** Карта отметок: список дат `done`, опционально список `skipped`. */
export function marks(done: DateKey[], skipped: DateKey[] = []) {
  return buildCompletionMap(completions(done, skipped), 'h');
}

export function completions(done: DateKey[], skipped: DateKey[] = [], habitId = 'h'): Completion[] {
  const make = (status: CompletionStatus) => (date: DateKey) => ({ habitId, date, status });
  return [...done.map(make('done')), ...skipped.map(make('skipped'))];
}
