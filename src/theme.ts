import { useEffect } from 'react';
import type { ThemePreference } from './types';

const media = () => window.matchMedia('(prefers-color-scheme: dark)');

function apply(pref: ThemePreference) {
  const dark = pref === 'dark' || (pref === 'system' && media().matches);
  document.documentElement.classList.toggle('dark', dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#020617' : '#f8fafc');
}

/** Применяет тему и следит за системной, если выбрано «Как в системе». */
export function useTheme(pref: ThemePreference) {
  useEffect(() => {
    apply(pref);
    if (pref !== 'system') return;
    const mq = media();
    const onChange = () => apply('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [pref]);
}
