import { HABIT_TEMPLATES } from '../data/templates';
import { useStore } from '../state/AppStore';
import { frequencyLabel } from '../utils/format';
import { HabitIcon } from './HabitIcon';
import { CheckIcon, PlusIcon } from './icons';

/** Быстрое добавление привычек из шаблонов одним тапом. */
export function TemplatePicker() {
  const { data, addHabit } = useStore();
  const existing = new Set(data.habits.filter((h) => !h.archivedAt).map((h) => h.name.toLowerCase()));
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {HABIT_TEMPLATES.map(({ id, ...t }) => {
        const added = existing.has(t.name.toLowerCase());
        return (
          <li key={id}>
            <button
              type="button"
              disabled={added}
              onClick={() => addHabit(t)}
              className="flex w-full items-center gap-3 rounded-2xl p-2 text-left hover:bg-slate-100 active:bg-slate-200 disabled:opacity-60 dark:hover:bg-slate-800"
            >
              <HabitIcon emoji={t.emoji} color={t.color} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{t.name}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">{frequencyLabel(t.frequency)}</span>
              </span>
              <span className="grid size-8 place-items-center rounded-full text-emerald-600 dark:text-emerald-400" aria-label={added ? 'Добавлено' : 'Добавить'}>
                {added ? <CheckIcon width={18} height={18} /> : <PlusIcon width={18} height={18} />}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
