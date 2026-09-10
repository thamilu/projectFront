'use client';

/**
 * ProfileForm.tsx
 *
 * Ultra-Enterprise Profile Form Orchestrator
 * Features:
 *   - 2-Tab WAI-ARIA 1.2 in-page tab switching (Personal Information, Addresses)
 *   - Unsaved changes confirmation modal
 *   - Pessimistic mutation lifecycle with polite status alerts
 *   - Full keyboard accessibility and focus management
 */

import React, { useCallback, useMemo, useTransition, useState, useEffect, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import dynamic from 'next/dynamic';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/atoms/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/shared/ui/atoms/alert';
import { Button } from '@/shared/ui/atoms/button';
import { cn } from '@/shared/utils';
import { profileSchema, type ProfileValues } from '@/shared/schemas/user.schema';
import {
  PROFILE_DEFAULTS,
  ROLES,
  TAB_CONFIG,
  getNextTab,
  getTabLabel,
  type ProfileTab,
  isProfileTab,
} from '@/features/users/utils/profile.constants';
import { useTabNavigation } from '@/features/users/hooks/useTabNavigation';
import { useProfileData } from '@/features/users/hooks/useProfileData';
import { useProfileSubmit } from '@/features/users/hooks/useProfileSubmit';
import { useEditState } from '@/features/users/hooks/useEditState';
import { isCircuitBreakerError } from '@/features/users/api/profile-api';
import { extractRoles } from '@/shared/utils';
import { ProfileHeader } from '@/features/users/components/ProfileHeader';
import { ProfileSkeleton } from '@/features/users/components/ProfileSkeleton';
import { AuthGate } from '@/features/users/components/AuthGate';
import { ErrorBoundary } from '@/shared/ui/feedback/error-boundary';
import { UnsavedChangesModal } from '@/features/users/components/modals/UnsavedChangesModal';
import type { SharedActions } from '@/features/users/types/profile.types';

const TabContent = dynamic(
  () => import('@/features/users/components/TabContent').then((m) => m.TabContent),
  {
    loading: () => <ProfileSkeleton variant="personal" />,
  }
);

const hasSellerRole = (session: Session | null): boolean => {
  if (!session) return false;
  return extractRoles(session).includes(ROLES.SELLER);
};

export interface ProfileFormProps {
  userId?: string;
}

function ProfileFormInner({ userId }: ProfileFormProps) {
  const { data: session, status, update: updateSession } = useSession();
  const [isPending, startTransition] = useTransition();
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | undefined>(undefined);

  // Unsaved changes modal state
  const [pendingTabChange, setPendingTabChange] = useState<ProfileTab | null>(null);
  const [unsavedModalOpen, setUnsavedModalOpen] = useState(false);

  const successBannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSuccessBannerTimer = useCallback(() => {
    if (successBannerTimerRef.current) {
      clearTimeout(successBannerTimerRef.current);
      successBannerTimerRef.current = null;
    }
  }, []);

  const hideSuccessBanner = useCallback(() => {
    clearSuccessBannerTimer();
    setShowSuccessBanner(false);
  }, [clearSuccessBannerTimer]);

  useEffect(() => clearSuccessBannerTimer, [clearSuccessBannerTimer]);

  // ── Form Setup ────────────────────────────────────────────────────────────
  const methods = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onTouched',
    defaultValues: PROFILE_DEFAULTS,
  });

  const {
    handleSubmit,
    formState: { isDirty, dirtyFields },
    reset,
    getValues,
  } = methods;

  const isSellerRole = useMemo(() => hasSellerRole(session), [session]);

  // ── Domain Hooks ──────────────────────────────────────────────────────────
  const { activeTab, setTab, goNext, goBack } = useTabNavigation();

  const {
    isLoading,
    hasSellerProfile,
    error: dataError,
    hasLoadedOnce,
    accountMeta,
  } = useProfileData(reset, {
    userId: userId || session?.user?.id,
    isSellerRole,
  });

  const {
    isEditing,
    handleEdit: rawHandleEdit,
    handleCancel: rawHandleCancel,
    handleReset: rawHandleReset,
    closeEdit,
  } = useEditState(isDirty, reset);

  const handleEdit = useCallback(() => {
    hideSuccessBanner();
    rawHandleEdit();
  }, [hideSuccessBanner, rawHandleEdit]);

  const handleCancel = useCallback(() => {
    hideSuccessBanner();
    rawHandleCancel();
  }, [hideSuccessBanner, rawHandleCancel]);

  const handleReset = useCallback(() => {
    hideSuccessBanner();
    rawHandleReset();
  }, [hideSuccessBanner, rawHandleReset]);

  const {
    isSubmitting,
    submit,
    error: submitError,
  } = useProfileSubmit({
    hasSellerProfile,
    reset,
    onSuccess: async () => {
      closeEdit();
      clearSuccessBannerTimer();
      setShowSuccessBanner(true);
      const currentTime = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastSavedTime(currentTime);

      // Single-source cache sync: update session identity
      const values = getValues();
      if (values.firstName || values.lastName) {
        try {
          await updateSession?.({
            name: `${values.firstName || ''} ${values.lastName || ''}`.trim(),
          });
        } catch {
          // Session update is supplementary; silent catch
        }
      }

      successBannerTimerRef.current = setTimeout(() => {
        successBannerTimerRef.current = null;
        setShowSuccessBanner(false);
      }, 6000);
    },
  });

  // ── Tab Navigation with Dirty Guard ───────────────────────────────────────
  const handleTabChange = useCallback(
    (value: string): void => {
      hideSuccessBanner();
      if (!isProfileTab(value)) return;

      if (isDirty) {
        setPendingTabChange(value as ProfileTab);
        setUnsavedModalOpen(true);
        return;
      }

      startTransition(() => setTab(value as ProfileTab));
    },
    [hideSuccessBanner, isDirty, setTab]
  );

  const handleConfirmDiscard = useCallback(() => {
    setUnsavedModalOpen(false);
    reset(); // Discard dirty changes
    if (pendingTabChange) {
      startTransition(() => setTab(pendingTabChange));
      setPendingTabChange(null);
    }
  }, [pendingTabChange, reset, setTab]);

  const handleKeepEditing = useCallback(() => {
    setUnsavedModalOpen(false);
    setPendingTabChange(null);
  }, []);

  // ── Event Handlers ────────────────────────────────────────────────────────
  const handleFormSubmit = useCallback(
    async (data: ProfileValues): Promise<void> => {
      await submit(data, dirtyFields);
    },
    [submit, dirtyFields]
  );

  const onSubmit = useMemo(
    () => handleSubmit(handleFormSubmit),
    [handleSubmit, handleFormSubmit]
  );

  const nextTab = getNextTab(activeTab);
  const nextTabLabel = nextTab ? getTabLabel(nextTab) : undefined;

  const sharedActions = useMemo<SharedActions>(
    () => ({
      isEditing,
      isDirty,
      isSubmitting,
      onEdit: handleEdit,
      onCancel: handleCancel,
      onReset: handleReset,
      onSave: onSubmit,
      onNext: goNext,
      onBack: goBack,
      lastSavedTime,
      nextTabLabel,
    }),
    [
      isEditing,
      isDirty,
      isSubmitting,
      handleEdit,
      handleCancel,
      handleReset,
      onSubmit,
      goNext,
      goBack,
      lastSavedTime,
      nextTabLabel,
    ]
  );

  // ── Page State Machine ────────────────────────────────────────────────────
  const isAuthenticating = status === 'loading';
  const isLoadingData = status === 'authenticated' && isLoading;
  const isUnauthenticated = status === 'unauthenticated';
  const hasNoSession = !session?.user;

  const pageState =
    isAuthenticating || isLoadingData
      ? 'loading'
      : isUnauthenticated || hasNoSession
        ? 'unauthenticated'
        : dataError
          ? 'error'
          : 'ready';

  if (pageState === 'loading') {
    return <ProfileSkeleton variant="full" />;
  }

  if (pageState === 'unauthenticated' || !session) {
    return <AuthGate />;
  }

  if (pageState === 'error') {
    const isCircuitOpen = isCircuitBreakerError(dataError);

    return (
      <div
        className="mx-auto max-w-2xl rounded-xl border border-border/60 bg-card p-8 text-center shadow-xs"
        role="alert"
        aria-live="polite"
      >
        <div className="border-destructive/20 bg-destructive/10 text-destructive mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border">
          <AlertCircle className="h-7 w-7" aria-hidden="true" />
        </div>

        <h2 className="text-foreground mb-2 text-xl font-bold tracking-tight">
          {isCircuitOpen ? 'Service Protection Active' : 'Unable to Load Profile'}
        </h2>

        <p className="text-muted-foreground mx-auto mb-6 max-w-md text-xs sm:text-sm leading-relaxed">
          {isCircuitOpen
            ? 'The profile service is temporarily unavailable. Please try again shortly.'
            : 'We were unable to establish a secure connection to load your profile settings.'}
        </p>

        <Button
          variant="default"
          onClick={() => window.location.reload()}
          className="gap-2 font-semibold text-xs h-9"
          aria-label="Reload profile page"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      <FormProvider {...methods}>
        <ProfileHeader
          session={session}
          hasSellerProfile={hasSellerProfile}
          accountMeta={accountMeta}
          headingLevel="h2"
          isEditing={isEditing}
          onEdit={handleEdit}
        />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* Tab List with 2 items and WAI-ARIA semantics */}
          <TabsList
            className="grid grid-cols-2 h-12 w-full gap-2 rounded-xl border border-border/60 bg-muted/40 p-1 shadow-xs"
            aria-label="Profile sections"
          >
            {TAB_CONFIG.map(({ value, label, Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                id={`tab-${value}`}
                aria-controls={`tabpanel-${value}`}
                className={cn(
                  'relative flex h-full flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-xs sm:text-sm font-semibold transition-all duration-150 outline-none select-none',
                  'text-muted-foreground hover:text-foreground',
                  'data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-xs'
                )}
                aria-busy={isPending}
                aria-disabled={isSubmitting}
                disabled={isSubmitting}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Inline Success / Error Banner Area with polite announcements */}
          <div role="status" aria-live="polite" className="mt-4 space-y-3">
            {showSuccessBanner && (
              <Alert variant="success" className="animate-in fade-in duration-200">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Profile Updated</AlertTitle>
                <AlertDescription>
                  Your profile changes have been saved successfully.
                </AlertDescription>
              </Alert>
            )}

            {submitError && (
              <Alert variant="destructive" className="animate-in fade-in duration-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Unable to Save Changes</AlertTitle>
                <AlertDescription>
                  {submitError.message || 'An unexpected error occurred. Your changes were preserved.'}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <form
            className="mt-6"
            onSubmit={onSubmit}
            noValidate
            aria-label="User profile form"
          >
            <TabContent
              activeTab={activeTab}
              sharedActions={sharedActions}
              isInitialLoad={!hasLoadedOnce}
            />

            {/* Screen Reader Status Announcements */}
            {(isSubmitting || isDirty) && (
              <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                {isSubmitting ? 'Saving profile changes' : 'You have unsaved changes in your profile'}
              </div>
            )}
          </form>
        </Tabs>

        {/* Unsaved Changes Confirmation Modal */}
        <UnsavedChangesModal
          open={unsavedModalOpen}
          onOpenChange={setUnsavedModalOpen}
          onConfirmDiscard={handleConfirmDiscard}
          onKeepEditing={handleKeepEditing}
        />
      </FormProvider>
    </div>
  );
}

ProfileFormInner.displayName = 'ProfileFormInner';

export function ProfileForm({ userId }: ProfileFormProps) {
  return (
    <ErrorBoundary name="ProfileForm">
      <ProfileFormInner userId={userId} />
    </ErrorBoundary>
  );
}

ProfileForm.displayName = 'ProfileForm';
