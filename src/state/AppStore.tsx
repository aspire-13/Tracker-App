import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { AppData, CompletionStatus, DateKey, DayNote, Habit, ThemePreference } from '../types';
import { createEmptyData, storage } from '../storage';
import { groupCompletions } from '../utils/streaks';
import { todayKey } from '../utils/dates';
import { createId } from '../utils/id';
import { type Action, type HabitInput, reducer } from './reducer';

interface Store {
  data: AppData;
  /** Отметки, сгруппированные по привычкам: habitId → (дата → статус). */
  index: ReturnType<typeof groupCompletions>;
  today: DateKey;
  addHabit(input: HabitInput): Habit;
  updateHabit(id: string, patch: Partial<HabitInput>): void;
  archiveHabit(id: string): void;
  unarchiveHabit(id: string): void;
  deleteHabit(id: string): void;
  setCompletion(habitId: string, date: DateKey, status: CompletionStatus | null): void;
  setNote(note: DayNote): void;
  setTheme(theme: ThemePreference): void;
  replaceData(data: AppData): void;
}

const StoreContext = createContext<Store | null>(null);

/** Текущая дата, обновляется после полуночи и при возвращении во вкладку. */
function useToday(): DateKey {
  const [today, setToday] = useState(todayKey);
  useEffect(() => {
    const update = () => setToday(todayKey());
    const timer = window.setInterval(update, 60_000);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  return today;
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, createEmptyData);
  const [loaded, setLoaded] = useState(false);
  const today = useToday();
  const skipNextSave = useRef(true);

  useEffect(() => {
    let cancelled = false;
    storage.load().then((saved) => {
      if (cancelled) return;
      if (saved) dispatch({ type: 'data/replace', data: saved });
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    // Первое срабатывание после загрузки — это те же данные, сохранять незачем.
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    storage.save(data).catch((e) => {
      console.error(e);
      alert('Не удалось сохранить данные. Возможно, закончилось место в хранилище браузера.');
    });
  }, [data, loaded]);

  const index = useMemo(() => groupCompletions(data.completions), [data.completions]);
  const send = useCallback((a: Action) => dispatch(a), []);

  const store = useMemo<Store>(
    () => ({
      data,
      index,
      today,
      addHabit(input) {
        const order = data.habits.reduce((max, h) => Math.max(max, h.order), -1) + 1;
        const habit: Habit = { ...input, id: createId(), createdAt: today, order };
        send({ type: 'habit/add', habit });
        return habit;
      },
      updateHabit: (id, patch) => send({ type: 'habit/update', id, patch }),
      archiveHabit: (id) => send({ type: 'habit/archive', id, date: today }),
      unarchiveHabit: (id) => send({ type: 'habit/unarchive', id }),
      deleteHabit: (id) => send({ type: 'habit/delete', id }),
      setCompletion: (habitId, date, status) => send({ type: 'completion/set', habitId, date, status }),
      setNote: (note) => send({ type: 'note/set', note }),
      setTheme: (theme) => send({ type: 'settings/theme', theme }),
      replaceData: (d) => send({ type: 'data/replace', data: d }),
    }),
    [data, index, today, send],
  );

  if (!loaded) return null;
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore вызван вне AppStoreProvider');
  return store;
}
