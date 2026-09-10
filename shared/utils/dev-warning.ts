/**
 * Deduplicated dev warning registry — prevents console flooding on re-renders.
 *
 * Re-exports the canonical implementation from shared/ui/utils/warn-once.ts
 * (previously a separate, near-identical copy) so there is one shared
 * "warned" key registry and one behavior instead of two implementations
 * silently drifting apart.
 */
export { warnOnce } from '@/shared/ui/utils/warn-once';
