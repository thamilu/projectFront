/**
 * Custom React Hooks
 * Reusable hooks for common functionality
 */

// ---------------------------------------------------------------------------
// Auth hooks — canonical implementation lives in domains/auth/hooks/use-auth.tsx.
// Imported directly from domains/, not the '@/features/auth' barrel — shared/
// must not depend on features/ (see the module's own module-boundary docs).
// ---------------------------------------------------------------------------
export { useAuth } from '@/domains/auth/hooks/use-auth';

export { useDebounce } from './use-debounce';
export { useMediaQuery } from './use-media-query';

export * from './use-mounted';
export * from './use-app-integrations';
export * from './useIsomorphicLayoutEffect';
export * from './use-reduced-motion';
export * from './use-body-scroll-lock';
export * from './use-focus-on-change';
export * from './use-merged-ref';
export * from './use-animation-config';
