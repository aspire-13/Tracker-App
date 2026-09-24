import { useEffect, useRef, useState } from 'react';
import type { DateKey, Mood } from '../types';
import { useStore } from '../state/AppStore';
import { Card } from './Layout';

export const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 1, emoji: '😞', label: 'Плохо' },
  { value: 2, emoji: '😕', label: 'Так себе' },
  { value: 3, emoji: '😐', label: 'Нормально' },
  { value: 4, emoji: '🙂', label: 'Хорошо' },
  { value: 5, emoji: '😄', label: 'Отлично' },
];

/** Необязательная заметка к дню: настроение и короткий текст. */
export function DayNoteCard({ date }: { date: DateKey }) {
  const { data } = useStore();
  const note = data.notes.find((n) => n.date === date);
  // key сбрасывает черновик при смене дня
  return <NoteEditor key={date} date={date} mood={note?.mood} initialText={note?.text ?? ''} />;
}

function NoteEditor({ date, mood, initialText }: { date: DateKey; mood?: Mood; initialText: string }) {
  const { setNote } = useStore();
  const [text, setText] = useState(initialText);
  const dirty = useRef(false);
  const latest = useRef({ mood, text, setNote });
  latest.current = { mood, text, setNote };

  const flush = () => {
    if (!dirty.current) return;
    dirty.current = false;
    const { mood: m, text: t, setNote: save } = latest.current;
    save({ date, mood: m, text: t });
  };

  // Сохраняем текст с небольшой задержкой после ввода и при уходе с экрана/смене дня.
  useEffect(() => {
    const t = window.setTimeout(flush, 500);
    return () => window.clearTimeout(t);
  }, [text]);
  useEffect(() => flush, []);

  return (
    <Card className="mt-6">
      <h2 className="mb-3 font-semibold">Заметка к дню</h2>
      <div className="mb-3 flex justify-between gap-1" role="radiogroup" aria-label="Настроение">
        {MOODS.map((m) => {
          const active = m.value === mood;
          return (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={m.label}
              title={m.label}
              onClick={() => {
                dirty.current = false;
                setNote({ date, mood: active ? undefined : m.value, text });
              }}
              className={`grid size-12 place-items-center rounded-2xl text-2xl transition ${active ? 'scale-110 bg-emerald-100 ring-2 ring-emerald-500 dark:bg-emerald-900/40' : 'opacity-60 grayscale hover:opacity-100 hover:grayscale-0'}`}
            >
              {m.emoji}
            </button>
          );
        })}
      </div>
      <textarea
        value={text}
        onChange={(e) => {
          dirty.current = true;
          setText(e.target.value.slice(0, 500));
        }}
        onBlur={flush}
        rows={2}
        maxLength={500}
        placeholder="Как прошёл день? (необязательно)"
        className="w-full resize-none rounded-2xl bg-slate-100 px-3 py-2 text-base placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800"
      />
    </Card>
  );
}
