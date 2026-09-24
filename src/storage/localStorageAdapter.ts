import type { StorageAdapter } from './StorageAdapter';
import { parseAppData } from './serialization';

export const STORAGE_KEY = 'habit-tracker:data';

export function createLocalStorageAdapter(storage: Storage = window.localStorage, key = STORAGE_KEY): StorageAdapter {
  return {
    async load() {
      const raw = storage.getItem(key);
      if (raw === null) return null;
      try {
        return parseAppData(JSON.parse(raw));
      } catch (e) {
        // Не затираем повреждённые данные молча — сохраняем копию для ручного восстановления.
        storage.setItem(`${key}:corrupted:${Date.now()}`, raw);
        console.error('Не удалось прочитать сохранённые данные', e);
        return null;
      }
    },
    async save(data) {
      storage.setItem(key, JSON.stringify(data));
    },
    async clear() {
      storage.removeItem(key);
    },
    subscribe(onChange) {
      // Событие storage приходит только из других вкладок того же сайта.
      const handler = (e: StorageEvent) => {
        if (e.key !== key || e.newValue === null) return;
        try {
          onChange(parseAppData(JSON.parse(e.newValue)));
        } catch (err) {
          console.error('Некорректные данные из другой вкладки', err);
        }
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    },
  };
}
