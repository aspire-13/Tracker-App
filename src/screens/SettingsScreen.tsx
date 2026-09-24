import { type ChangeEvent, useRef, useState } from 'react';
import type { AppData, ThemePreference } from '../types';
import { useStore } from '../state/AppStore';
import { createEmptyData, parseAppData, serializeForExport } from '../storage';
import { paths } from '../router';
import { Card, PageHeader, buttonPrimary, buttonSecondary } from '../components/Layout';
import { Sheet } from '../components/Sheet';

const THEMES: { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'system', label: 'Системная', icon: '🖥️' },
  { value: 'light', label: 'Светлая', icon: '☀️' },
  { value: 'dark', label: 'Тёмная', icon: '🌙' },
];

export function SettingsScreen() {
  const { data, today, setTheme, replaceData } = useStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<AppData | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const exportData = () => {
    const blob = new Blob([serializeForExport(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habits-${today}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage({ kind: 'ok', text: 'Файл с данными сохранён.' });
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed = parseAppData(JSON.parse(await file.text()));
      setPendingImport(parsed);
      setMessage(null);
    } catch (err) {
      const reason = err instanceof SyntaxError ? 'файл не является корректным JSON' : (err as Error).message;
      setMessage({ kind: 'error', text: `Не удалось импортировать: ${reason}.` });
    }
  };

  const archivedCount = data.habits.filter((h) => h.archivedAt).length;

  return (
    <>
      <PageHeader title="Настройки" />

      <Card className="mb-4">
        <h2 className="mb-3 font-semibold">Тема оформления</h2>
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800" role="radiogroup" aria-label="Тема">
          {THEMES.map((t) => {
            const active = data.settings.theme === t.value;
            return (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(t.value)}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-sm font-medium ${active ? 'bg-white shadow-sm dark:bg-slate-700' : 'text-slate-600 dark:text-slate-300'}`}
              >
                <span aria-hidden>{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="font-semibold">Данные</h2>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          Всё хранится только на этом устройстве. Сделайте резервную копию, чтобы перенести данные или не потерять их.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={buttonSecondary} onClick={exportData}>⬇️ Экспорт</button>
          <button type="button" className={buttonSecondary} onClick={() => fileInput.current?.click()}>⬆️ Импорт</button>
        </div>
        <input ref={fileInput} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
        {message && (
          <p role="status" className={`mt-3 text-sm ${message.kind === 'error' ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
            {message.text}
          </p>
        )}
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Привычек: {data.habits.length} (в архиве: {archivedCount}) · отметок: {data.completions.length} · заметок: {data.notes.length}
        </p>
        {archivedCount > 0 && (
          <a href={paths.habits} className="mt-2 inline-block text-sm font-medium text-emerald-700 dark:text-emerald-400">Открыть архив →</a>
        )}
      </Card>

      <Card className="mb-4">
        <h2 className="mb-1 font-semibold">Сброс</h2>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">Удалить все привычки, отметки и заметки.</p>
        <button type="button" className={`${buttonSecondary} w-full text-red-600 dark:text-red-400`} onClick={() => setConfirmReset(true)}>
          Удалить все данные
        </button>
      </Card>

      <p className="text-center text-xs text-slate-400">Трекер привычек · работает офлайн</p>

      <Sheet open={pendingImport !== null} onClose={() => setPendingImport(null)} title="Заменить данные?">
        {pendingImport && (
          <>
            <p className="mb-4 px-2 text-sm text-slate-600 dark:text-slate-300">
              В файле: привычек — {pendingImport.habits.length}, отметок — {pendingImport.completions.length}, заметок — {pendingImport.notes.length}.
              Текущие данные будут полностью заменены. Советуем сначала сделать экспорт.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className={buttonSecondary} onClick={() => setPendingImport(null)}>Отмена</button>
              <button
                type="button"
                className={buttonPrimary}
                onClick={() => {
                  replaceData(pendingImport);
                  setPendingImport(null);
                  setMessage({ kind: 'ok', text: 'Данные импортированы.' });
                }}
              >
                Заменить
              </button>
            </div>
          </>
        )}
      </Sheet>

      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} title="Удалить все данные?">
        <p className="mb-4 px-2 text-sm text-slate-600 dark:text-slate-300">Это действие нельзя отменить. Настройки темы сохранятся.</p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={buttonSecondary} onClick={() => setConfirmReset(false)}>Отмена</button>
          <button
            type="button"
            className={`${buttonPrimary} bg-red-600 hover:bg-red-700 active:bg-red-800`}
            onClick={() => {
              replaceData({ ...createEmptyData(), settings: data.settings });
              setConfirmReset(false);
              setMessage({ kind: 'ok', text: 'Все данные удалены.' });
            }}
          >
            Удалить
          </button>
        </div>
      </Sheet>
    </>
  );
}
