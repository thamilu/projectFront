/**
 * Font Configuration
 * 
 * Centralized font loading configuration with performance optimizations.
 * Uses Next.js font optimization for automatic subsetting and preloading.
 * 
 * @module lib/fonts
 */

import { Inter, JetBrains_Mono } from 'next/font/google';

/**
 * Primary sans-serif font (Inter)
 * 
 * Features:
 * - Variable font for optimal file size
 * - Display swap to prevent FOIT (Flash of Invisible Text)
 * - Preloaded for critical rendering path
 * - System fallbacks for progressive enhancement
 */
export const fontSans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  preload: true,
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
  adjustFontFallback: true,
});

/**
 * Monospace font (JetBrains Mono)
 * 
 * Used for code snippets, technical content, and monospaced layouts.
 * Not preloaded to prioritize primary font loading.
 */
export const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  preload: false,
  fallback: [
    'ui-monospace',
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'Courier New',
    'monospace',
  ],
  adjustFontFallback: true,
});

/**
 * Font class names for HTML element
 * 
 * Apply to html element to enable CSS variable usage:
 * 
 * @example
 * ```tsx
 * <html className={fontClassNames}>
 * ```
 */
export const fontClassNames = `${fontSans.variable} ${fontMono.variable}`;
