import { type FormEvent, useState } from 'react';
import type { Frequency, Habit } from '../types';
import { useStore } from '../state/AppStore';
import { goBack, navigate, paths } from '../router';
import { Card, EmptyState, PageHeader, buttonPrimary, buttonSecondary, iconButton } from '../components/Layout';
import { ColorPicker, EmojiPicker, FrequencyPicker, HABIT_COLORS } from '../components/HabitPickers';
import { HabitIcon } from '../components/HabitIcon';
import { Sheet } from '../components/Sheet';
import { BackIcon } from '../components/icons';
import { TemplatePicker } from '../components/TemplatePicker';
import { frequencyLabel } from '../utils/format';

export function HabitFormScreen({ id }: { id?: string }) {
  const { data } = useStore();
  if (id === undefined) return <HabitForm />;
  const habit = data.habits.find((h) => h.id === id);
  if (!habit) return <NotFound />;
  return <HabitForm habit={habit} />;
}

export function NotFound() {
  return (
    <EmptyState
      emoji="🔍"
      title="Привычка не найдена"
      text="Возможно, она была удалена."
      action={<a href={paths.habits} className={buttonSecondary}>К списку привычек</a>}
    />
  );
}

function HabitForm({ habit }: { habit?: Habit }) {
  const { addHabit, updateHabit, archiveHabit, unarchiveHabit, deleteHabit } = useStore();
  const [name, setName] = useState(habit?.name ?? '');
  const [emoji, setEmoji] = useState(habit?.emoji ?? '✅');
  const [color, setColor] = useState(habit?.color ?? HABIT_COLORS[0]);
  const [frequency, setFrequency] = useState<Frequency>(habit?.frequency ?? { type: 'daily' });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const trimmed = name.trim();
  const back = () => goBack(habit ? paths.habitDetail(habit.id) : paths.habits);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!trimmed) return;
    const input = { name: trimmed, emoji, color, frequency };
    if (habit) {
      updateHabit(habit.id, input);
      back();
    } else {
      addHabit(input);
      navigate(paths.today, { replace: true });
    }
  };

  return (
    <>
      <PageHeader
        title={habit ? 'Редактирование' : 'Новая привычка'}
        left={
          <button type="button" onClick={back} className={`${iconButton} -ml-3`} aria-label="Назад">
            <BackIcon />
          </button>
        }
      />

      {!habit && (
        <Card className="mb-4">
          <button type="button" onClick={() => setShowTemplates((v) => !v)} className="flex w-full items-center justify-between font-semibold" aria-expanded={showTemplates}>
            ⚡ Быстрый старт из шаблона
            <span className={`transition-transform ${showTemplates ? 'rotate-90' : ''}`}>›</span>
          </button>
          {showTemplates && <div className="mt-3"><TemplatePicker /></div>}
        </Card>
      )}

      <form onSubmit={submit} className="space-y-4">
        <Card className="flex items-center gap-3">
          <HabitIcon emoji={emoji} color={color} size="lg" />
          <div className="min-w-0 flex-1">
            <label htmlFor="habit-name" className="text-xs font-medium text-slate-500 dark:text-slate-400">Название</label>
            <input
              id="habit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              required
              autoFocus={!habit}
              placeholder="Например, зарядка"
              className="w-full border-b-2 border-slate-200 bg-transparent py-1 text-lg font-semibold outline-none focus:border-emerald-500 dark:border-slate-700"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{frequencyLabel(frequency)}</p>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold">Частота</h2>
          <FrequencyPicker value={frequency} onChange={setFrequency} />
          {frequency.type === 'weekdays' && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Невыбранные дни не прерывают серию.</p>
          )}
          {frequency.type === 'timesPerWeek' && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Серия считается в неделях, в которые норма выполнена.</p>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-semibold">Иконка</h2>
            <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              своя:
              <input
                value={emoji}
                onChange={(e) => {
                  const first = [...new Intl.Segmenter().segment(e.target.value)].pop()?.segment;
                  if (first) setEmoji(first);
                }}
                aria-label="Свой эмодзи"
                className="w-12 rounded-lg bg-slate-100 py-1 text-center text-xl dark:bg-slate-800"
              />
            </label>
          </div>
          <EmojiPicker value={emoji} onChange={setEmoji} />
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold">Цвет</h2>
          <ColorPicker value={color} onChange={setColor} />
        </Card>

        <button type="submit" disabled={!trimmed} className={`${buttonPrimary} w-full`}>
          {habit ? 'Сохранить' : 'Добавить привычку'}
        </button>
      </form>

      {habit && (
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            className={buttonSecondary}
            onClick={() => {
              if (habit.archivedAt) unarchiveHabit(habit.id);
              else archiveHabit(habit.id);
              navigate(paths.habits, { replace: true });
            }}
          >
            {habit.archivedAt ? '📤 Вернуть' : '📦 В архив'}
          </button>
          <button type="button" className={`${buttonSecondary} text-red-600 dark:text-red-400`} onClick={() => setConfirmDelete(true)}>
            🗑️ Удалить
          </button>
        </div>
      )}

      {habit && (
        <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Удалить привычку?">
          <p className="mb-4 px-2 text-sm text-slate-600 dark:text-slate-300">
            «{habit.name}» и вся история отметок будут удалены безвозвратно. Если хотите сохранить историю — отправьте привычку в архив.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={buttonSecondary} onClick={() => setConfirmDelete(false)}>Отмена</button>
            <button
              type="button"
              className={`${buttonPrimary} bg-red-600 hover:bg-red-700 active:bg-red-800`}
              onClick={() => {
                deleteHabit(habit.id);
                navigate(paths.habits, { replace: true });
              }}
            >
              Удалить
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}
