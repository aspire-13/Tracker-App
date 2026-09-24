import { describe, expect, it } from 'vitest';
import type { Frequency } from '../../types';
import { calculateStreaks, isDueOn } from '../streaks';
import { rangeKeys } from '../dates';
import { habit, marks } from './helpers';

const daily: Frequency = { type: 'daily' };
// Пн, Ср, Пт
const monWedFri: Frequency = { type: 'weekdays', days: [0, 2, 4] };
const threePerWeek: Frequency = { type: 'timesPerWeek', count: 3 };

describe('ежедневная привычка', () => {
  const h = habit(daily, '2026-09-01');

  it('без отметок серии нулевые', () => {
    expect(calculateStreaks(h, marks([]), '2026-09-10')).toEqual({ current: 0, best: 0, unit: 'days' });
  });

  it('считает подряд идущие дни до сегодня', () => {
    const m = marks(rangeKeys('2026-09-08', '2026-09-10'));
    expect(calculateStreaks(h, m, '2026-09-10')).toMatchObject({ current: 3, best: 3 });
  });

  it('неотмеченный сегодняшний день не обрывает серию', () => {
    const m = marks(rangeKeys('2026-09-07', '2026-09-09'));
    expect(calculateStreaks(h, m, '2026-09-10')).toMatchObject({ current: 3, best: 3 });
  });

  it('пропущенный вчерашний день обрывает серию', () => {
    const m = marks(rangeKeys('2026-09-05', '2026-09-08'));
    expect(calculateStreaks(h, m, '2026-09-10')).toMatchObject({ current: 0, best: 4 });
  });

  it('лучшая серия запоминает максимум, текущая — последний отрезок', () => {
    const m = marks([...rangeKeys('2026-09-01', '2026-09-05'), ...rangeKeys('2026-09-08', '2026-09-10')]);
    expect(calculateStreaks(h, m, '2026-09-10')).toMatchObject({ current: 3, best: 5 });
  });

  it('уважительный пропуск не обрывает серию и не увеличивает её', () => {
    const m = marks(['2026-09-07', '2026-09-08', '2026-09-10'], ['2026-09-09']);
    expect(calculateStreaks(h, m, '2026-09-10')).toMatchObject({ current: 3, best: 3 });
  });

  it('несколько уважительных пропусков подряд тоже не обрывают серию', () => {
    const m = marks(['2026-09-03', '2026-09-10'], rangeKeys('2026-09-04', '2026-09-09'));
    expect(calculateStreaks(h, m, '2026-09-10')).toMatchObject({ current: 2 });
  });

  it('серия проходит через границу месяцев (31 → 1)', () => {
    const h2 = habit(daily, '2026-08-01');
    const m = marks(rangeKeys('2026-08-29', '2026-09-02'));
    expect(calculateStreaks(h2, m, '2026-09-02')).toMatchObject({ current: 5 });
  });

  it('серия проходит через конец февраля в невисокосном году', () => {
    const h2 = habit(daily, '2026-02-01');
    const m = marks(['2026-02-27', '2026-02-28', '2026-03-01', '2026-03-02']);
    expect(calculateStreaks(h2, m, '2026-03-02')).toMatchObject({ current: 4 });
  });

  it('в високосном году 29 февраля — обычный день, его пропуск обрывает серию', () => {
    const h2 = habit(daily, '2028-02-01');
    const m = marks(['2028-02-27', '2028-02-28', '2028-03-01', '2028-03-02']);
    expect(calculateStreaks(h2, m, '2028-03-02')).toMatchObject({ current: 2, best: 2 });
    const full = marks(rangeKeys('2028-02-27', '2028-03-02'));
    expect(calculateStreaks(h2, full, '2028-03-02')).toMatchObject({ current: 5 });
  });

  it('серия проходит через смену года', () => {
    const h2 = habit(daily, '2025-12-01');
    const m = marks(rangeKeys('2025-12-29', '2026-01-03'));
    expect(calculateStreaks(h2, m, '2026-01-03')).toMatchObject({ current: 6, best: 6 });
  });

  it('отметки раньше даты создания учитываются', () => {
    const h2 = habit(daily, '2026-09-10');
    const m = marks(rangeKeys('2026-09-05', '2026-09-10'));
    expect(calculateStreaks(h2, m, '2026-09-10')).toMatchObject({ current: 6 });
  });

  it('дни до создания привычки не обрывают серию', () => {
    const h2 = habit(daily, '2026-09-09');
    const m = marks(['2026-09-09', '2026-09-10']);
    expect(calculateStreaks(h2, m, '2026-09-10')).toMatchObject({ current: 2, best: 2 });
  });

  it('архивная привычка считается до даты архивации', () => {
    const h2 = habit(daily, '2026-09-01', { archivedAt: '2026-09-05' });
    const m = marks(rangeKeys('2026-09-01', '2026-09-05'));
    expect(calculateStreaks(h2, m, '2026-09-20')).toMatchObject({ current: 5, best: 5 });
  });
});

