import { useMemo } from 'react';
import type { CompletionStatus, DateKey, Habit } from '../types';
import { useStore } from '../state/AppStore';
import { paths } from '../router';
import { activeHabits, archivedHabits, frequencyLabel, streakLabel } from '../utils/format';
import { calculateStreaks } from '../utils/streaks';
import { Card, EmptyState, PageHeader, buttonPrimary, iconButton } from '../components/Layout';
import { HabitIcon } from '../components/HabitIcon';
import { PlusIcon } from '../components/icons';
import { TemplatePicker } from '../components/TemplatePicker';

const EMPTY: ReadonlyMap<DateKey, CompletionStatus> = new Map();

export function HabitsScreen() {
  const { data } = useStore();
  const active = useMemo(() => activeHabits(data.habits), [data.habits]);
  const archived = useMemo(() => archivedHabits(data.habits), [data.habits]);

  return (
    <>
      <PageHeader
        title="Привычки"
        subtitle={active.length > 0 ? `Активных: ${active.length}` : undefined}
        right={
          <a href={paths.habitNew} className={iconButton} aria-label="Добавить привычку">
            <PlusIcon />
          </a>
        }
      />

      {active.length === 0 ? (
        <EmptyState
          emoji="📋"
          title="Список пуст"
          text="Добавьте свою привычку или выберите шаблон ниже."
          action={
            <a href={paths.habitNew} className={buttonPrimary}>
              <PlusIcon width={20} height={20} /> Добавить первую привычку
            </a>
          }
        />
      ) : (
        <ul className="space-y-2">
          {active.map((h) => <HabitListItem key={h.id} habit={h} />)}
        </ul>
      )}

      <Card className="mt-6">
        <h2 className="mb-3 font-semibold">Шаблоны</h2>
        <TemplatePicker />
      </Card>

      {archived.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 px-1 text-sm font-medium text-slate-500 dark:text-slate-400">Архив ({archived.length})</h2>
          <ul className="space-y-2 opacity-70">
            {archived.map((h) => <HabitListItem key={h.id} habit={h} />)}
          </ul>
        </section>
      )}
    </>
  );
}

function HabitListItem({ habit }: { habit: Habit }) {
  const { index, today } = useStore();
  const streak = calculateStreaks(habit, index.get(habit.id) ?? EMPTY, today);
  return (
    <li>
      <a
        href={paths.habitDetail(habit.id)}
        className="flex items-center gap-3 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-200/70 hover:bg-slate-50 dark:bg-slate-900 dark:ring-slate-800 dark:hover:bg-slate-800/60"
      >
        <HabitIcon emoji={habit.emoji} color={habit.color} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{habit.name}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{frequencyLabel(habit.frequency)}</p>
        </div>
        <div className="text-right text-xs text-slate-500 dark:text-slate-400">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">🔥 {streak.current}</p>
          <p>лучшая {streakLabel(streak.best, streak.unit)}</p>
        </div>
      </a>
    </li>
  );
}
