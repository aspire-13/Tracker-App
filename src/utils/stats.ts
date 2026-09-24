import type { DateKey, Habit, Weekday } from '../types';
import { addDays, maxKey, minKey, weekday, weekStart } from './dates';
import { type CompletionMap, isScheduled, trackingEnd, trackingStart } from './streaks';

export interface Rate {
  done: number;
  expected: number;
}

export const EMPTY_RATE: Rate = { done: 0, expected: 0 };

/** Доля выполнения 0…1 или null, если за период ничего не ожидалось. */
export function ratio(r: Rate): number | null {
  return r.expected > 0 ? Math.min(1, r.done / r.expected) : null;
}

export function percent(r: Rate): number | null {
  const v = ratio(r);
  return v === null ? null : Math.round(v * 100);
}

const addRate = (a: Rate, b: Rate): Rate => ({ done: a.done + b.done, expected: a.expected + b.expected });

/**
 * Вклад одного дня для ежедневных привычек и привычек по дням недели.
 * Учитываются только запланированные дни; уважительный пропуск исключается из расчёта;
 * сегодняшний день учитывается, только если уже выполнен.
 */
function dayRate(habit: Habit, completions: CompletionMap, key: DateKey, today: DateKey): Rate {
  if (!isScheduled(habit, key)) return EMPTY_RATE;
  const status = completions.get(key);
  if (status === 'done') return { done: 1, expected: 1 };
  if (status === 'skipped' || key === today) return EMPTY_RATE;
  return { done: 0, expected: 1 };
}

/**
 * Выполнение привычки за период [from, to].
 * Для «N раз в неделю» ожидание пропорционально числу дней недели, попавших в период
 * (N × дни / 7), минус уважительные пропуски; выполнения сверх нормы недели не засчитываются.
 */
export function habitRate(
  habit: Habit,
  completions: CompletionMap,
  from: DateKey,
  to: DateKey,
  today: DateKey,
): Rate {
  const start = maxKey(from, trackingStart(habit, completions));
  const end = minKey(to, trackingEnd(habit, today));
  if (start > end) return EMPTY_RATE;

  if (habit.frequency.type !== 'timesPerWeek') {
    let total = EMPTY_RATE;
    for (let key = start; key <= end; key = addDays(key, 1)) {
      total = addRate(total, dayRate(habit, completions, key, today));
    }
    return total;
  }

  const target = habit.frequency.count;
  let total = EMPTY_RATE;
  for (let week = weekStart(start); week <= end; week = addDays(week, 7)) {
    let days = 0;
    let done = 0;
    let skipped = 0;
    for (let i = 0; i < 7; i++) {
      const key = addDays(week, i);
      if (key < start || key > end) continue;
      const status = completions.get(key);
      if (status === 'done') done++;
      else if (status === 'skipped') skipped++;
      if (key !== today || status === 'done') days++;
    }
    const expected = Math.max(0, Math.min(target, (target * days) / 7) - skipped);
    total = addRate(total, { done: Math.min(done, expected), expected });
  }
  return total;
}

export type CompletionIndex = ReadonlyMap<string, CompletionMap>;
const EMPTY_MAP: CompletionMap = new Map();

/** Суммарное выполнение по всем привычкам за период. */
export function overallRate(
  habits: readonly Habit[],
  index: CompletionIndex,
  from: DateKey,
  to: DateKey,
  today: DateKey,
): Rate {
  return habits.reduce(
    (acc, h) => addRate(acc, habitRate(h, index.get(h.id) ?? EMPTY_MAP, from, to, today)),
    EMPTY_RATE,
  );
}

/** Выполнение за последние `days` дней, включая сегодня. */
export function rollingRate(
  habits: readonly Habit[],
  index: CompletionIndex,
  today: DateKey,
  days: number,
): Rate {
  return overallRate(habits, index, addDays(today, -(days - 1)), today, today);
}

export interface WeekdayStat extends Rate {
  weekday: Weekday;
}

/**
 * Выполнение по дням недели за последние `days` дней.
 * Для «N раз в неделю» каждый день несёт ожидание N/7.
 */
export function weekdayStats(
  habits: readonly Habit[],
  index: CompletionIndex,
  today: DateKey,
  days = 84,
): WeekdayStat[] {
  const stats: WeekdayStat[] = Array.from({ length: 7 }, (_, i) => ({
    weekday: i as Weekday,
    done: 0,
    expected: 0,
  }));
  const from = addDays(today, -(days - 1));

  for (const habit of habits) {
    const completions = index.get(habit.id) ?? EMPTY_MAP;
    const start = maxKey(from, trackingStart(habit, completions));
    const end = trackingEnd(habit, today);
    for (let key = start; key <= end; key = addDays(key, 1)) {
      let r: Rate;
      if (habit.frequency.type === 'timesPerWeek') {
        const status = completions.get(key);
        if (status === 'skipped' || (key === today && status !== 'done')) continue;
        r = { done: status === 'done' ? 1 : 0, expected: habit.frequency.count / 7 };
      } else {
        r = dayRate(habit, completions, key, today);
      }
      const s = stats[weekday(key)];
      s.done += r.done;
      s.expected += r.expected;
    }
  }
  return stats;
}

/** Лучший и худший дни недели (только дни, по которым были ожидания). */
export function bestAndWorstWeekdays(stats: readonly WeekdayStat[]): {
  best: WeekdayStat | null;
  worst: WeekdayStat | null;
} {
  const withData = stats.filter((s) => s.expected > 0);
  if (withData.length < 2) return { best: null, worst: null };
  const sorted = [...withData].sort((a, b) => (ratio(b) ?? 0) - (ratio(a) ?? 0));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  if (ratio(best) === ratio(worst)) return { best: null, worst: null };
  return { best, worst };
}
