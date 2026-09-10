import React, { memo } from 'react';
import type { ReactElement } from 'react';
import { STEPS } from '../constants/seller-form-steps';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { cn } from '@/shared/utils';

// ─── Type Definitions ──────────────────────────────────────────────────────────

export interface FormSkeletonProps {
  readonly stepId?: string;
  readonly className?: string;
}

interface FieldConfig {
  readonly width?: string;
  readonly height?: string;
  readonly isTextarea?: boolean;
}

interface GroupConfig {
  readonly cols: number;
  readonly fields: readonly FieldConfig[];
}

// ─── Step Layout Configurations ──────────────────────────────────────────────────

const PERSONAL_INFO_FIELDS: readonly GroupConfig[] = [
  { cols: 2, fields: [{ width: 'w-24' }, { width: 'w-24' }] },
  { cols: 1, fields: [{ width: 'w-16' }] },
  { cols: 2, fields: [{ width: 'w-20' }, { width: 'w-28' }] },
];

const ADDRESS_FIELDS: readonly GroupConfig[] = [
  { cols: 1, fields: [{ width: 'w-32' }] },
  { cols: 1, fields: [{ width: 'w-32' }] },
  { cols: 2, fields: [{ width: 'w-20' }, { width: 'w-24' }] },
  { cols: 2, fields: [{ width: 'w-24' }, { width: 'w-24' }] },
];

const KYC_FIELDS: readonly GroupConfig[] = [
  { cols: 1, fields: [{ width: 'w-32' }] },
  { cols: 2, fields: [{ width: 'w-24' }, { width: 'w-32' }] },
];

// ─── Sub-Layout Renders ─────────────────────────────────────────────────────────

