/**
 * TabContent public API.
 *
 * Exports the TabContent component and its associated types.
 * This barrel defines the public surface of the TabContent component.
 *
 * @module TabContent
 *
 * @example
 * ```tsx
 * import { TabContent } from '@/features/users/components/TabContent';
 * import type { TabContentProps } from '@/features/users/components/TabContent';
 * ```
 *
 * @remarks
 * Import only from this barrel — never import internal files directly.
 * Internal configurations and constants are not part of the public API.
 */

// ─── Component ──────────────────────────────────────────────────
export { TabContent } from './TabContent';

// ─── Types ──────────────────────────────────────────────────────
export type { TabContentProps } from './TabContent';
