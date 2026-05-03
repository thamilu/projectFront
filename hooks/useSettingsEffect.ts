'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settings-store';

export function useSettingsEffect() {
  const { theme, fontSize, accessibility } = useSettingsStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const applyTheme = () => {
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
      }
    };
    applyTheme();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') applyTheme();
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('reduce-motion', accessibility.reduceMotion);
    root.classList.toggle('high-contrast', accessibility.highContrast);
    root.classList.toggle('large-text', accessibility.largeText);
  }, [accessibility]);
}