function renderGridFields(fieldGroups: readonly GroupConfig[]): ReactElement {
  return (
    <div className="space-y-6 py-6" data-testid="fields-skeleton">
      {fieldGroups.map((group, groupIdx) => (
        <div
          key={`field-group-${groupIdx}`}
          className={cn(
            'grid grid-cols-1 gap-6',
            group.cols === 2 ? 'md:grid-cols-2' : ''
          )}
        >
          {group.fields.map((field, fieldIdx) => (
            <div key={`field-skeleton-${groupIdx}-${fieldIdx}`} className="space-y-2">
              {field.width && field.width !== 'none' && (
                <Skeleton className={cn('h-4', field.width)} />
              )}
              <Skeleton
                rounded={field.isTextarea ? 'xl' : 'md'}
                className={cn('w-full', field.height ?? 'h-10')}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function renderIdentitySkeleton(): ReactElement {
  return (
    <div className="space-y-12 max-w-4xl mx-auto" data-testid="identity-step-skeleton">
      {/* Identity Type Selection - Radio Group */}
      <div className="space-y-4">
        <div className="grid gap-6 sm:grid-cols-2">
          <Skeleton rounded="xl" className="h-[150px] w-full" />
          <Skeleton rounded="xl" className="h-[150px] w-full" />
        </div>
      </div>

      {/* Business Categories Selection */}
      <div className="space-y-8">
        <div className="flex items-center gap-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <Skeleton className="h-4 w-40" />
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton rounded="xl" className="h-[130px] w-full" />
          <Skeleton rounded="xl" className="h-[130px] w-full" />
          <Skeleton rounded="xl" className="h-[130px] w-full" />
        </div>
      </div>
    </div>
  );
}

function renderStoreFields(): ReactElement {
  const storeBaseFields: readonly GroupConfig[] = [
    { cols: 2, fields: [{ width: 'w-24', height: 'h-11' }, { width: 'w-28', height: 'h-11' }] },
    { cols: 2, fields: [{ width: 'w-28', height: 'h-11' }, { width: 'w-24', height: 'h-11' }] },
    { cols: 1, fields: [{ width: 'w-32', height: 'h-[100px]', isTextarea: true }] },
  ];

  const storeAddressFields: readonly GroupConfig[] = [
    { cols: 1, fields: [{ width: 'w-32' }] },
    { cols: 1, fields: [{ width: 'w-32' }] },
    { cols: 2, fields: [{ width: 'w-20' }, { width: 'w-24' }] },
    { cols: 2, fields: [{ width: 'w-24' }, { width: 'w-24' }] },
  ];

  const storeMapsField: readonly GroupConfig[] = [
    { cols: 1, fields: [{ width: 'w-32', height: 'h-11' }] },
  ];

  return (
    <div className="space-y-6 py-6" data-testid="store-step-skeleton">
      {renderGridFields(storeBaseFields)}
      
      {/* Store Location Divider & Title */}
      <div className="pt-4 space-y-4">
        <Skeleton className="h-5 w-32" />
        {renderGridFields(storeAddressFields)}
      </div>

      {/* Google Maps URL */}
      {renderGridFields(storeMapsField)}
    </div>
  );
}

function renderTermsSkeleton(): ReactElement {
  return (
    <div className="space-y-8" data-testid="terms-step-skeleton">
      {/* Notices region */}
      <div className="space-y-4 rounded-xl border border-border p-6 shadow-sm bg-muted/30">
        <div className="flex items-start gap-4">
          <Skeleton rounded="lg" className="h-9 w-9 shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
        <div className="flex items-start gap-4">
          <Skeleton rounded="lg" className="h-9 w-9 shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </div>

      {/* Checkbox item */}
      <div className="flex items-start space-x-3 rounded-xl border border-border p-5 bg-background/40">
        <Skeleton rounded="md" className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  );
}

function renderStepContent(stepId: string | undefined): ReactElement {
  switch (stepId) {
    case 'permanent-address':
      return renderGridFields(ADDRESS_FIELDS);
    case 'identity':
      return renderIdentitySkeleton();
    case 'kyc':
      return renderGridFields(KYC_FIELDS);
    case 'store':
      return renderStoreFields();
    case 'terms':
      return renderTermsSkeleton();
    case 'personal-info':
    default:
      return renderGridFields(PERSONAL_INFO_FIELDS);
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const FormSkeleton = memo(function FormSkeleton({
  stepId,
  className,
}: FormSkeletonProps): ReactElement {
  const stepCount = STEPS?.length || 6;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading seller onboarding form"
      className={cn('mx-auto max-w-7xl px-4 space-y-8 select-none', className)}
      data-testid="form-skeleton"
    >
      {/* Screen Reader Loading Announcement (WCAG 2.2 AA compliant) */}
      <span className="sr-only">Loading seller onboarding form. Please wait...</span>

      {/* Decorative skeleton layout elements (hidden from Screen Readers) */}
      <div aria-hidden="true" className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px] items-start">
        {/* Left Column - Main Card Skeleton */}
        <div className="space-y-6">
          {/* Header Title Skeleton */}
          <Skeleton rounded="md" className="h-8 w-64" />
          
          <div className="rounded-2xl border border-border bg-card shadow-md p-8 sm:p-10 min-h-[550px] flex flex-col justify-between">
            <div>
              {/* Stepper Skeleton (Desktop: >= 768px) */}
              <div className="hidden md:flex w-full items-center justify-between border-b border-border/40 pb-8">
                {Array.from({ length: stepCount }).map((_, i) => (
                  <div key={`step-skeleton-${i}`} className="relative flex-1 flex flex-col items-center">
                    {/* Connector line */}
                    {i !== 0 && (
                      <div className="absolute top-5 right-[50%] -left-[50%] h-[3px] bg-muted/60" />
                    )}
                    {/* Circle */}
                    <Skeleton rounded="full" className="relative z-10 h-10 w-10" />
                    {/* Title */}
                    <Skeleton className="mt-3 h-3 w-16" />
                    {/* Subtitle */}
                    <Skeleton className="mt-1.5 h-2 w-12" />
                  </div>
                ))}
              </div>

              {/* Stepper Skeleton (Mobile: < 768px) */}
              <div className="flex flex-col space-y-2 md:hidden pb-8 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton rounded="full" className="h-2 w-full" />
                <Skeleton className="h-2.5 w-32" />
              </div>

              {/* Form Fields skeleton */}
              {renderStepContent(stepId)}
            </div>

            {/* Navigation buttons skeleton */}
            <div className="flex items-center justify-between border-t border-border/40 pt-6">
              <Skeleton rounded="md" className="h-10 w-24" />
              <Skeleton rounded="md" className="h-10 w-24" />
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar Checklist Skeleton */}
        <aside className="rounded-2xl border border-border bg-card p-6 space-y-6 h-fit lg:sticky lg:top-6">
          {/* Progress Circle & Text Skeleton */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-32" />
              <Skeleton rounded="full" className="h-6 w-12" />
            </div>
            <Skeleton rounded="full" className="h-2 w-full" />
          </div>

          <div className="border-t border-border" />

          {/* Checklist Items Skeletons */}
          <div className="space-y-4">
            {Array.from({ length: stepCount }).map((_, i) => (
              <div key={`item-skeleton-${i}`} className="flex items-start gap-3">
                <Skeleton rounded="full" className="h-5 w-5 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
});

FormSkeleton.displayName = 'FormSkeleton';
