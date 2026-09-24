import { useMemo } from 'react';
import type { CompletionStatus, DateKey } from '../types';
import { useStore } from '../state/AppStore';
import { paths } from '../router';
import { WEEKDAY_LONG, WEEKDAY_SHORT, addDays } from '../utils/dates';
import { activeHabits, streakLabel } from '../utils/format';
import { calculateStreaks } from '../utils/streaks';
import { type Rate, bestAndWorstWeekdays, habitRate, overallRate, percent, ratio, weekdayStats } from '../utils/stats';
import { Card, EmptyState, PageHeader, buttonPrimary } from '../components/Layout';
import { HabitIcon } from '../components/HabitIcon';
import { MOODS } from '../components/DayNoteCard';

const EMPTY: ReadonlyMap<DateKey, CompletionStatus> = new Map();
const WEEKDAY_WINDOW = 84; // 12 недель

export function StatsScreen() {
  const { data, index, today } = useStore();
  const habits = useMemo(() => activeHabits(data.habits), [data.habits]);

  const stats = useMemo(() => {
    const period = (days: number, offset = 0) =>
      overallRate(habits, index, addDays(today, -(days - 1) - offset), addDays(today, -offset), today);
    const weekdays = weekdayStats(habits, index, today, WEEKDAY_WINDOW);
    return {
      week: period(7),
      prevWeek: period(7, 7),
      month: period(30),
      prevMonth: period(30, 30),
      weekdays,
      ...bestAndWorstWeekdays(weekdays),
    };
  }, [habits, index, today]);

  const mood = useMemo(() => {
    const from = addDays(today, -29);
    const moods = data.notes.filter((n) => n.date >= from && n.mood).map((n) => n.mood!);
    if (moods.length === 0) return null;
    return { avg: moods.reduce((a, b) => a + b, 0) / moods.length, count: moods.length };
  }, [data.notes, today]);

  if (habits.length === 0) {
    return (
      <>
        <PageHeader title="Статистика" />
        <EmptyState
          emoji="📊"
          title="Пока нечего считать"
          text="Добавьте привычку и отмечайте выполнение — здесь появится процент выполнения и лучшие дни недели."
          action={<a href={paths.habitNew} className={buttonPrimary}>Добавить первую привычку</a>}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Статистика" subtitle="По активным привычкам" />

      <div className="mb-4 grid grid-cols-2 gap-2">
        <RateTile label="За 7 дней" rate={stats.week} prev={stats.prevWeek} />
        <RateTile label="За 30 дней" rate={stats.month} prev={stats.prevMonth} />
      </div>

      <Card className="mb-4">
        <h2 className="font-semibold">Выполнение по дням недели</h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">За последние 12 недель</p>
        <WeekdayBars stats={stats.weekdays} bestDay={stats.best?.weekday} worstDay={stats.worst?.weekday} />
        {stats.best && stats.worst ? (
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-800">
              <dt className="text-xs text-slate-500 dark:text-slate-400">💪 Лучший день</dt>
              <dd className="font-semibold">{WEEKDAY_LONG[stats.best.weekday]} · {percent(stats.best)}%</dd>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-800">
              <dt className="text-xs text-slate-500 dark:text-slate-400">🐢 Сложнее всего</dt>
              <dd className="font-semibold">{WEEKDAY_LONG[stats.worst.weekday]} · {percent(stats.worst)}%</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Отмечайте привычки несколько дней — и здесь появятся лучший и худший дни недели.</p>
        )}
      </Card>

      <Card className="mb-4">
        <h2 className="mb-3 font-semibold">По привычкам</h2>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {habits.map((h) => {
            const c = index.get(h.id) ?? EMPTY;
            const w = percent(habitRate(h, c, addDays(today, -6), today, today));
            const m = percent(habitRate(h, c, addDays(today, -29), today, today));
            const s = calculateStreaks(h, c, today);
            return (
              <li key={h.id}>
                <a href={paths.habitDetail(h.id)} className="flex items-center gap-3 py-2">
                  <HabitIcon emoji={h.emoji} color={h.color} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{h.name}</span>
                    <span className="flex gap-3 text-xs text-slate-500 tabular-nums dark:text-slate-400">
                      <span>7 дн: <b className="text-slate-900 dark:text-slate-100">{w === null ? '—' : `${w}%`}</b></span>
                      <span>30 дн: <b className="text-slate-900 dark:text-slate-100">{m === null ? '—' : `${m}%`}</b></span>
                      <span>🔥 <b className="text-slate-900 dark:text-slate-100">{streakLabel(s.current, s.unit)}</b></span>
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Уважительные пропуски не снижают процент выполнения.</p>
      </Card>

      {mood && (
        <Card>
          <h2 className="font-semibold">Настроение за 30 дней</h2>
          <p className="mt-2 flex items-center gap-3">
            <span className="text-4xl" aria-hidden>{MOODS[Math.round(mood.avg) - 1].emoji}</span>
            <span>
              <span className="text-xl font-bold">{mood.avg.toFixed(1)}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400"> из 5 · записей: {mood.count}</span>
            </span>
          </p>
        </Card>
      )}
    </>
  );
}

function RateTile({ label, rate, prev }: { label: string; rate: Rate; prev: Rate }) {
  const p = percent(rate);
  const cur = ratio(rate);
  const before = ratio(prev);
  const delta = cur !== null && before !== null ? Math.round((cur - before) * 100) : null;
  return (
    <Card className="p-4">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-3xl font-bold tabular-nums">{p === null ? '—' : `${p}%`}</p>
      {delta !== null && delta !== 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          <span aria-hidden>{delta > 0 ? '▲' : '▼'}</span> {delta > 0 ? '+' : '−'}{Math.abs(delta)} п.п. к прошлому периоду
        </p>
      )}
      {delta === 0 && <p className="text-xs text-slate-500 dark:text-slate-400">как в прошлом периоде</p>}
    </Card>
  );
}

function WeekdayBars({ stats, bestDay, worstDay }: { stats: ReturnType<typeof weekdayStats>; bestDay?: number; worstDay?: number }) {
  return (
    <div className="grid grid-cols-7 gap-2" role="list" aria-label="Процент выполнения по дням недели">
      {stats.map((s) => {
        const p = percent(s);
        const tag = s.weekday === bestDay ? 'лучший' : s.weekday === worstDay ? 'худший' : '';
        return (
          <div key={s.weekday} role="listitem" className="flex flex-col items-center" title={`${WEEKDAY_LONG[s.weekday]}: ${p === null ? 'нет данных' : `${p}%`}`}>
            <span className="mb-1 text-xs font-semibold tabular-nums">{p === null ? '—' : p}</span>
            <div className="flex h-28 w-full items-end rounded-md bg-slate-100 dark:bg-slate-800">
              <div
                className="w-full rounded-t-[4px] bg-emerald-500 transition-[height] duration-500"
                style={{ height: `${p ?? 0}%` }}
              />
            </div>
            <span className={`mt-1 text-xs ${tag ? 'font-bold' : 'text-slate-500 dark:text-slate-400'}`}>{WEEKDAY_SHORT[s.weekday]}</span>
            <span className="h-3 text-[9px] leading-3 text-slate-500 dark:text-slate-400">{tag}</span>
          </div>
        );
      })}
    </div>
  );
}
