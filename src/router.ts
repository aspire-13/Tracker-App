import { useEffect, useState } from 'react';

export type Route =
  | { name: 'today' }
  | { name: 'habits' }
  | { name: 'habitNew' }
  | { name: 'habitEdit'; id: string }
  | { name: 'habitDetail'; id: string }
  | { name: 'stats' }
  | { name: 'settings' };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  switch (parts[0]) {
    case 'habits':
      if (parts[1] === 'new') return { name: 'habitNew' };
      if (parts[1] && parts[2] === 'edit') return { name: 'habitEdit', id: parts[1] };
      if (parts[1]) return { name: 'habitDetail', id: parts[1] };
      return { name: 'habits' };
    case 'stats':
      return { name: 'stats' };
    case 'settings':
      return { name: 'settings' };
    default:
      return { name: 'today' };
  }
}

export const paths = {
  today: '#/',
  habits: '#/habits',
  habitNew: '#/habits/new',
  habitDetail: (id: string) => `#/habits/${encodeURIComponent(id)}`,
  habitEdit: (id: string) => `#/habits/${encodeURIComponent(id)}/edit`,
  stats: '#/stats',
  settings: '#/settings',
};

export function navigate(path: string, { replace = false } = {}) {
  if (replace) window.location.replace(path);
  else window.location.hash = path;
}

// Сколько переходов было внутри приложения: если ноль, «назад» увёл бы с сайта.
let inAppDepth = 0;
if (typeof window !== 'undefined') window.addEventListener('hashchange', () => inAppDepth++);

/** Назад по истории, если переходы были внутри приложения, иначе — на запасной путь. */
export function goBack(fallback: string) {
  if (inAppDepth > 0) window.history.back();
  else navigate(fallback, { replace: true });
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
