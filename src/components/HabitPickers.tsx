import type { Frequency, Weekday } from '../types';
import { WEEKDAY_SHORT } from '../utils/dates';
import { timesWord } from '../utils/format';

export const HABIT_COLORS = [
  '#10b981', '#22c55e', '#14b8a6', '#0ea5e9', '#6366f1', '#8b5cf6',
  '#d946ef', '#e11d48', '#ef4444', '#f97316', '#eab308', '#64748b',
];

export const HABIT_EMOJIS = [
  '✅', '💧', '🤸', '🏃', '🚶', '🏋️', '🧘', '🚴', '🏊', '📚', '✍️', '🧠',
  '😴', '🛏️', '🍎', '🥗', '🥦', '🚭', '☕', '💊', '🦷', '🧴', '🧹', '🪴',
  '🎸', '🎨', '🗣️', '💻', '💰', '📵', '🙏', '❤️', '🌅', '🐕', '📝', '⭐',
];

export function EmojiPicker({ value, onChange }: { value: string; onChange(v: string): void }) {
  return (
    <div className="grid grid-cols-6 gap-1 sm:grid-cols-9" role="radiogroup" aria-label="Иконка">
      {HABIT_EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          role="radio"
          aria-checked={e === value}
          aria-label={e}
          onClick={() => onChange(e)}
          className={`grid aspect-square place-items-center rounded-xl text-2xl ${e === value ? 'bg-emerald-100 ring-2 ring-emerald-500 dark:bg-emerald-900/40' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

export function ColorPicker({ value, onChange }: { value: string; onChange(v: string): void }) {
  return (
    <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label="Цвет">
      {HABIT_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={c === value}
          aria-label={c}
          onClick={() => onChange(c)}
          className="grid aspect-square place-items-center rounded-full"
          style={{ backgroundColor: c }}
        >
          {c === value && <span className="size-3 rounded-full bg-white" />}
        </button>
      ))}
    </div>
  );
}

const segment = (active: boolean) =>
  `flex-1 whitespace-nowrap rounded-xl px-1 py-2 text-sm font-medium transition ${active ? 'bg-white shadow-sm dark:bg-slate-700' : 'text-slate-600 dark:text-slate-300'}`;

export function FrequencyPicker({ value, onChange }: { value: Frequency; onChange(v: Frequency): void }) {
  const days: Weekday[] = value.type === 'weekdays' ? value.days : [0, 1, 2, 3, 4];
  const count = value.type === 'timesPerWeek' ? value.count : 3;

  const toggleDay = (d: Weekday) => {
    const next = days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort();
    if (next.length > 0) onChange({ type: 'weekdays', days: next as Weekday[] });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800" role="radiogroup" aria-label="Частота">
        <button type="button" role="radio" aria-checked={value.type === 'daily'} className={segment(value.type === 'daily')} onClick={() => onChange({ type: 'daily' })}>
          Ежедневно
        </button>
        <button type="button" role="radio" aria-checked={value.type === 'weekdays'} className={segment(value.type === 'weekdays')} onClick={() => onChange({ type: 'weekdays', days })}>
          По дням
        </button>
        <button type="button" role="radio" aria-checked={value.type === 'timesPerWeek'} className={segment(value.type === 'timesPerWeek')} onClick={() => onChange({ type: 'timesPerWeek', count })}>
          N в неделю
        </button>
      </div>

      {value.type === 'weekdays' && (
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAY_SHORT.map((label, i) => {
            const d = i as Weekday;
            const on = days.includes(d);
            return (
              <button
                key={label}
                type="button"
                aria-pressed={on}
                onClick={() => toggleDay(d)}
                className={`rounded-xl py-2 text-sm font-semibold ${on ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {value.type === 'timesPerWeek' && (
        <div className="flex items-center justify-between rounded-2xl bg-slate-100 p-2 dark:bg-slate-800">
          <button type="button" aria-label="Меньше" disabled={count <= 1} onClick={() => onChange({ type: 'timesPerWeek', count: count - 1 })} className="grid size-10 place-items-center rounded-xl bg-white text-xl font-bold disabled:opacity-40 dark:bg-slate-700">−</button>
          <span className="font-semibold" aria-live="polite">{count} {timesWord(count)} в неделю</span>
          <button type="button" aria-label="Больше" disabled={count >= 7} onClick={() => onChange({ type: 'timesPerWeek', count: count + 1 })} className="grid size-10 place-items-center rounded-xl bg-white text-xl font-bold disabled:opacity-40 dark:bg-slate-700">+</button>
        </div>
      )}
    </div>
  );
}
