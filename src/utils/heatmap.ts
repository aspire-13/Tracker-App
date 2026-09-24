import type { DateKey, Habit } from '../types';
import { MONTH_SHORT, addDays, addMonths, fromKey, weekStart } from './dates';
import { type CompletionMap, isScheduled, trackingEnd, trackingStart } from './streaks';

/**
 * Состояние клетки:
 * - done / skipped — есть отметка;
 * - missed — запланированный день прошёл без отметки;
 * - open — день без отметки, который пропуском не считается (сегодня, или «N раз в неделю»);
 * - off — день не запланирован;
 * - inactive — вне периода учёта привычки.
 */
export type CellState = 'done' | 'skipped' | 'missed' | 'open' | 'off' | 'inactive';

export interface HeatmapCell {
  date: DateKey;
  state: CellState;
}

export interface HeatmapData {
  /** Колонки-недели (с понедельника), в каждой до 7 клеток; дни после сегодня отсутствуют. */
  weeks: HeatmapCell[][];
  /** Подписи месяцев: индекс колонки, где начинается месяц. */
  months: { column: number; label: string }[];
}

export function cellState(habit: Habit, completions: CompletionMap, key: DateKey, today: DateKey): CellState {
  const status = completions.get(key);
  if (status) return status;
  if (key < trackingStart(habit, completions) || key > trackingEnd(habit, today)) return 'inactive';
  if (!isScheduled(habit, key)) return 'off';
  if (key === today || habit.frequency.type === 'timesPerWeek') return 'open';
  return 'missed';
}

/** Тепловая карта в стиле GitHub за последние `months` месяцев, выровненная по неделям. */
export function buildHeatmap(habit: Habit, completions: CompletionMap, today: DateKey, months = 6): HeatmapData {
  const first = weekStart(addDays(addMonths(today, -months), 1));
  const weeks: HeatmapCell[][] = [];
  const labels: HeatmapData['months'] = [];
  let lastMonth = -1;

  for (let week = first; week <= today; week = addDays(week, 7)) {
    const column: HeatmapCell[] = [];
    for (let i = 0; i < 7; i++) {
      const key = addDays(week, i);
      if (key > today) break;
      column.push({ date: key, state: cellState(habit, completions, key, today) });
    }
    // Подпись ставим над колонкой, в которой встречается 1-е число месяца (или над первой колонкой).
    const month = fromKey(column[column.length - 1].date).getMonth();
    if (month !== lastMonth) {
      labels.push({ column: weeks.length, label: MONTH_SHORT[month] });
      lastMonth = month;
    }
    weeks.push(column);
  }
  // Подпись самой первой колонки уберём, если она почти сразу сменяется следующей — чтобы не налезали.
  if (labels.length > 1 && labels[1].column - labels[0].column < 3) labels.shift();
  return { weeks, months: labels };
}
