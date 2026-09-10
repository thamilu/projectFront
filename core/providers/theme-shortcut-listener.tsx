'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';

const THEME_CYCLE_ORDER = ['system', 'light', 'dark'] as const;

/**
 * GlobalThemeShortcutListener
 *
 * Listens for application-wide theme shortcut (Ctrl+Shift+L) and cycles
 * seamlessly between System, Light, and Dark modes.
 *
 * Safety features:
 * - Safely ignores keystrokes when focused inside form inputs (<input>, <textarea>, <select>, contenteditable).
 * - Cycles in deterministic order: System -> Light -> Dark -> System.
 * - Single source of truth: directly triggers next-themes setTheme().
 */
export function ThemeShortcutListener(): null {
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'L') {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          'tagName' in target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable ||
            (typeof target.getAttribute === 'function' &&
              (target.getAttribute('contenteditable') === 'true' ||
                target.getAttribute('contenteditable') === '')) ||
            (typeof target.closest === 'function' &&
              Boolean(target.closest('[contenteditable="true"], [contenteditable=""]'))))
        ) {
          return;
        }

        e.preventDefault();
        const currentTheme = theme || 'system';
        const currentIndex = THEME_CYCLE_ORDER.indexOf(
          currentTheme as (typeof THEME_CYCLE_ORDER)[number]
        );
        const validIndex = currentIndex >= 0 ? currentIndex : 0;
        const nextTheme = THEME_CYCLE_ORDER[(validIndex + 1) % THEME_CYCLE_ORDER.length];

        setTheme(nextTheme);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [theme, setTheme]);

  return null;
}
