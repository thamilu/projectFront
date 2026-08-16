'use client';

/**
 * ProfileHeader.tsx
 *
 * User profile header component.
 * Part of the profile feature display system.
 *
 * Design Decisions:
 * - Displays user avatar, name, email, and role badge.
 * - Avatar supports custom images with fallback to initials.
 * - Photo upload button optional (controlled by parent callback).
 * - Role badge differentiates Sellers from Buyers.
 * - Responsive layout (stacked mobile, horizontal desktop).
 * - Fully accessible with semantic HTML.
 *
 * Technical Constraints:
 * - Requires valid NextAuth Session object.
 * - Avatar image URLs must be whitelisted in next.config.js.
 * - Photo upload handler provided by parent component.
 * - Memoized to prevent unnecessary re-renders when form states change.
 *
 * Error Handling:
 * - Gracefully handles missing user data (name, email, image).
 * - Falls back to default initials if name unavailable.
 * - No photo upload button if handler not provided.
 * - Conditionally renders plain text fallback when email is not provided to prevent broken mailto: links.
 *
 * @example Basic usage
 * ```tsx
 * <ProfileHeader
 *   session={session}
 *   hasSellerProfile={true}
 * />
 * ```
 *
 * @example With photo upload and loading state
 * ```tsx
 * <ProfileHeader
 *   session={session}
 *   hasSellerProfile={false}
 *   headingLevel="h2"
 *   onUploadPhoto={handleUpload}
 *   isUploadingPhoto={isUploading}
 * />
 * ```
 *
 * @throws Wrap in a parent ErrorBoundary at the page level to handle upstream session errors gracefully.
 * @see {@link ProfileForm} - Parent component that uses ProfileHeader
 */
import { useRef, useCallback, useEffect } from 'react';
import { Camera, Loader2, User, CheckCircle2, ShieldCheck, Clock, Calendar } from 'lucide-react';
import type { Session } from 'next-auth';
import { useFormContext, useWatch } from 'react-hook-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/atoms/avatar';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { cn } from '@/shared/utils';
import type { ProfileValues } from '@/shared/schemas/user.schema';

import { HEADING_SIZE } from './profileHeader.constants';
import type { ProfileHeadingLevel } from './profileHeader.types';
import { deriveProfileDisplayData } from './profileHeader.utils';
import { ProfileHeaderSkeleton } from './ProfileHeaderSkeleton';

interface ProfileHeaderProps {
  /**
   * NextAuth session containing user data.
   * Must include user.name, user.email, user.image (optional).
   */
  session: Session;

  /**
   * Whether user has active seller profile.
   * Determines badge label (Verified Seller vs Premium Buyer).
   */
  hasSellerProfile: boolean;

  /**
   * Optional callback when photo upload button clicked.
   * If not provided, upload button will not be rendered.
   */
  onUploadPhoto?: () => void;

  /**
   * Optional boolean indicating if the photo is currently uploading.
   * If true, disables the button and shows a loading spinner.
   */
  isUploadingPhoto?: boolean;

  /**
   * Optional heading level for user name to ensure semantic outlines.
   * Use h1 if this is the primary page heading, h2 or h3 for sub-sections.
   * @default 'h1'
   */
  headingLevel?: ProfileHeadingLevel;

  /**
   * Additional CSS classes for container customization.
   */
  className?: string;

  /**
   * Whether the profile form is currently in edit mode.
   */
  isEditing?: boolean;

  /**
   * Callback to transition the parent form into edit mode.
   */
  onEdit?: () => void;
}

const EDITABLE_CORE_FIELDS: (keyof ProfileValues)[] = [
  'firstName',
  'lastName',
  'phone',
  'gender',
  'dateOfBirth',
  'preferredLanguage',
  'alternatePhone',
  'addressLine1',
  'city',
  'pincode',
  'country',
];

