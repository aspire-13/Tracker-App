import { useMemo, useState } from 'react';
import type { CompletionStatus, DateKey, Habit } from '../types';
import { useStore } from '../state/AppStore';
import { paths } from '../router';
import { BACKFILL_DAYS, WEEKDAY_LONG, WEEKDAY_SHORT, addDays, canEditDate, formatDayMonth, fromKey, weekday, weekStart } from '../utils/dates';
import { activeHabits, streakLabel } from '../utils/format';
import { calculateStreaks, countWeek, isDueOn } from '../utils/streaks';
import { dayProgress } from '../utils/stats';
import { Card, EmptyState, PageHeader, buttonPrimary, buttonSecondary, iconButton } from '../components/Layout';
import { CheckButton } from '../components/CheckButton';
import { HabitIcon } from '../components/HabitIcon';
import { ProgressRing } from '../components/ProgressRing';
import { Sheet, SheetAction } from '../components/Sheet';
import { MoreIcon, PlusIcon } from '../components/icons';
import { DayNoteCard } from '../components/DayNoteCard';
import { TemplatePicker } from '../components/TemplatePicker';

const EMPTY: ReadonlyMap<DateKey, CompletionStatus> = new Map();

export function TodayScreen() {
  const { data, index, today } = useStore();
  const [selected, setSelected] = useState<DateKey>(today);
  const [menuHabit, setMenuHabit] = useState<Habit | null>(null);

  // Если наступила полночь или выбранный день вышел за пределы окна — возвращаемся к сегодня.
  const date = canEditDate(selected, today) ? selected : today;
  const habits = useMemo(() => activeHabits(data.habits), [data.habits]);
  const due = habits.filter((h) => isDueOn(h, index.get(h.id) ?? EMPTY, date));
  const other = habits.filter((h) => !due.includes(h));
  const progress = dayProgress(habits, index, date);

  const title = date === today ? 'Сегодня' : date === addDays(today, -1) ? 'Вчера' : capitalize(WEEKDAY_LONG[weekday(date)]);

  if (habits.length === 0) {
    return (
      <>
        <PageHeader title="Сегодня" subtitle={formatDayMonth(today)} />
        <EmptyState
          emoji="🌱"
          title="Пока нет привычек"
          text="Начните с одной-двух простых привычек: отмечайте их каждый день и следите за сериями."
          action={
            <a href={paths.habitNew} className={buttonPrimary}>
              <PlusIcon width={20} height={20} /> Добавить первую привычку
            </a>
          }
        />
        <Card>
          <h2 className="mb-3 font-semibold">Или выберите шаблон</h2>
          <TemplatePicker />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={title}
        subtitle={formatDayMonth(date)}
        right={
          <a href={paths.habitNew} className={iconButton} aria-label="Добавить привычку">
            <PlusIcon />
          </a>
        }
      />

      <DayStrip selected={date} today={today} onSelect={setSelected} />

      <Card className="mb-4 flex items-center gap-4">
        <div className="relative">
          <ProgressRing value={progress.done} total={progress.total} />
          <span className="absolute inset-0 grid place-items-center text-sm font-bold">
            {progress.total > 0 ? `${Math.round((progress.done / progress.total) * 100)}%` : '—'}
          </span>
        </div>
        <div>
          <p className="text-lg font-semibold" aria-live="polite">
            {progress.done} из {progress.total}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {progress.total === 0
              ? 'На этот день ничего не запланировано'
              : progress.done === progress.total
                ? 'Все привычки выполнены 🎉'
                : 'привычек выполнено'}
          </p>
        </div>
      </Card>

      {due.length > 0 && (
        <ul className="space-y-2">
          {due.map((h) => (
            <HabitRow key={h.id} habit={h} date={date} onMenu={() => setMenuHabit(h)} />
          ))}
        </ul>
      )}

      {other.length > 0 && (
        <details className="group mt-5">
          <summary className="cursor-pointer list-none px-1 py-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            <span className="inline-block transition-transform group-open:rotate-90">›</span> Не по плану на этот день ({other.length})
          </summary>
          <ul className="mt-2 space-y-2 opacity-80">
            {other.map((h) => (
              <HabitRow key={h.id} habit={h} date={date} onMenu={() => setMenuHabit(h)} />
            ))}
          </ul>
        </details>
      )}

      <DayNoteCard date={date} />

      <HabitMenu habit={menuHabit} date={date} onClose={() => setMenuHabit(null)} />
    </>
  );
}

function HabitRow({ habit, date, onMenu }: { habit: Habit; date: DateKey; onMenu(): void }) {
  const { index, today, setCompletion } = useStore();
  const completions = index.get(habit.id) ?? EMPTY;
  const status = completions.get(date);
  const streak = calculateStreaks(habit, completions, today);

  const toggle = () => {
    setCompletion(habit.id, date, status === undefined ? 'done' : null);
    if (status === undefined) navigator.vibrate?.(10);
  };

  let hint: string;
  if (habit.frequency.type === 'timesPerWeek') {
    const { done } = countWeek(completions, weekStart(date));
    hint = `${done} из ${habit.frequency.count} на неделе`;
  } else {
    hint = status === 'skipped' ? 'Уважительный пропуск' : '';
  }

  return (
    <li className="flex items-center gap-3 rounded-3xl bg-white py-2 pr-1 pl-3 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
      <a href={paths.habitDetail(habit.id)} className="flex min-w-0 flex-1 items-center gap-3 py-1">
        <HabitIcon emoji={habit.emoji} color={habit.color} />
        <div className="min-w-0">
          <p className={`truncate font-medium ${status === 'done' ? 'text-slate-400 line-through decoration-2 dark:text-slate-500' : ''}`}>
            {habit.name}
          </p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {streak.current > 0 && <span className="mr-2">🔥 {streakLabel(streak.current, streak.unit)}</span>}
            {hint}
          </p>
        </div>
      </a>
      <button type="button" onClick={onMenu} className={`${iconButton} size-9`} aria-label={`Действия: ${habit.name}`}>
        <MoreIcon width={20} height={20} />
      </button>
      <CheckButton
        status={status}
        color={habit.color}
        onClick={toggle}
        label={status === 'done' ? `Снять отметку: ${habit.name}` : `Отметить выполнение: ${habit.name}`}
      />
    </li>
  );
}

function HabitMenu({ habit, date, onClose }: { habit: Habit | null; date: DateKey; onClose(): void }) {
  const { index, setCompletion } = useStore();
  if (!habit) return null;
  const status = index.get(habit.id)?.get(date);
  const set = (s: CompletionStatus | null) => {
    setCompletion(habit.id, date, s);
    onClose();
  };
  return (
    <Sheet open onClose={onClose} title={`${habit.emoji} ${habit.name}`}>
      {status !== 'done' && <SheetAction onClick={() => set('done')}>✅ Выполнено</SheetAction>}
      {status !== 'skipped' && (
        <SheetAction onClick={() => set('skipped')}>
          <span>⏸️</span>
          <span>
            Пропуск по уважительной причине
            <span className="block text-xs text-slate-500 dark:text-slate-400">Серия не прервётся</span>
          </span>
        </SheetAction>
      )}
      {status !== undefined && <SheetAction onClick={() => set(null)}>↩️ Снять отметку</SheetAction>}
      <SheetAction onClick={() => { onClose(); location.hash = paths.habitDetail(habit.id); }}>📈 Подробнее</SheetAction>
      <button type="button" onClick={onClose} className={`${buttonSecondary} mt-2 w-full`}>Отмена</button>
    </Sheet>
  );
}

function DayStrip({ selected, today, onSelect }: { selected: DateKey; today: DateKey; onSelect(d: DateKey): void }) {
  const { data, index } = useStore();
  const habits = useMemo(() => activeHabits(data.habits), [data.habits]);
  const days = Array.from({ length: BACKFILL_DAYS + 1 }, (_, i) => addDays(today, i - BACKFILL_DAYS));
  return (
    <div className="mb-4 grid grid-cols-8 gap-1" role="tablist" aria-label="Выбор дня">
      {days.map((d) => {
        const p = dayProgress(habits, index, d);
        const complete = p.total > 0 && p.done === p.total;
        const active = d === selected;
        return (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={`${formatDayMonth(d)}: ${p.done} из ${p.total}`}
            onClick={() => onSelect(d)}
            className={`flex flex-col items-center rounded-2xl py-1.5 text-xs transition-colors ${active ? 'bg-emerald-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-900'}`}
          >
            <span className={active ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}>{WEEKDAY_SHORT[weekday(d)]}</span>
            <span className="text-base font-semibold">{fromKey(d).getDate()}</span>
            <span
              className={`mt-0.5 size-1.5 rounded-full ${complete ? (active ? 'bg-white' : 'bg-emerald-500') : p.done > 0 ? (active ? 'bg-emerald-200' : 'bg-emerald-300 dark:bg-emerald-700') : 'bg-transparent'}`}
            />
          </button>
        );
      })}
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
