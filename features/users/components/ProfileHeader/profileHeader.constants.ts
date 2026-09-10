import { components } from '@/shared/types/generated/api';

/**
 * Default avatar size classes — must match ProfileHeader's actual rendered
 * avatar frame exactly (both the upload-button and plain-div variants),
 * and is also what ProfileHeaderSkeleton sizes its placeholder from, so
 * the two can't silently drift into two different avatar sizes.
 */
export const AVATAR_SIZE = 'h-16 w-16 sm:h-20 sm:w-20';

/**
 * Avatar border and shadow classes
 */
export const AVATAR_STYLING =
  'border-2 border-border/40 shadow-sm transition-transform duration-300';

/**
 * Heading size classes
 */
export const HEADING_SIZE = 'text-xl sm:text-2xl font-bold tracking-tight text-foreground';

/**
 * Default fallback initial when name unavailable
 */
export const DEFAULT_INITIAL = 'U';

/**
 * Canonical user role display labels.
 */
export const ROLE_LABELS = {
  SELLER: 'Seller',
  CUSTOMER: 'Customer',
} as const;

/** Raw seller approval status as returned by the backend (SellerProfileResponse.status). */
type RawSellerStatus = NonNullable<components['schemas']['SellerProfileResponse']['status']>;

/**
 * Human-readable labels for the backend's raw seller approval status.
 * A seller record existing (hasSellerProfile) is not the same as it being
 * KYC-approved; this maps the real status instead of assuming "verified".
 *
 * Kept as `Record<string, string>` (not the narrow RawSellerStatus union)
 * because ProfileHeader's getKycStatusLabel() looks this up by a loose
 * string and falls back to the raw status text for anything not listed
 * here — deliberately tolerant of a status value the frontend doesn't
 * recognize yet, rather than erroring. The `satisfies` check below still
 * fails the build if the backend's status union gains/loses a member
 * without this map being updated to match.
 */
export const SELLER_STATUS_LABELS = {
  ACTIVE: 'KYC Verified',
  PENDING: 'KYC Pending Review',
  UNDER_REVIEW: 'Under Review',
  NEEDS_MORE_INFO: 'Action Required',
  REJECTED: 'Application Rejected',
  SUSPENDED: 'Suspended',
  INACTIVE: 'Inactive',
  ON_HOLD: 'On Hold',
} satisfies Record<RawSellerStatus, string> as Record<string, string>;

/** Fallback label when a seller profile exists but its status wasn't returned by the fetch. */
export const SELLER_STATUS_UNKNOWN_LABEL = 'Pending Review';
