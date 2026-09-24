import type { CSSProperties } from 'react';
import type { DateKey } from '../types';
import type { CellState, HeatmapData } from '../utils/heatmap';
import { WEEKDAY_SHORT, formatDayMonth } from '../utils/dates';

const STATE_LABEL: Record<CellState, string> = {
  done: 'выполнено',
  skipped: 'уважительный пропуск',
  missed: 'пропущено',
  open: 'без отметки',
  off: 'не запланировано',
  inactive: 'вне периода',
};

function cellStyle(state: CellState, color: string): { className: string; style?: CSSProperties } {
  switch (state) {
    case 'done':
      return { className: '', style: { backgroundColor: color } };
    case 'skipped':
      return {
        className: 'bg-slate-300 dark:bg-slate-600',
        style: { backgroundImage: `repeating-linear-gradient(135deg, ${color}99 0 2px, transparent 2px 4px)` },
      };
    case 'missed':
      return { className: 'bg-slate-200 dark:bg-slate-700' };
    case 'open':
      return { className: 'bg-slate-200/70 dark:bg-slate-800' };
    case 'off':
      return { className: 'bg-slate-100 dark:bg-slate-800/50' };
    case 'inactive':
      return { className: 'bg-slate-100/60 dark:bg-slate-900' };
  }
}

interface Props {
  data: HeatmapData;
  color: string;
  selected?: DateKey;
  onSelect?(date: DateKey): void;
}

export function Heatmap({ data, color, selected, onSelect }: Props) {
  const cols = data.weeks.length;
  return (
    <div>
      <div className="flex gap-1.5">
        {/* подписи дней недели: Пн, Ср, Пт */}
        <div className="grid shrink-0 grid-rows-[auto_repeat(7,1fr)] gap-[2px] text-[9px] leading-none text-slate-400">
          <span className="h-3" />
          {WEEKDAY_SHORT.map((d, i) => (
            <span key={d} className="flex items-center">{i % 2 === 0 ? d : ''}</span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative mb-[2px] h-3 text-[9px] leading-3 text-slate-400">
            {data.months.map((m) => (
              <span key={`${m.column}-${m.label}`} className="absolute" style={{ left: `${(m.column / cols) * 100}%` }}>
                {m.label}
              </span>
            ))}
          </div>
          <div
            className="grid grid-flow-col gap-[2px]"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: 'repeat(7, auto)' }}
            role="grid"
            aria-label="Тепловая карта выполнения"
          >
            {data.weeks.flatMap((week) =>
              week.map((cell) => {
                const { className, style } = cellStyle(cell.state, color);
                const isSelected = cell.date === selected;
                return (
                  <button
                    key={cell.date}
                    type="button"
                    role="gridcell"
                    aria-label={`${formatDayMonth(cell.date)}: ${STATE_LABEL[cell.state]}`}
                    title={`${formatDayMonth(cell.date)}: ${STATE_LABEL[cell.state]}`}
                    onClick={() => onSelect?.(cell.date)}
                    className={`aspect-square rounded-[3px] ${className} ${isSelected ? 'ring-2 ring-slate-900 ring-offset-1 dark:ring-white dark:ring-offset-slate-900' : ''}`}
                    style={style}
                  />
                );
              }),
            )}
          </div>
        </div>
      </div>
      <Legend color={color} />
    </div>
  );
}

function Legend({ color }: { color: string }) {
  const items: CellState[] = ['done', 'skipped', 'missed', 'off'];
  return (
    <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
      {items.map((s) => {
        const { className, style } = cellStyle(s, color);
        return (
          <li key={s} className="flex items-center gap-1">
            <span className={`inline-block size-3 rounded-[3px] ${className}`} style={style} />
            {STATE_LABEL[s]}
          </li>
        );
      })}
    </ul>
  );
}

export { STATE_LABEL };
