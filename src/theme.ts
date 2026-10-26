import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'green-chat:theme';
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
const listeners = new Set<() => void>();

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function applyTheme() {
  document.documentElement.dataset.theme = storedTheme() ?? (systemDark.matches ? 'dark' : 'light');
  listeners.forEach((listener) => listener());
}

export function initTheme() {
  applyTheme();
  systemDark.addEventListener('change', applyTheme);
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
  applyTheme();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getTheme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light') as Theme;

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme);
  return { theme, toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark') };
}
