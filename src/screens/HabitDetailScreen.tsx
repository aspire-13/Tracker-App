import { useMemo, useState } from 'react';
import type { CompletionStatus, DateKey } from '../types';
import { useStore } from '../state/AppStore';
import { goBack, paths } from '../router';
import { addDays, canEditDate, formatDayMonth } from '../utils/dates';
import { frequencyLabel, streakLabel } from '../utils/format';
import { calculateStreaks } from '../utils/streaks';
import { habitRate, percent } from '../utils/stats';
import { buildHeatmap, cellState } from '../utils/heatmap';
import { Card, PageHeader, buttonSecondary, iconButton } from '../components/Layout';
import { HabitIcon } from '../components/HabitIcon';
import { Heatmap, STATE_LABEL } from '../components/Heatmap';
import { BackIcon } from '../components/icons';
import { NotFound } from './HabitFormScreen';

const EMPTY: ReadonlyMap<DateKey, CompletionStatus> = new Map();

export function HabitDetailScreen({ id }: { id: string }) {
  const { data, index, today, setCompletion } = useStore();
  const habit = data.habits.find((h) => h.id === id);
  const completions = index.get(id) ?? EMPTY;
  const [selected, setSelected] = useState<DateKey | undefined>();
  const heatmap = useMemo(() => (habit ? buildHeatmap(habit, completions, today) : null), [habit, completions, today]);

  if (!habit || !heatmap) return <NotFound />;

  const streak = calculateStreaks(habit, completions, today);
  const week = percent(habitRate(habit, completions, addDays(today, -6), today, today));
  const month = percent(habitRate(habit, completions, addDays(today, -29), today, today));
  let total = 0;
  for (const s of completions.values()) if (s === 'done') total++;

  const selectedState = selected ? cellState(habit, completions, selected, today) : null;
  const selectedStatus = selected ? completions.get(selected) : undefined;

  return (
    <>
      <PageHeader
        title={habit.name}
        subtitle={habit.archivedAt ? `В архиве с ${formatDayMonth(habit.archivedAt)}` : frequencyLabel(habit.frequency)}
        left={
          <button type="button" onClick={() => goBack(paths.habits)} className={`${iconButton} -ml-3`} aria-label="Назад">
            <BackIcon />
          </button>
        }
        right={
          <a href={paths.habitEdit(habit.id)} className={`${buttonSecondary} px-4 py-2 text-sm`}>Изменить</a>
        }
      />

      <Card className="mb-4 flex items-center gap-4">
        <HabitIcon emoji={habit.emoji} color={habit.color} size="lg" />
        <div className="grid flex-1 grid-cols-2 gap-2">
          <Metric label="Текущая серия" value={`🔥 ${streak.current}`} hint={streakLabel(streak.current, streak.unit).replace(/^\d+ /, '')} />
          <Metric label="Лучшая серия" value={`🏆 ${streak.best}`} hint={streakLabel(streak.best, streak.unit).replace(/^\d+ /, '')} />
        </div>
      </Card>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <Card className="p-3 text-center"><Metric label="7 дней" value={week === null ? '—' : `${week}%`} /></Card>
        <Card className="p-3 text-center"><Metric label="30 дней" value={month === null ? '—' : `${month}%`} /></Card>
        <Card className="p-3 text-center"><Metric label="Всего" value={String(total)} /></Card>
      </div>

      <Card>
        <h2 className="mb-3 font-semibold">Последние 6 месяцев</h2>
        <Heatmap data={heatmap} color={habit.color} selected={selected} onSelect={(d) => setSelected(d === selected ? undefined : d)} />

        {selected && selectedState && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-slate-100 p-3 text-sm dark:bg-slate-800">
            <span className="flex-1">
              <b>{formatDayMonth(selected)}</b> — {STATE_LABEL[selectedState]}
            </span>
            {canEditDate(selected, today) && !habit.archivedAt && (
              <div className="flex gap-1">
                <DayButton active={selectedStatus === 'done'} onClick={() => setCompletion(habit.id, selected, selectedStatus === 'done' ? null : 'done')}>✅</DayButton>
                <DayButton active={selectedStatus === 'skipped'} onClick={() => setCompletion(habit.id, selected, selectedStatus === 'skipped' ? null : 'skipped')}>⏸️</DayButton>
              </div>
            )}
          </div>
        )}
        {!selected && (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Нажмите на клетку, чтобы увидеть день. Последние 7 дней можно отметить.</p>
        )}
      </Card>
    </>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-xl font-bold">{value}</p>
      {hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

function DayButton({ active, onClick, children }: { active: boolean; onClick(): void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`grid size-10 place-items-center rounded-xl text-lg ${active ? 'bg-white ring-2 ring-emerald-500 dark:bg-slate-700' : 'opacity-60'}`}
    >
      {children}
    </button>
  );
}
