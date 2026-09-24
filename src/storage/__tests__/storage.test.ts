import { describe, expect, it } from 'vitest';
import { createEmptyData, parseAppData } from '../serialization';
import { createLocalStorageAdapter } from '../localStorageAdapter';
import type { AppData } from '../../types';

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() { return this.map.size; }
  clear() { this.map.clear(); }
  getItem(k: string) { return this.map.get(k) ?? null; }
  key(i: number) { return [...this.map.keys()][i] ?? null; }
  removeItem(k: string) { this.map.delete(k); }
  setItem(k: string, v: string) { this.map.set(k, v); }
}

const sample: AppData = {
  ...createEmptyData(),
  habits: [
    { id: 'a', name: 'Вода', emoji: '💧', color: '#0ea5e9', frequency: { type: 'daily' }, createdAt: '2026-09-01', order: 0 },
  ],
  completions: [{ habitId: 'a', date: '2026-09-02', status: 'done' }],
  notes: [{ date: '2026-09-02', mood: 4, text: 'Хороший день' }],
};

describe('localStorageAdapter', () => {
  it('сохраняет и загружает данные', async () => {
    const adapter = createLocalStorageAdapter(new MemoryStorage());
    expect(await adapter.load()).toBeNull();
    await adapter.save(sample);
    expect(await adapter.load()).toEqual(sample);
  });

  it('повреждённые данные сохраняются копией и не ломают загрузку', async () => {
    const mem = new MemoryStorage();
    mem.setItem('k', '{broken');
    const adapter = createLocalStorageAdapter(mem, 'k');
    expect(await adapter.load()).toBeNull();
    expect(mem.length).toBe(2);
  });
});

describe('parseAppData', () => {
  it('принимает корректные данные', () => {
    expect(parseAppData(JSON.parse(JSON.stringify(sample)))).toEqual(sample);
  });

  it('отбрасывает отметки удалённых привычек и дубликаты', () => {
    const data = parseAppData({
      ...sample,
      completions: [
        { habitId: 'a', date: '2026-09-02', status: 'done' },
        { habitId: 'a', date: '2026-09-02', status: 'skipped' },
        { habitId: 'zzz', date: '2026-09-02', status: 'done' },
      ],
    });
    expect(data.completions).toEqual([{ habitId: 'a', date: '2026-09-02', status: 'skipped' }]);
  });

  it.each([
    ['не объект', []],
    ['другая версия', { ...sample, version: 99 }],
    ['неверная дата', { ...sample, completions: [{ habitId: 'a', date: '2026-02-30', status: 'done' }] }],
    ['неверная частота', { ...sample, habits: [{ ...sample.habits[0], frequency: { type: 'weekdays', days: [] } }] }],
    ['повтор id', { ...sample, habits: [sample.habits[0], sample.habits[0]] }],
  ])('отклоняет некорректные данные: %s', (_, input) => {
    expect(() => parseAppData(input)).toThrow();
  });
});
