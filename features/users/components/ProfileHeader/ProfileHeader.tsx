'use client';

/**
 * ProfileHeader.tsx
 *
 * User profile header component adhering to Ultra-Enterprise Design System.
 * Displays user identity, role badge, verified contact status, and compact profile progress.
 */
import React, { useRef, useCallback, useEffect } from 'react';
import {
  Camera,
  Loader2,
  User,
  Check,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { Session } from 'next-auth';
import { useFormContext, useWatch } from 'react-hook-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/atoms/avatar';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Progress } from '@/shared/ui/atoms/progress';
import { cn } from '@/shared/utils';
import { formatDate } from '@/shared/utils/formatters';
import type { ProfileValues } from '@/shared/schemas/user.schema';
import type { AccountMeta } from '@/features/users/utils/profile-normalizer';

import {
  AVATAR_SIZE,
  HEADING_SIZE,
  SELLER_STATUS_LABELS,
  SELLER_STATUS_UNKNOWN_LABEL,
} from './profileHeader.constants';
import type { ProfileHeadingLevel } from './profileHeader.types';
import { deriveProfileDisplayData } from './profileHeader.utils';
import { ProfileHeaderSkeleton } from './ProfileHeaderSkeleton';

/** "KYC Status" label derived from real backend seller status */
function getKycStatusLabel(hasSellerProfile: boolean, sellerStatus?: string): string {
  if (!hasSellerProfile) return 'Not Required';
  if (!sellerStatus) return SELLER_STATUS_UNKNOWN_LABEL;
  return SELLER_STATUS_LABELS[sellerStatus] ?? sellerStatus;
}

export interface ProfileHeaderProps {
  session: Session;
  hasSellerProfile: boolean;
  accountMeta?: AccountMeta | null;
  onUploadPhoto?: () => void;
  isUploadingPhoto?: boolean;
  headingLevel?: ProfileHeadingLevel;
  className?: string;
  isEditing?: boolean;
  onEdit?: () => void;
}

/**
 * Fields that contribute to personal profile completeness.
 */
const PROFILE_COMPLETION_FIELDS: (keyof ProfileValues)[] = [
  'firstName',
  'lastName',
  'phone',
  'dateOfBirth',
];