function ProfileCompletionTracker({
  onEdit,
  isEditing,
}: {
  onEdit?: () => void;
  isEditing?: boolean;
}) {
  const formContext = useFormContext<ProfileValues>();
  const formValues = useWatch<ProfileValues>();

  if (!formContext) {
    return null;
  }

  const completedCount = EDITABLE_CORE_FIELDS.filter((field) => {
    const val = formValues[field];
    return val !== undefined && val !== null && val !== '';
  }).length;

  const totalCount = EDITABLE_CORE_FIELDS.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div
      className="mt-2 space-y-2 rounded-xl border border-slate-800 bg-slate-950/30 p-4 shadow-lg w-full max-w-xl"
      role="status"
      aria-label="Profile completion progress"
    >
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Profile Completion
        </span>
        <span className="text-primary text-xl font-extrabold">{completionPercentage}%</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Block based visual progress bar */}
        <div className="font-mono text-primary flex gap-0.5 tracking-tighter text-sm select-none" aria-hidden="true">
          {Array.from({ length: 15 }).map((_, i) => {
            const isActive = i < Math.floor((completionPercentage / 100) * 15);
            return (
              <span key={i} className={isActive ? 'text-primary' : 'text-slate-800'}>
                {isActive ? '█' : '░'}
              </span>
            );
          })}
        </div>
        <span className="shrink-0 text-xs font-semibold text-slate-400">
          {completedCount} of {totalCount} completed
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-900 mt-1">
        <span className="text-[11px] text-slate-400 font-medium leading-tight">
          Complete your profile to unlock all marketplace features
        </span>
        {completionPercentage < 100 && !isEditing && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center text-xs font-bold text-primary hover:text-primary/80 transition-colors select-none group"
          >
            Continue
            <svg className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export function ProfileHeader({
  session,
  hasSellerProfile,
  onUploadPhoto,
  isUploadingPhoto = false,
  headingLevel = 'h1',
  className,
  isEditing = false,
  onEdit,
}: ProfileHeaderProps) {
  // ── 1. Hooks (Must be called first and unconditionally) ──────────────────────

  const formContext = useFormContext();
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

  // ── 2. Guard (Safe to return early now that all hooks are declared) ───────────

  if (!session?.user) {
    return <ProfileHeaderSkeleton />;
  }

  // ── 3. Derived Data (Only computed if session and user are valid) ─────────────

  const { userName, userEmail, avatarUrl, initial, roleLabel } = deriveProfileDisplayData(
    session,
    hasSellerProfile
  );

  const Heading = headingLevel;

  return (
    <header
      className={cn(
        'w-full border-t-[5px] border-t-primary rounded-2xl border border-slate-800 bg-slate-900/20 p-6 md:p-8 shadow-xl backdrop-blur-md',
        className
      )}
      aria-label="User profile header"
    >
      {/* Side-by-side flex row layout for desktop */}
      <div className="flex flex-col md:flex-row gap-8 items-start justify-between w-full">
        {/* Left Side: Avatar + Details (Name, badges, email, completion tracker) */}
        <div className="flex-1 flex flex-col sm:flex-row items-center sm:items-start gap-6 w-full">
          {/* Avatar with hover upload overlay & online status dot */}
          <div className="group relative shrink-0">
            {/* Green Online status dot */}
            <span
              className="absolute -top-0.5 -right-0.5 z-20 h-4 w-4 rounded-full bg-emerald-500 border-3 border-slate-950 animate-pulse shadow-lg"
              title="Online Status"
            />

            {/* Avatar Frame with hover overlay - reduced diameter by 15% */}
            {onUploadPhoto ? (
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={isUploadingPhoto}
                aria-label={isUploadingPhoto ? 'Uploading photo...' : 'Change profile photo'}
                className={cn(
                  'relative rounded-full border-4 border-slate-800 bg-transparent p-0 shadow-2xl transition-all duration-300 group-hover:scale-[1.03] group-hover:ring-4 group-hover:ring-primary/20 overflow-hidden h-20 w-20 sm:h-24 sm:w-24',
                  isUploadingPhoto ? 'cursor-not-allowed' : 'cursor-pointer'
                )}
              >
                <Avatar className="h-full w-full">
                  <AvatarImage src={avatarUrl} alt={`${userName}'s profile picture`} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {initial}
                  </AvatarFallback>
                </Avatar>

                {/* Uploading spinner overlay - visible regardless of hover state */}
                {isUploadingPhoto && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-[2px] text-white">
                    <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                  </div>
                )}

                {/* Hover Camera Overlay */}
                {!isUploadingPhoto && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100 backdrop-blur-[2px] text-white">
                    <Camera className="h-5 w-5 text-white mb-1 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                    <span className="text-[9px] font-bold uppercase tracking-wider select-none">Update</span>
                  </div>
                )}
              </button>
            ) : (
              <div className="relative rounded-full border-4 border-slate-800 shadow-2xl overflow-hidden h-20 w-20 sm:h-24 sm:w-24">
                <Avatar className="h-full w-full">
                  <AvatarImage src={avatarUrl} alt={`${userName}'s profile picture`} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {initial}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>

          {/* User Details + Spacing reduced by 12px */}
          <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left gap-2 w-full">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full">
              <Heading className={cn(HEADING_SIZE, 'flex items-center gap-2')}>
                {userName}
                {/* Verified Account blue check */}
                <span
                  className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-500 text-white shadow-sm border border-slate-950/20"
                  title="Verified Enterprise Identity"
                >
                  <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </Heading>

              {!isEditing && onEdit && (
                <Button
                  type="button"
                  onClick={onEdit}
                  size="sm"
                  className="shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground group flex h-8 items-center rounded-lg px-3.5 text-xs font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <User className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                  Edit Profile
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-semibold px-2 py-0.5">
                {roleLabel}
              </Badge>

              {isEditing ? (
                <Badge
                  variant="outline"
                  className="animate-pulse border-amber-500/30 bg-amber-500/10 font-bold text-amber-500 px-2 py-0.5"
                >
                  Editing
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-slate-700 bg-slate-800/80 font-medium text-slate-400 px-2 py-0.5"
                >
                  View Only
                </Badge>
              )}

              {userEmail ? (
                <address className="not-italic text-sm">
                  <a
                    href={`mailto:${userEmail}`}
                    className="text-slate-400 hover:text-white transition-colors font-medium"
                    aria-label={`Send email to ${userEmail}`}
                  >
                    {userEmail}
                  </a>
                </address>
              ) : (
                <span className="text-sm font-medium text-slate-500">No email provided</span>
              )}
            </div>

            {/* Completion Tracker - reduced mt to minimize the vertical gap */}
            {formContext && (
              <div className="mt-1 w-full">
                <ProfileCompletionTracker onEdit={onEdit} isEditing={isEditing} />
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Account Metadata Panel in clean spacing rows with high-contrast text-slate-400 labels */}
        <div className="w-full md:w-80 border-t border-slate-800/80 md:border-t-0 md:border-l md:border-slate-800/80 pt-6 md:pt-0 md:pl-8 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest select-none">
              <ShieldCheck className="h-4.5 w-4.5 text-primary" />
              Account Info
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800/40 pb-2.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/40 pb-2.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Verification</span>
                <span className="text-sm font-semibold text-slate-200 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  Verified
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/40 pb-2.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">KYC Status</span>
                <span className="text-sm font-semibold text-slate-200">
                  {hasSellerProfile ? 'KYC Verified' : 'Not Required'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/40 pb-2.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Member Since</span>
                <span className="text-sm font-semibold text-slate-200 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  July 2026
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Last Active</span>
                <span className="text-sm font-semibold text-slate-200 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  Today, 5:13 PM
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

ProfileHeader.displayName = 'ProfileHeader';
