/**
 * @module features/users
 * @version 1.0.0
 *
 * Public API for the Users feature module.
 *
 * Explicitly exports only public-facing components, functions, constants, and types.
 * Internal implementation details remain private to prevent accidental coupling and
 * ensure optimal tree-shaking and compilation performance.
 *
 * @example Basic usage of profile form
 * ```tsx
 * import { ProfileForm, ProfileErrorBoundary } from '@/features/users';
 *
 * export default function Page() {
 *   return (
 *     <ProfileErrorBoundary>
 *       <ProfileForm />
 *     </ProfileErrorBoundary>
 *   );
 * }
 * ```
 *
 * @example Using profile form with type-safe data handling
 * ```tsx
 * import { ProfileForm, type ProfileValues } from '@/features/users';
 *
 * function MyComponent() {
 *   const handleSubmit = (data: ProfileValues) => {
 *     console.log('Form data:', data);
 *   };
 *
 *   return <ProfileForm onSubmit={handleSubmit} />;
 * }
 * ```
 *
 */

// ─── Components ───────────────────────────────────────────────────────────────

/**
 * Main profile management form component
 * Handles personal info, address, and security settings
 *
 * @public
 */
export { ProfileForm } from './components/ProfileForm';

/**
 * User profile header component displaying user name, email, avatar, and role.
 *
 * @public
 */
export { ProfileHeader, ProfileHeaderSkeleton } from './components/ProfileHeader';

/**
 * Profile loading skeleton component mirroring the structural layout of ProfileForm.
 *
 * @public
 */
export { ProfileSkeleton } from './components/ProfileSkeleton';
export type { ProfileSkeletonProps, SkeletonVariant } from './components/ProfileSkeleton';

/**
 * Error boundary wrapper for profile feature
 * Provides graceful error handling and recovery UI
 *
 * @public
 */
export { ErrorBoundary as ProfileErrorBoundary } from '@/shared/ui/feedback/error-boundary';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Re-export public types for type-safe consumption
 */

/**
 * Profile form values schema
 * Used for form data validation and type checking
 */
export type { ProfileValues } from '@/shared/schemas/user.schema';

/**
 * Shared action handlers passed to child components
 */
export type { SharedActions } from './types/profile.types';

/**
 * Profile tab identifier type
 */
export type { ProfileTab } from './utils/profile.constants';

/**
 * User role type
 */
export type { UserRole } from './utils/profile.constants';

/**
 * Gender enum type
 */
export type { Gender } from './utils/profile.constants';

// ─── Type Guards & Helpers ────────────────────────────────────────────────────

/**
 * Type guard to check if value is valid ProfileTab
 */
export { isProfileTab } from './utils/profile.constants';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Profile tab identifiers
 * Used for tab navigation and routing
 */
export { PROFILE_TABS } from './utils/profile.constants';

/**
 * User role constants
 * Matches backend role enum values
 */
export { ROLES } from './utils/profile.constants';

/**
 * Gender option constants matching backend Gender.java enum values
 */
export { GENDERS } from './utils/profile.constants';

/**
 * Gender select options for forms
 * Pre-formatted for dropdown/select components
 */
export { GENDER_OPTIONS } from './utils/profile.constants';

// ─── Internal Implementation Details (Private) ────────────────────────────────

/**
 * The following are NOT exported (private to module):
 *
 * Hooks:
 * - useTabNavigation - Tab state and navigation logic
 * - useProfileData - Profile data fetching and caching
 * - useProfileSubmit - Form submission handling
 * - useEditState - Edit mode state management
 *
 * Components:
 * - ProfileHeader - Internal header component
 * - TabContent - Tab content router component
 * - ProfileSkeleton - Loading skeleton UI
 * - AuthGate - Authentication gate component
 *
 * Utilities:
 * - extractRoles - Role extraction from session
 * - hasSellerRole - Role checking helper
 * - getTabIndex - Tab index calculation (O(1))
 * - getNextTab - Tab navigation helper
 * - getPreviousTab - Tab navigation helper
 *
 * Constants:
 * - PROFILE_DEFAULTS - Form default values (internal use)
 * - TAB_ORDER - Tab ordering array (internal use)
 * - TAB_CONFIG - Tab configuration array (internal use)
 */
