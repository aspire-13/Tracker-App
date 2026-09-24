import { type ReactNode, useEffect } from 'react';

/** Нижняя шторка (на широких экранах — диалог по центру). */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose(): void; title?: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Закрыть" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-3xl dark:bg-slate-900">
        {title && <h2 className="mb-3 px-2 text-lg font-semibold">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

export function SheetAction({ onClick, children, danger }: { onClick(): void; children: ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-base hover:bg-slate-100 active:bg-slate-200 dark:hover:bg-slate-800 dark:active:bg-slate-700 ${danger ? 'text-red-600 dark:text-red-400' : ''}`}
    >
      {children}
    </button>
  );
}
