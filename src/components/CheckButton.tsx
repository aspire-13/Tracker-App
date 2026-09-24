import type { CompletionStatus } from '../types';
import { CheckIcon, PauseIcon } from './icons';

interface Props {
  status: CompletionStatus | undefined;
  color: string;
  label: string;
  onClick(): void;
  disabled?: boolean;
}

/** Круглая кнопка отметки. Анимация «pop» перезапускается через смену key. */
export function CheckButton({ status, color, label, onClick, disabled }: Props) {
  const done = status === 'done';
  const skipped = status === 'skipped';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={done}
      aria-label={label}
      className="grid size-12 shrink-0 place-items-center rounded-full outline-offset-2 disabled:opacity-40"
    >
      <span
        key={status ?? 'none'}
        className={`grid size-10 place-items-center rounded-full border-2 transition-colors duration-200 ${done ? 'animate-pop text-white' : ''} ${skipped ? 'border-dashed text-slate-400' : ''}`}
        style={{
          borderColor: skipped ? undefined : color,
          backgroundColor: done ? color : 'transparent',
        }}
      >
        {done && <CheckIcon width={22} height={22} strokeWidth={3} />}
        {skipped && <PauseIcon width={18} height={18} strokeWidth={2.5} />}
      </span>
    </button>
  );
}
