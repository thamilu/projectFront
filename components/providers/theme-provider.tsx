/**
 * Theme Provider
 * 
 * Wrapper around next-themes for dark mode support.
 * Provides theme switching with no flash on page load.
 * 
 * @module components/providers/theme-provider
 */

'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';

/**
 * Theme Provider Component
 * 
 * Features:
 * - System theme detection
 * - Persistent theme preference
 * - No flash on page load
 * - Smooth transitions
 * 
 * @example
 * ```tsx
 * <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
 *   {children}
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ children, ...props }: React.PropsWithChildren<ThemeProviderProps>) {
  return <NextThemesProvider {...(props as ThemeProviderProps)}>{children}</NextThemesProvider>;
}
