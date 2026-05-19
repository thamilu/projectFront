/**
 * Enterprise Design Tokens: Typography
 */
export const typography = {
  fonts: {
    sans: 'var(--font-sans), Inter, sans-serif',
    mono: 'var(--font-mono), monospace',
  },
  fontSizes: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    xxl: '1.5rem',     // 24px
    h3: '1.875rem',    // 30px
    h2: '2.25rem',     // 36px
    h1: '3rem',        // 48px
  },
  fontWeights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeights: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
} as const;
