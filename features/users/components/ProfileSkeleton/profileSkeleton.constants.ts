/**
 * profileSkeleton.constants.ts
 *
 * Constants used by ProfileSkeleton.
 * Matches design system layout tokens.
 */

import type { SkeletonVariant } from './profileSkeleton.types';

export const ARIA_LABELS = {
  full: 'Loading your profile',
  compact: 'Loading section data',
  personal: 'Loading personal details',
  address: 'Loading address details',
} as const satisfies Record<SkeletonVariant, string>;

export const SKELETON_DIMS = {
  avatarFull: 'h-16 w-16 sm:h-20 sm:w-20',
  avatarCompact: 'h-12 w-12',
  heading: 'h-7 w-48',
  badge: 'h-5 w-20',
  email: 'h-4 w-36',
  tabBar: 'h-12 w-full',
  cardBody: 'min-h-[300px] md:min-h-[360px] w-full',
} as const;

export const CONTAINER_CLASSES = {
  full: 'mx-auto max-w-4xl space-y-6 pb-16',
  compact: 'w-full space-y-4 p-4',
  personal: 'w-full space-y-6',
  address: 'w-full space-y-4',
} as const satisfies Record<SkeletonVariant, string>;

export const CARD_CLASSES = 'rounded-xl border border-border/60 bg-muted/20';
