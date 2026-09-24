import type { Completion, CompletionStatus, DateKey, Habit } from '../types';
import { addDays, minKey, weekday, weekStart } from './dates';

/** Отметки одной привычки: дата → статус. */
export type CompletionMap = ReadonlyMap<DateKey, CompletionStatus>;

export function buildCompletionMap(completions: readonly Completion[], habitId: string): CompletionMap {
  const map = new Map<DateKey, CompletionStatus>();
  for (const c of completions) if (c.habitId === habitId) map.set(c.date, c.status);
  return map;
}

/** Группирует отметки по привычкам одним проходом. */
export function groupCompletions(completions: readonly Completion[]): Map<string, Map<DateKey, CompletionStatus>> {
  const byHabit = new Map<string, Map<DateKey, CompletionStatus>>();
  for (const c of completions) {
    let m = byHabit.get(c.habitId);
    if (!m) byHabit.set(c.habitId, (m = new Map()));
    m.set(c.date, c.status);
  }
  return byHabit;
}

/**
 * Запланирована ли привычка на день.
 * Для «N раз в неделю» подходит любой день — проверяется выполнение нормы за неделю.
 */
export function isScheduled(habit: Habit, key: DateKey): boolean {
  switch (habit.frequency.type) {
    case 'daily':
    case 'timesPerWeek':
      return true;
    case 'weekdays':
      return habit.frequency.days.includes(weekday(key));
  }
}

/** Первая дата, с которой учитывается история: создание привычки или более ранняя отметка. */
export function trackingStart(habit: Habit, completions: CompletionMap): DateKey {
  let start = habit.createdAt;
  for (const date of completions.keys()) start = minKey(start, date);
  return start;
}

/** Последняя дата учёта: сегодня или дата архивации. */
export function trackingEnd(habit: Habit, today: DateKey): DateKey {
  return habit.archivedAt ? minKey(habit.archivedAt, today) : today;
}

export interface StreakResult {
  current: number;
  best: number;
  /** В чём измеряется серия: дни для ежедневных/по дням недели, недели — для «N раз в неделю». */
  unit: 'days' | 'weeks';
}

/**
 * Серии привычки.
 *
 * Ежедневно / по дням недели (серия в днях):
 *  - выполненный день увеличивает серию (в том числе незапланированный — как бонус);
 *  - пропуск по уважительной причине и незапланированные дни серию не прерывают и не увеличивают;
 *  - неотмеченный запланированный день обрывает серию;
 *  - сегодняшний день, пока не отмечен, серию не обрывает.
 *
 * N раз в неделю (серия в неделях, неделя начинается с понедельника):
 *  - неделя с N и более выполнениями увеличивает серию;
 *  - неделя, где норма набирается только с учётом уважительных пропусков, нейтральна;
 *  - текущая неделя и неделя начала учёта (она может быть неполной) при недоборе нейтральны;
 *  - остальные недели с недобором обрывают серию.
 */
export function calculateStreaks(habit: Habit, completions: CompletionMap, today: DateKey): StreakResult {
  const start = trackingStart(habit, completions);
  const end = trackingEnd(habit, today);
  if (start > end) return { current: 0, best: 0, unit: habit.frequency.type === 'timesPerWeek' ? 'weeks' : 'days' };

  return habit.frequency.type === 'timesPerWeek'
    ? weeklyStreaks(habit.frequency.count, completions, start, end, today)
    : dailyStreaks(habit, completions, start, end, today);
}

function dailyStreaks(
  habit: Habit,
  completions: CompletionMap,
  start: DateKey,
  end: DateKey,
  today: DateKey,
): StreakResult {
  let running = 0;
  let best = 0;
  for (let key = start; key <= end; key = addDays(key, 1)) {
    const status = completions.get(key);
    if (status === 'done') {
      running += 1;
      best = Math.max(best, running);
    } else if (status === 'skipped' || !isScheduled(habit, key) || key === today) {
      continue;
    } else {
      running = 0;
    }
  }
  return { current: running, best, unit: 'days' };
}

function weeklyStreaks(
  target: number,
  completions: CompletionMap,
  start: DateKey,
  end: DateKey,
  today: DateKey,
): StreakResult {
  const firstWeek = weekStart(start);
  const currentWeek = weekStart(today);
  let running = 0;
  let best = 0;
  for (let week = firstWeek; week <= end; week = addDays(week, 7)) {
    const { done, skipped } = countWeek(completions, week);
    if (done >= target) {
      running += 1;
      best = Math.max(best, running);
    } else if (done + skipped >= target || week === currentWeek || week === firstWeek) {
      continue;
    } else {
      running = 0;
    }
  }
  return { current: running, best, unit: 'weeks' };
}

export function countWeek(completions: CompletionMap, weekStartKey: DateKey): { done: number; skipped: number } {
  let done = 0;
  let skipped = 0;
  for (let i = 0; i < 7; i++) {
    const status = completions.get(addDays(weekStartKey, i));
    if (status === 'done') done++;
    else if (status === 'skipped') skipped++;
  }
  return { done, skipped };
}

/**
 * Нужно ли показывать привычку в плане на день.
 * Для «N раз в неделю» — пока норма недели не набрана, либо если привычка уже отмечена в этот день.
 * Дни до создания привычки не исключаются: так можно отметить выполнение задним числом
 * сразу после добавления (неотмеченные дни до создания серию не обрывают).
 */
export function isDueOn(habit: Habit, completions: CompletionMap, key: DateKey): boolean {
  if (habit.archivedAt && key > habit.archivedAt) return false;
  if (habit.frequency.type !== 'timesPerWeek') return isScheduled(habit, key);
  if (completions.has(key)) return true;
  const { done } = countWeek(completions, weekStart(key));
  return done < habit.frequency.count;
}
