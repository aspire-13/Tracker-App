import type { AppData } from '../types';

/**
 * Абстракция хранилища. Сейчас реализована поверх localStorage;
 * для синхронизации с сервером достаточно написать адаптер с тем же интерфейсом.
 */
export interface StorageAdapter {
  /** Загружает данные; `null`, если сохранённых данных нет. */
  load(): Promise<AppData | null>;
  save(data: AppData): Promise<void>;
  clear(): Promise<void>;
}
