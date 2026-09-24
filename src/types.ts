/** Календарная дата в локальной зоне пользователя, формат `YYYY-MM-DD`. */
export type DateKey = string;

/** День недели: 0 = понедельник … 6 = воскресенье. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Frequency =
  | { type: 'daily' }
  | { type: 'weekdays'; days: Weekday[] }
  | { type: 'timesPerWeek'; count: number };

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  /** HEX-цвет, например `#10b981`. */
  color: string;
  frequency: Frequency;
  /** Дата создания — от неё начинается учёт пропусков. */
  createdAt: DateKey;
  /** Дата архивации; архивная привычка не показывается на экране «Сегодня». */
  archivedAt?: DateKey;
  /** Порядок сортировки в списках. */
  order: number;
}

/**
 * Отметка по привычке за день.
 * `done` — выполнено, `skipped` — пропуск по уважительной причине (не обрывает серию).
 * Отсутствие записи означает, что день не отмечен.
 */
export type CompletionStatus = 'done' | 'skipped';

export interface Completion {
  habitId: string;
  date: DateKey;
  status: CompletionStatus;
}

export type Mood = 1 | 2 | 3 | 4 | 5;

export interface DayNote {
  date: DateKey;
  mood?: Mood;
  text?: string;
}

export type ThemePreference = 'system' | 'light' | 'dark';

export interface Settings {
  theme: ThemePreference;
}

export const DATA_VERSION = 1;

export interface AppData {
  version: typeof DATA_VERSION;
  habits: Habit[];
  completions: Completion[];
  notes: DayNote[];
  settings: Settings;
}
