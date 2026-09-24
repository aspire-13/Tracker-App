import type { HabitInput } from '../state/reducer';

export interface HabitTemplate extends HabitInput {
  id: string;
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  { id: 'water', name: 'Выпить 8 стаканов воды', emoji: '💧', color: '#0ea5e9', frequency: { type: 'daily' } },
  { id: 'exercise', name: 'Зарядка', emoji: '🤸', color: '#f97316', frequency: { type: 'daily' } },
  { id: 'reading', name: 'Читать 20 минут', emoji: '📚', color: '#8b5cf6', frequency: { type: 'daily' } },
  { id: 'sleep', name: 'Сон до 23:00', emoji: '😴', color: '#6366f1', frequency: { type: 'daily' } },
  { id: 'walk', name: 'Прогулка 30 минут', emoji: '🚶', color: '#22c55e', frequency: { type: 'daily' } },
  { id: 'meditation', name: 'Медитация', emoji: '🧘', color: '#14b8a6', frequency: { type: 'daily' } },
  { id: 'workout', name: 'Тренировка', emoji: '🏋️', color: '#ef4444', frequency: { type: 'timesPerWeek', count: 3 } },
  { id: 'no-sugar', name: 'Без сладкого', emoji: '🍎', color: '#e11d48', frequency: { type: 'daily' } },
  { id: 'language', name: 'Иностранный язык', emoji: '🗣️', color: '#eab308', frequency: { type: 'weekdays', days: [0, 1, 2, 3, 4] } },
  { id: 'journal', name: 'Дневник', emoji: '✍️', color: '#64748b', frequency: { type: 'daily' } },
];
