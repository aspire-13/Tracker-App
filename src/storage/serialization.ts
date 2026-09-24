import {
  type AppData,
  type Completion,
  type DayNote,
  type Frequency,
  type Habit,
  type Mood,
  type Settings,
  type Weekday,
  DATA_VERSION,
} from '../types';
import { isValidKey } from '../utils/dates';

export function createEmptyData(): AppData {
  return { version: DATA_VERSION, habits: [], completions: [], notes: [], settings: { theme: 'system' } };
}

export function serializeForExport(data: AppData): string {
  return JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2);
}

class ValidationError extends Error {}

function fail(path: string, message: string): never {
  throw new ValidationError(`${path}: ${message}`);
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function str(v: unknown, path: string, { max = 500, allowEmpty = false } = {}): string {
  if (typeof v !== 'string') fail(path, 'ожидалась строка');
  const s = v.trim();
  if (!allowEmpty && s === '') fail(path, 'пустая строка');
  return s.slice(0, max);
}

function date(v: unknown, path: string): string {
  if (!isValidKey(v)) fail(path, 'ожидалась дата в формате ГГГГ-ММ-ДД');
  return v;
}

function frequency(v: unknown, path: string): Frequency {
  if (!isObject(v)) fail(path, 'ожидался объект');
  switch (v.type) {
    case 'daily':
      return { type: 'daily' };
    case 'weekdays': {
      if (!Array.isArray(v.days)) fail(`${path}.days`, 'ожидался массив');
      const days = [...new Set(v.days)]
        .filter((d): d is Weekday => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6)
        .sort();
      if (days.length === 0) fail(`${path}.days`, 'нужен хотя бы один день');
      return { type: 'weekdays', days };
    }
    case 'timesPerWeek': {
      const count = v.count;
      if (!Number.isInteger(count) || (count as number) < 1 || (count as number) > 7) fail(`${path}.count`, 'ожидалось число от 1 до 7');
      return { type: 'timesPerWeek', count: count as number };
    }
    default:
      fail(`${path}.type`, 'неизвестный тип частоты');
  }
}

function habit(v: unknown, i: number): Habit {
  const path = `habits[${i}]`;
  if (!isObject(v)) fail(path, 'ожидался объект');
  const h: Habit = {
    id: str(v.id, `${path}.id`, { max: 100 }),
    name: str(v.name, `${path}.name`, { max: 60 }),
    emoji: str(v.emoji, `${path}.emoji`, { max: 16 }),
    color: typeof v.color === 'string' && /^#[0-9a-f]{6}$/i.test(v.color) ? v.color : fail(`${path}.color`, 'ожидался цвет #RRGGBB'),
    frequency: frequency(v.frequency, `${path}.frequency`),
    createdAt: date(v.createdAt, `${path}.createdAt`),
    order: typeof v.order === 'number' && Number.isFinite(v.order) ? v.order : i,
  };
  if (v.archivedAt !== undefined && v.archivedAt !== null) h.archivedAt = date(v.archivedAt, `${path}.archivedAt`);
  return h;
}

function completion(v: unknown, i: number): Completion {
  const path = `completions[${i}]`;
  if (!isObject(v)) fail(path, 'ожидался объект');
  if (v.status !== 'done' && v.status !== 'skipped') fail(`${path}.status`, 'ожидалось done или skipped');
  return { habitId: str(v.habitId, `${path}.habitId`, { max: 100 }), date: date(v.date, `${path}.date`), status: v.status };
}

function note(v: unknown, i: number): DayNote {
  const path = `notes[${i}]`;
  if (!isObject(v)) fail(path, 'ожидался объект');
  const n: DayNote = { date: date(v.date, `${path}.date`) };
  if (v.mood !== undefined && v.mood !== null) {
    if (![1, 2, 3, 4, 5].includes(v.mood as number)) fail(`${path}.mood`, 'ожидалось число от 1 до 5');
    n.mood = v.mood as Mood;
  }
  if (v.text !== undefined && v.text !== null) {
    const text = str(v.text, `${path}.text`, { max: 1000, allowEmpty: true });
    if (text) n.text = text;
  }
  return n;
}

function settings(v: unknown): Settings {
  const theme = isObject(v) ? v.theme : undefined;
  return { theme: theme === 'light' || theme === 'dark' ? theme : 'system' };
}

function list<T>(v: unknown, name: string, parse: (x: unknown, i: number) => T): T[] {
  if (v === undefined) return [];
  if (!Array.isArray(v)) fail(name, 'ожидался массив');
  return v.map(parse);
}

/**
 * Проверяет и нормализует данные из хранилища или файла импорта.
 * Бросает Error с понятным сообщением, если структура некорректна.
 */
export function parseAppData(input: unknown): AppData {
  if (!isObject(input)) fail('данные', 'ожидался JSON-объект');
  if (input.version !== DATA_VERSION) fail('version', `неподдерживаемая версия данных (${String(input.version)})`);

  const habits = list(input.habits, 'habits', habit);
  const ids = new Set<string>();
  for (const h of habits) {
    if (ids.has(h.id)) fail('habits', `повторяющийся id «${h.id}»`);
    ids.add(h.id);
  }

  // Отметки несуществующих привычек отбрасываем, дубликаты схлопываем (побеждает последняя).
  const completionMap = new Map<string, Completion>();
  for (const c of list(input.completions, 'completions', completion)) {
    if (ids.has(c.habitId)) completionMap.set(`${c.habitId}|${c.date}`, c);
  }
  const noteMap = new Map<string, DayNote>();
  for (const n of list(input.notes, 'notes', note)) noteMap.set(n.date, n);

  return {
    version: DATA_VERSION,
    habits,
    completions: [...completionMap.values()],
    notes: [...noteMap.values()],
    settings: settings(input.settings),
  };
}
