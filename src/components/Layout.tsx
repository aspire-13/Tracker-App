import type { ReactNode } from 'react';
import type { Route } from '../router';
import { paths } from '../router';
import { ChartIcon, ListIcon, SettingsIcon, TodayIcon } from './icons';

const tabs = [
  { href: paths.today, label: 'Сегодня', Icon: TodayIcon, match: ['today'] },
  { href: paths.habits, label: 'Привычки', Icon: ListIcon, match: ['habits', 'habitNew', 'habitEdit', 'habitDetail'] },
  { href: paths.stats, label: 'Статистика', Icon: ChartIcon, match: ['stats'] },
  { href: paths.settings, label: 'Настройки', Icon: SettingsIcon, match: ['settings'] },
];

export function Layout({ route, children }: { route: Route; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <main className="flex-1 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">{children}</main>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/90"
        aria-label="Основная навигация"
      >
        <ul className="mx-auto grid max-w-2xl grid-cols-4">
          {tabs.map(({ href, label, Icon, match }) => {
            const active = match.includes(route.name);
            return (
              <li key={href}>
                <a
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  <Icon width={22} height={22} />
                  {label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function PageHeader({ title, subtitle, left, right }: { title: string; subtitle?: string; left?: ReactNode; right?: ReactNode }) {
  return (
    <header className="mb-4 flex min-h-12 items-center gap-2">
      {left}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="truncate text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800 ${className}`}>{children}</section>;
}

export function EmptyState({ emoji, title, text, action }: { emoji: string; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-2 py-10 text-center">
      <div className="mb-3 text-5xl" aria-hidden>{emoji}</div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export const buttonPrimary =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50';
export const buttonSecondary =
  'inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 font-semibold text-slate-800 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700';
export const iconButton =
  'grid size-11 shrink-0 place-items-center rounded-full text-slate-600 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800';
