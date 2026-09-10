/**
 * warnOnce — Design-system development console warnings.
 *
 * - NO-OP in production (tree-shaken by bundler via NODE_ENV check)
 * - Each unique key outputs exactly once per session
 * - Prefixes all messages with [Design System] for grep-ability
 */
const warned = new Set<string>();

export function warnOnce(key: string, level: 'warn' | 'error', message: string): void {
  if (process.env.NODE_ENV === 'production') return;
  if (warned.has(key)) return;
  warned.add(key);
  const prefix = '[Design System]';
  if (level === 'error') {
    console.error(`${prefix} ${message}`);
  } else {
    console.warn(`${prefix} ${message}`);
  }
}
