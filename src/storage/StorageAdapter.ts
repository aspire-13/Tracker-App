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
  /** Необязательно: уведомлять об изменениях, сделанных вне приложения (другая вкладка, сервер). */
  subscribe?(onChange: (data: AppData) => void): () => void;
}
