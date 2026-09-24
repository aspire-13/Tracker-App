import type { AppData, CompletionStatus, DateKey, DayNote, Habit, ThemePreference } from '../types';

export type HabitInput = Pick<Habit, 'name' | 'emoji' | 'color' | 'frequency'>;

export type Action =
  | { type: 'habit/add'; habit: Habit }
  | { type: 'habit/update'; id: string; patch: Partial<HabitInput> }
  | { type: 'habit/archive'; id: string; date: DateKey }
  | { type: 'habit/unarchive'; id: string }
  | { type: 'habit/delete'; id: string }
  | { type: 'completion/set'; habitId: string; date: DateKey; status: CompletionStatus | null }
  | { type: 'note/set'; note: DayNote }
  | { type: 'settings/theme'; theme: ThemePreference }
  | { type: 'data/replace'; data: AppData };

export function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'habit/add':
      return { ...state, habits: [...state.habits, action.habit] };

    case 'habit/update':
      return {
        ...state,
        habits: state.habits.map((h) => (h.id === action.id ? { ...h, ...action.patch } : h)),
      };

    case 'habit/archive':
      return {
        ...state,
        habits: state.habits.map((h) => (h.id === action.id ? { ...h, archivedAt: action.date } : h)),
      };

    case 'habit/unarchive':
      return {
        ...state,
        habits: state.habits.map((h) => {
          if (h.id !== action.id) return h;
          const { archivedAt: _, ...rest } = h;
          return rest;
        }),
      };

    case 'habit/delete':
      return {
        ...state,
        habits: state.habits.filter((h) => h.id !== action.id),
        completions: state.completions.filter((c) => c.habitId !== action.id),
      };

    case 'completion/set': {
      const rest = state.completions.filter((c) => !(c.habitId === action.habitId && c.date === action.date));
      if (action.status === null) return { ...state, completions: rest };
      return {
        ...state,
        completions: [...rest, { habitId: action.habitId, date: action.date, status: action.status }],
      };
    }

    case 'note/set': {
      const rest = state.notes.filter((n) => n.date !== action.note.date);
      const text = action.note.text?.trim();
      const note: DayNote = { date: action.note.date };
      if (action.note.mood) note.mood = action.note.mood;
      if (text) note.text = action.note.text;
      const isEmpty = !note.mood && !note.text;
      return { ...state, notes: isEmpty ? rest : [...rest, note] };
    }

    case 'settings/theme':
      return { ...state, settings: { ...state.settings, theme: action.theme } };

    case 'data/replace':
      return action.data;
  }
}