describe('привычка по дням недели (Пн, Ср, Пт)', () => {
  // 2026-09-07 — понедельник
  const h = habit(monWedFri, '2026-09-01');

  it('невыбранные дни не прерывают серию', () => {
    const m = marks(['2026-09-07', '2026-09-09', '2026-09-11']);
    expect(calculateStreaks(h, m, '2026-09-13')).toMatchObject({ current: 3, best: 3 });
  });

  it('пропуск выбранного дня обрывает серию', () => {
    const m = marks(['2026-09-07', '2026-09-11']);
    expect(calculateStreaks(h, m, '2026-09-11')).toMatchObject({ current: 1, best: 1 });
  });

  it('выполнение в невыбранный день засчитывается как бонус', () => {
    const m = marks(['2026-09-07', '2026-09-08', '2026-09-09']);
    expect(calculateStreaks(h, m, '2026-09-09')).toMatchObject({ current: 3 });
  });

  it('невыполнение в невыбранный день — не пропуск', () => {
    const m = marks(['2026-09-04', '2026-09-07']); // Пт и следующий Пн
    expect(calculateStreaks(h, m, '2026-09-08')).toMatchObject({ current: 2 });
  });

  it('уважительный пропуск выбранного дня не обрывает серию', () => {
    const m = marks(['2026-09-07', '2026-09-11'], ['2026-09-09']);
    expect(calculateStreaks(h, m, '2026-09-11')).toMatchObject({ current: 2 });
  });

  it('серия проходит через смену года', () => {
    const h2 = habit(monWedFri, '2025-12-01');
    // Пн 29.12, Ср 31.12, Пт 02.01, Пн 05.01
    const m = marks(['2025-12-29', '2025-12-31', '2026-01-02', '2026-01-05']);
    expect(calculateStreaks(h2, m, '2026-01-06')).toMatchObject({ current: 4 });
  });

  it('серия проходит через границу месяца', () => {
    const h2 = habit(monWedFri, '2026-09-01');
    // Ср 28.10, Пт 30.10, Пн 02.11
    const m = marks(['2026-10-28', '2026-10-30', '2026-11-02']);
    expect(calculateStreaks(h2, m, '2026-11-03')).toMatchObject({ current: 3 });
  });
});

describe('N раз в неделю (3)', () => {
  // Недели: 2026-08-31, 2026-09-07, 2026-09-14 (понедельники)
  const h = habit(threePerWeek, '2026-08-31');

  it('считает недели с выполненной нормой', () => {
    const m = marks(['2026-08-31', '2026-09-02', '2026-09-04', '2026-09-07', '2026-09-08', '2026-09-13']);
    expect(calculateStreaks(h, m, '2026-09-14')).toEqual({ current: 2, best: 2, unit: 'weeks' });
  });

  it('текущая неделя с недобором не обрывает серию', () => {
    const m = marks(['2026-08-31', '2026-09-01', '2026-09-02', '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-14']);
    expect(calculateStreaks(h, m, '2026-09-16')).toMatchObject({ current: 2 });
  });

  it('прошедшая неделя с недобором обрывает серию', () => {
    const m = marks(['2026-08-31', '2026-09-01', '2026-09-02', '2026-09-07', '2026-09-08']);
    expect(calculateStreaks(h, m, '2026-09-14')).toMatchObject({ current: 0, best: 1 });
  });

  it('неделя, добранная уважительными пропусками, нейтральна', () => {
    const m = marks(
      ['2026-08-31', '2026-09-01', '2026-09-02', '2026-09-07', '2026-09-08', '2026-09-14', '2026-09-15', '2026-09-16'],
      ['2026-09-09'],
    );
    expect(calculateStreaks(h, m, '2026-09-16')).toMatchObject({ current: 2, best: 2 });
  });

  it('неполная первая неделя не обрывает серию', () => {
    const h2 = habit(threePerWeek, '2026-09-05'); // суббота
    const m = marks(['2026-09-06', '2026-09-07', '2026-09-08', '2026-09-09']);
    expect(calculateStreaks(h2, m, '2026-09-14')).toMatchObject({ current: 1 });
  });

  it('неделя на стыке годов считается одной неделей', () => {
    const h2 = habit(threePerWeek, '2025-12-22');
    // неделя 22.12–28.12 и неделя 29.12–04.01
    const m = marks(['2025-12-22', '2025-12-23', '2025-12-24', '2025-12-31', '2026-01-01', '2026-01-04']);
    expect(calculateStreaks(h2, m, '2026-01-05')).toMatchObject({ current: 2, best: 2 });
  });

  it('53-я ISO-неделя (2026) не ломает счёт недель', () => {
    const h2 = habit(threePerWeek, '2026-12-21');
    const m = marks([
      '2026-12-21', '2026-12-22', '2026-12-23',
      '2026-12-28', '2026-12-30', '2027-01-02',
      '2027-01-04', '2027-01-05', '2027-01-06',
    ]);
    expect(calculateStreaks(h2, m, '2027-01-07')).toMatchObject({ current: 3, best: 3 });
  });

  it('выполнений больше нормы — всё равно одна неделя', () => {
    const m = marks(rangeKeys('2026-08-31', '2026-09-06'));
    expect(calculateStreaks(h, m, '2026-09-07')).toMatchObject({ current: 1 });
  });
});

describe('isDueOn', () => {
  it('ежедневная привычка запланирована каждый день', () => {
    expect(isDueOn(habit(daily, '2026-09-01'), marks([]), '2026-09-10')).toBe(true);
  });

  it('привычка по дням недели — только в выбранные дни', () => {
    const h = habit(monWedFri, '2026-09-01');
    expect(isDueOn(h, marks([]), '2026-09-07')).toBe(true);
    expect(isDueOn(h, marks([]), '2026-09-08')).toBe(false);
  });

  it('N раз в неделю скрывается, когда норма набрана, но остаётся в дни отметок', () => {
    const h = habit(threePerWeek, '2026-09-01');
    const m = marks(['2026-09-07', '2026-09-08', '2026-09-09']);
    expect(isDueOn(h, m, '2026-09-09')).toBe(true);
    expect(isDueOn(h, m, '2026-09-10')).toBe(false);
    expect(isDueOn(h, m, '2026-09-14')).toBe(true);
  });

  it('архивная привычка не запланирована после архивации', () => {
    const h = habit(daily, '2026-09-01', { archivedAt: '2026-09-05' });
    expect(isDueOn(h, marks([]), '2026-09-06')).toBe(false);
  });
});
