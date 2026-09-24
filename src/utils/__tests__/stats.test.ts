import { describe, expect, it } from 'vitest';
import { bestAndWorstWeekdays, habitRate, percent, rollingRate, weekdayStats } from '../stats';
import { groupCompletions } from '../streaks';
import { rangeKeys } from '../dates';
import { completions, habit, marks } from './helpers';

describe('habitRate', () => {
  const daily = habit({ type: 'daily' }, '2026-09-01');

  it('ежедневная: доля выполненных дней, сегодня без отметки не учитывается', () => {
    const r = habitRate(daily, marks(['2026-09-07', '2026-09-08']), '2026-09-07', '2026-09-10', '2026-09-10');
    expect(r).toEqual({ done: 2, expected: 3 });
  });

  it('уважительный пропуск исключается из расчёта', () => {
    const r = habitRate(daily, marks(['2026-09-07'], ['2026-09-08']), '2026-09-07', '2026-09-08', '2026-09-10');
    expect(percent(r)).toBe(100);
  });

  it('период до создания привычки не учитывается', () => {
    const r = habitRate(daily, marks([]), '2026-08-01', '2026-09-02', '2026-09-10');
    expect(r.expected).toBe(2);
  });

  it('по дням недели: учитываются только выбранные дни', () => {
    const h = habit({ type: 'weekdays', days: [0, 2, 4] }, '2026-09-01');
    const r = habitRate(h, marks(['2026-09-07', '2026-09-08']), '2026-09-07', '2026-09-13', '2026-09-20');
    expect(r).toEqual({ done: 1, expected: 3 });
  });

  it('N раз в неделю: полная неделя с нормой — 100%', () => {
    const h = habit({ type: 'timesPerWeek', count: 3 }, '2026-09-01');
    const r = habitRate(h, marks(['2026-09-07', '2026-09-09', '2026-09-10', '2026-09-11']), '2026-09-07', '2026-09-13', '2026-09-20');
    expect(r).toEqual({ done: 3, expected: 3 });
  });

  it('N раз в неделю: неполная неделя — пропорциональное ожидание', () => {
    const h = habit({ type: 'timesPerWeek', count: 7 }, '2026-09-01');
    const r = habitRate(h, marks(['2026-09-07']), '2026-09-07', '2026-09-08', '2026-09-20');
    expect(r).toEqual({ done: 1, expected: 2 });
  });
});

describe('rollingRate', () => {
  it('суммирует несколько привычек за 7 дней', () => {
    const a = habit({ type: 'daily' }, '2026-09-01', { id: 'a' });
    const b = habit({ type: 'daily' }, '2026-09-01', { id: 'b' });
    const index = groupCompletions([
      ...completions(rangeKeys('2026-09-04', '2026-09-10'), [], 'a'),
      ...completions([], [], 'b'),
    ]);
    // сегодня 10-е: a выполнена 7/7, b — 0/6 (сегодня не учитывается)
    const r = rollingRate([a, b], index, '2026-09-10', 7);
    expect(r).toEqual({ done: 7, expected: 13 });
    expect(percent(r)).toBe(54);
  });

  it('без привычек процент не определён', () => {
    expect(percent(rollingRate([], new Map(), '2026-09-10', 30))).toBeNull();
  });
});

describe('weekdayStats', () => {
  it('находит лучший и худший день недели', () => {
    const h = habit({ type: 'daily' }, '2026-08-31');
    // 2 недели: все дни, кроме понедельников, выполнены; в субботу — только одна из двух
    const done = rangeKeys('2026-08-31', '2026-09-13').filter(
      (k) => k !== '2026-08-31' && k !== '2026-09-07' && k !== '2026-09-12',
    );
    const stats = weekdayStats([h], groupCompletions(completions(done)), '2026-09-13', 14);
    expect(stats[0]).toMatchObject({ done: 0, expected: 2 });
    expect(stats[5]).toMatchObject({ done: 1, expected: 2 });
    const { best, worst } = bestAndWorstWeekdays(stats);
    expect(best?.weekday).toBe(1);
    expect(worst?.weekday).toBe(0);
  });

  it('при одинаковых показателях лучший/худший не определяются', () => {
    const h = habit({ type: 'daily' }, '2026-08-31');
    const done = rangeKeys('2026-08-31', '2026-09-13');
    const stats = weekdayStats([h], groupCompletions(completions(done)), '2026-09-13', 14);
    expect(bestAndWorstWeekdays(stats)).toEqual({ best: null, worst: null });
  });
});
