import { createLocalStorageAdapter } from './localStorageAdapter';
import type { StorageAdapter } from './StorageAdapter';

export type { StorageAdapter } from './StorageAdapter';
export { parseAppData, createEmptyData, serializeForExport } from './serialization';

/** Активный адаптер хранилища. Чтобы перейти на API, замените реализацию здесь. */
export const storage: StorageAdapter = createLocalStorageAdapter();
