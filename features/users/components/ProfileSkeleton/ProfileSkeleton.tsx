'use client';

/**
 * ProfileSkeleton.tsx
 *
 * Loading placeholder that mirrors ProfileHeader and ProfileForm layouts to prevent CLS.
 * Sourced from shared layout design tokens.
 */

import { memo } from 'react';
import { Skeleton, SkeletonAvatar } from '@/shared/ui/atoms/skeleton';
import { cn } from '@/shared/utils';

import type { SkeletonVariant } from './profileSkeleton.types';
import { ARIA_LABELS, SKELETON_DIMS, CONTAINER_CLASSES, CARD_CLASSES } from './profileSkeleton.constants';

export interface ProfileSkeletonProps {
  /**
   * Controls which skeleton layout variant to render.
   * @default 'full'
   */
  variant?: SkeletonVariant;

  /** Additional CSS classes for container customisation. */
  className?: string;
}

/**
 * Full skeleton: avatar + name + badge + email + tabs + card.
 * Maps to: ProfileHeader(avatar, h2, Badge, email) + TabBar + ProfileForm card body.
 */
const FullSkeletonBody = memo(function FullSkeletonBody() {
  return (
    <>
      <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <Skeleton rounded="full" className={SKELETON_DIMS.avatarFull} />
          <div className="space-y-2 flex-1 w-full">
            <Skeleton className={cn(SKELETON_DIMS.heading, 'rounded')} />
            <div className="flex items-center gap-2">
              <Skeleton rounded="full" className={SKELETON_DIMS.badge} />
              <Skeleton className={cn(SKELETON_DIMS.email, 'rounded')} />
            </div>
            <Skeleton className="h-9 w-full max-w-xl rounded-lg mt-2" />
          </div>
        </div>
      </div>

      <Skeleton className={cn(SKELETON_DIMS.tabBar, 'rounded-xl')} />
      <Skeleton className={cn(SKELETON_DIMS.cardBody, 'rounded-xl')} />
    </>
  );
});

/**
 * Compact skeleton: small avatar + name + badge.
 */
const CompactSkeletonBody = memo(function CompactSkeletonBody() {
  return (
    <div className="flex items-center gap-4">
      <SkeletonAvatar size="lg" />
      <div className="space-y-2">
        <Skeleton className={cn(SKELETON_DIMS.heading, 'rounded')} />
        <Skeleton className={cn(SKELETON_DIMS.badge, 'rounded')} />
      </div>
    </div>
  );
});

const SkeletonField = memo(function SkeletonField({
  labelWidth = 'w-20',
}: {
  labelWidth?: string;
}) {
  return (
    <div className="space-y-2">
      <Skeleton className={cn('h-4 rounded opacity-80', labelWidth)} />
      <Skeleton className="h-11 w-full rounded-md" />
    </div>
  );
});

// Section count matches Personal tab (Identity, Contact, Demographics)
const PERSONAL_SECTION_COUNT = 3;

const PersonalSkeletonBody = memo(function PersonalSkeletonBody() {
  return (
    <div className="space-y-6">
      {Array.from({ length: PERSONAL_SECTION_COUNT }, (_, i) => (
        <div key={i} className={cn(CARD_CLASSES, 'space-y-4 p-5 sm:p-6')}>
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-3 w-64 rounded opacity-60" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 pt-2">
            <SkeletonField />
            <SkeletonField />
          </div>
        </div>
      ))}
    </div>
  );
});

const AddressSkeletonBody = memo(function AddressSkeletonBody() {
  return (
    <div className={cn(CARD_CLASSES, 'space-y-6 p-5 sm:p-6')}>
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-48 rounded" />
        <Skeleton className="h-3 w-80 rounded opacity-60" />
      </div>
      <div className="space-y-4 pt-2">
        <SkeletonField labelWidth="w-24" />
        <SkeletonField labelWidth="w-24" />
        <div className="grid gap-6 md:grid-cols-2">
          <SkeletonField labelWidth="w-24" />
          <SkeletonField labelWidth="w-24" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <SkeletonField labelWidth="w-24" />
          <SkeletonField labelWidth="w-24" />
        </div>
      </div>
    </div>
  );
});

export const ProfileSkeleton = memo(function ProfileSkeleton({
  variant = 'full',
  className,
}: ProfileSkeletonProps) {
  const renderBody = () => {
    switch (variant) {
      case 'compact':
        return <CompactSkeletonBody />;
      case 'personal':
        return <PersonalSkeletonBody />;
      case 'address':
        return <AddressSkeletonBody />;
      case 'full':
        return <FullSkeletonBody />;
      default: {
        const _exhaustiveCheck: never = variant;
        return _exhaustiveCheck;
      }
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-atomic="true"
      aria-label={ARIA_LABELS[variant]}
      className={cn(CONTAINER_CLASSES[variant], className)}
    >
      {renderBody()}
    </div>
  );
});

ProfileSkeleton.displayName = 'ProfileSkeleton';
