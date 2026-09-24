import { describe, expect, it } from 'vitest';
import { buildHeatmap, cellState } from '../heatmap';
import { habit, marks } from './helpers';

describe('buildHeatmap', () => {
  const h = habit({ type: 'daily' }, '2026-09-01');
  const today = '2026-09-24'; // четверг

  it('охватывает ~6 месяцев, колонки начинаются с понедельника и заканчиваются сегодня', () => {
    const { weeks } = buildHeatmap(h, marks([]), today);
    expect(weeks.length).toBeGreaterThanOrEqual(26);
    expect(weeks.length).toBeLessThanOrEqual(28);
    expect(weeks.slice(0, -1).every((w) => w.length === 7)).toBe(true);
    const last = weeks[weeks.length - 1];
    expect(last[0].date).toBe('2026-09-21');
    expect(last[last.length - 1].date).toBe(today);
    expect(weeks[0][0].date <= '2026-03-25').toBe(true);
  });

  it('подписи месяцев идут по порядку и заканчиваются текущим месяцем', () => {
    const { months } = buildHeatmap(h, marks([]), today);
    expect(months[months.length - 1].label).toBe('сен');
    const cols = months.map((m) => m.column);
    expect([...cols].sort((a, b) => a - b)).toEqual(cols);
  });

  it('работает через смену года', () => {
    const h2 = habit({ type: 'daily' }, '2025-10-01');
    const { weeks, months } = buildHeatmap(h2, marks(['2025-12-31', '2026-01-01']), '2026-01-15');
    const cells = weeks.flat();
    expect(cells.find((c) => c.date === '2025-12-31')?.state).toBe('done');
    expect(cells.find((c) => c.date === '2026-01-01')?.state).toBe('done');
    expect(months.map((m) => m.label)).toContain('янв');
  });
});

describe('cellState', () => {
  const today = '2026-09-10';

  it('ежедневная: отметки, пропуски, сегодня и период до создания', () => {
    const h = habit({ type: 'daily' }, '2026-09-05');
    const m = marks(['2026-09-06'], ['2026-09-07']);
    expect(cellState(h, m, '2026-09-04', today)).toBe('inactive');
    expect(cellState(h, m, '2026-09-06', today)).toBe('done');
    expect(cellState(h, m, '2026-09-07', today)).toBe('skipped');
    expect(cellState(h, m, '2026-09-08', today)).toBe('missed');
    expect(cellState(h, m, today, today)).toBe('open');
  });

  it('по дням недели: невыбранный день — off', () => {
    const h = habit({ type: 'weekdays', days: [0] }, '2026-09-01');
    expect(cellState(h, marks([]), '2026-09-08', today)).toBe('off');
    expect(cellState(h, marks([]), '2026-09-07', today)).toBe('missed');
  });

  it('N раз в неделю: неотмеченный день не считается пропуском', () => {
    const h = habit({ type: 'timesPerWeek', count: 2 }, '2026-09-01');
    expect(cellState(h, marks([]), '2026-09-08', today)).toBe('open');
  });
});
