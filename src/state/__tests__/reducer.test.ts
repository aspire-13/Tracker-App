import { describe, expect, it } from 'vitest';
import { reducer } from '../reducer';
import { createEmptyData } from '../../storage/serialization';
import type { Habit } from '../../types';

const h: Habit = { id: 'a', name: 'Вода', emoji: '💧', color: '#0ea5e9', frequency: { type: 'daily' }, createdAt: '2026-09-01', order: 0 };
const base = reducer(createEmptyData(), { type: 'habit/add', habit: h });

describe('reducer', () => {
  it('ставит, меняет и снимает отметку', () => {
    let s = reducer(base, { type: 'completion/set', habitId: 'a', date: '2026-09-02', status: 'done' });
    s = reducer(s, { type: 'completion/set', habitId: 'a', date: '2026-09-02', status: 'skipped' });
    expect(s.completions).toEqual([{ habitId: 'a', date: '2026-09-02', status: 'skipped' }]);
    s = reducer(s, { type: 'completion/set', habitId: 'a', date: '2026-09-02', status: null });
    expect(s.completions).toEqual([]);
  });

  it('архивирует и разархивирует привычку', () => {
    const s = reducer(base, { type: 'habit/archive', id: 'a', date: '2026-09-10' });
    expect(s.habits[0].archivedAt).toBe('2026-09-10');
    expect(reducer(s, { type: 'habit/unarchive', id: 'a' }).habits[0]).toEqual(h);
  });

  it('удаление привычки удаляет её отметки', () => {
    let s = reducer(base, { type: 'completion/set', habitId: 'a', date: '2026-09-02', status: 'done' });
    s = reducer(s, { type: 'habit/delete', id: 'a' });
    expect(s.habits).toEqual([]);
    expect(s.completions).toEqual([]);
  });

  it('пустая заметка удаляется', () => {
    let s = reducer(base, { type: 'note/set', note: { date: '2026-09-02', mood: 3, text: 'ok' } });
    expect(s.notes).toHaveLength(1);
    s = reducer(s, { type: 'note/set', note: { date: '2026-09-02', text: '  ' } });
    expect(s.notes).toEqual([]);
  });
});
