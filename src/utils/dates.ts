import type { DateKey, Weekday } from '../types';

/**
 * Все даты в приложении — строки `YYYY-MM-DD` в локальной зоне.
 * Арифметика выполняется через Date в полдень, чтобы переходы на летнее время
 * не сдвигали день.
 */

const pad = (n: number) => String(n).padStart(2, '0');

export function toKey(date: Date): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function isValidKey(key: unknown): key is DateKey {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  return toKey(fromKey(key)) === key;
}

export function todayKey(now: Date = new Date()): DateKey {
  return toKey(now);
}

export function addDays(key: DateKey, days: number): DateKey {
  const d = fromKey(key);
  d.setDate(d.getDate() + days);
  return toKey(d);
}

export function addMonths(key: DateKey, months: number): DateKey {
  const d = fromKey(key);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return toKey(d);
}

/** Количество дней от `a` до `b` (b − a). */
export function diffDays(a: DateKey, b: DateKey): number {
  return Math.round((fromKey(b).getTime() - fromKey(a).getTime()) / 86_400_000);
}

export function weekday(key: DateKey): Weekday {
  return ((fromKey(key).getDay() + 6) % 7) as Weekday;
}

/** Понедельник недели, в которую входит дата. */
export function weekStart(key: DateKey): DateKey {
  return addDays(key, -weekday(key));
}

/** Все даты от `from` до `to` включительно. */
export function rangeKeys(from: DateKey, to: DateKey): DateKey[] {
  const out: DateKey[] = [];
  for (let k = from; k <= to; k = addDays(k, 1)) out.push(k);
  return out;
}

export const minKey = (a: DateKey, b: DateKey) => (a < b ? a : b);
export const maxKey = (a: DateKey, b: DateKey) => (a > b ? a : b);

export const WEEKDAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;
export const WEEKDAY_LONG = [
  'понедельник',
  'вторник',
  'среда',
  'четверг',
  'пятница',
  'суббота',
  'воскресенье',
] as const;
export const MONTH_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
] as const;
const MONTH_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
] as const;

/** «24 сентября» */
export function formatDayMonth(key: DateKey): string {
  const d = fromKey(key);
  return `${d.getDate()} ${MONTH_GENITIVE[d.getMonth()]}`;
}