function ProfileCompletionTrackerInner({
  onEdit,
  isEditing,
}: {
  onEdit?: () => void;
  isEditing?: boolean;
}) {
  const watchedValues = useWatch<ProfileValues>({ name: PROFILE_COMPLETION_FIELDS });

  const completedCount = watchedValues.filter(
    (val) => val !== undefined && val !== null && val !== ''
  ).length;

  const totalCount = PROFILE_COMPLETION_FIELDS.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);
  const remainingCount = totalCount - completedCount;

  if (completionPercentage === 100) {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
        <Sparkles className="h-3.5 w-3.5" />
        <span>Profile 100% complete</span>
      </div>
    );
  }

  return (
    <div
      className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3.5 py-2.5 max-w-xl"
      role="region"
      aria-label="Profile completion status"
    >
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-muted-foreground">Profile Completion</span>
          <span className="text-foreground font-semibold">{completionPercentage}%</span>
        </div>
        <Progress value={completionPercentage} className="h-1.5 w-full bg-muted" />
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-1 sm:pt-0 border-t border-border/40 sm:border-t-0">
        <span className="text-[11px] text-muted-foreground font-medium">
          {remainingCount} {remainingCount === 1 ? 'detail' : 'details'} remaining
        </span>
        {!isEditing && onEdit && (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={onEdit}
            className="h-auto p-0 text-xs font-semibold text-primary hover:text-primary/80 group"
          >
            Complete profile
            <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

function ProfileCompletionTracker(props: { onEdit?: () => void; isEditing?: boolean }) {
  const formContext = useFormContext<ProfileValues>();
  if (!formContext) {
    return null;
  }
  return <ProfileCompletionTrackerInner {...props} />;
}

export function ProfileHeader({
  session,
  hasSellerProfile,
  accountMeta,
  onUploadPhoto,
  isUploadingPhoto = false,
  headingLevel = 'h2',
  className,
  isEditing = false,
  onEdit,
}: ProfileHeaderProps) {
  const isSubmittingRef = useRef(false);

  const handleUploadClick = useCallback(() => {
    if (isSubmittingRef.current || isUploadingPhoto) return;
    isSubmittingRef.current = true;
    onUploadPhoto?.();
  }, [onUploadPhoto, isUploadingPhoto]);

  useEffect(() => {
    if (!isUploadingPhoto) {
      isSubmittingRef.current = false;
    }
  }, [isUploadingPhoto]);

  if (!session?.user) {
    return <ProfileHeaderSkeleton />;
  }

  const { userName, userEmail, avatarUrl, initial, roleLabel } = deriveProfileDisplayData(
    session,
    hasSellerProfile
  );

  const Heading = headingLevel;

  return (
    <header
      className={cn(
        'w-full rounded-xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs',
        className
      )}
      aria-label="User profile header"
    >
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start justify-between w-full">
        {/* Left Side: Avatar + Details */}
        <div className="flex-1 flex flex-col sm:flex-row items-center sm:items-start gap-5 w-full">
          {/* Avatar with photo upload overlay */}
          <div className="group relative shrink-0">
            {onUploadPhoto ? (
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={isUploadingPhoto}
                aria-label={isUploadingPhoto ? 'Uploading photo...' : 'Change profile photo'}
                className={cn(
                  'relative rounded-full border-2 border-border/40 bg-muted p-0 shadow-xs transition-all duration-200 group-hover:ring-2 group-hover:ring-primary/30 overflow-hidden',
                  AVATAR_SIZE,
                  isUploadingPhoto ? 'cursor-not-allowed' : 'cursor-pointer'
                )}
              >
                <Avatar className="h-full w-full">
                  <AvatarImage src={avatarUrl} alt={`${userName}'s profile picture`} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl sm:text-2xl font-bold">
                    {initial}
                  </AvatarFallback>
                </Avatar>

                {/* Uploading spinner overlay */}
                {isUploadingPhoto && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-2xs text-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  </div>
                )}

                {/* Hover Camera Overlay */}
                {!isUploadingPhoto && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/70 opacity-0 transition-opacity duration-200 group-hover:opacity-100 backdrop-blur-2xs text-foreground">
                    <Camera className="h-4 w-4 mb-0.5" aria-hidden="true" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Update</span>
                  </div>
                )}
              </button>
            ) : (
              <div
                className={cn(
                  'relative rounded-full border-2 border-border/40 bg-muted shadow-xs overflow-hidden',
                  AVATAR_SIZE
                )}
              >
                <Avatar className="h-full w-full">
                  <AvatarImage src={avatarUrl} alt={`${userName}'s profile picture`} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl sm:text-2xl font-bold">
                    {initial}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>

          {/* User Details */}
          <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left gap-1.5 w-full min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 w-full">
              <Heading className={cn(HEADING_SIZE, 'flex items-center gap-2')}>
                <span className="truncate">{userName}</span>
                {accountMeta?.emailVerified === true && (
                  <span
                    className="inline-flex items-center justify-center h-4.5 w-4.5 rounded-full bg-emerald-500 text-white shrink-0 shadow-2xs"
                    aria-label="Verified account"
                    title="Verified account"
                  >
                    <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                  </span>
                )}
              </Heading>

              {!isEditing && onEdit && (
                <Button
                  type="button"
                  onClick={onEdit}
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs font-semibold shadow-2xs ml-auto"
                >
                  <User className="h-3.5 w-3.5" />
                  Edit Profile
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
              <Badge variant="secondary" className="font-semibold text-[11px] px-2 py-0.5">
                {roleLabel}
              </Badge>

              {userEmail && (
                <span className="text-xs text-muted-foreground truncate">
                  {userEmail}
                </span>
              )}
            </div>

            {/* Completion Tracker */}
            <div className="w-full pt-1">
              <ProfileCompletionTracker onEdit={onEdit} isEditing={isEditing} />
            </div>
          </div>
        </div>

        {/* Right Side: Account Metadata Panel */}
        <div className="w-full lg:w-72 border-t border-border/60 lg:border-t-0 lg:border-l lg:border-border/60 pt-4 lg:pt-0 lg:pl-6 shrink-0">
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Account Status
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground font-medium">Status</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground font-medium">Email Verification</span>
                {accountMeta === null || accountMeta === undefined ? (
                  <span className="text-muted-foreground font-medium">Checking…</span>
                ) : accountMeta.emailVerified ? (
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    Verified
                  </span>
                ) : (
                  <span className="font-medium text-amber-600 dark:text-amber-400">Not Verified</span>
                )}
              </div>

              {/* KYC Status only shown for Seller profiles */}
              {hasSellerProfile && (
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground font-medium">KYC Status</span>
                  <span className="font-semibold text-foreground">
                    {getKycStatusLabel(hasSellerProfile, accountMeta?.sellerStatus)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Member Since</span>
                {accountMeta?.createdAt ? (
                  <span className="font-medium text-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    {formatDate(accountMeta.createdAt, { year: 'numeric', month: 'long' })}
                  </span>
                ) : (
                  <span className="text-muted-foreground font-medium">—</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

ProfileHeader.displayName = 'ProfileHeader';
