'use client';

/**
 * AddProductForm
 *
 * Orchestrates the creation flow for products.
 *
 * Features:
 * - Load state handled with a visual-matching high-fidelity ProductFormSkeleton (reduces CLS).
 * - Full Error state rendering with Retry button and specific timeout checks.
 * - Confirmed telemetry tracking for funnel tracking: viewed, loaded, load_failed.
 * - Accessibility (WCAG AA): focus management on loading transitions, status regions for error nodes.
 * - Wraps child shell inside a robust FormErrorBoundary to prevent page-level crashes.
 * - Dynamic imports ready container layout.
 */

import { useEffect, useRef, type ReactElement } from 'react';
import { useProductFormController } from '../hooks/use-product-form-controller';
import { ProductFormShell } from './ProductFormShell';
import { ProductFormSkeleton } from './ProductFormSkeleton';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Button } from '@/shared/ui/atoms/button';
import { AlertCircle } from 'lucide-react';
import { useI18n } from '@/core/i18n';
import { trackEvent } from '@/core/providers/analytics-provider';
import { logger } from '@/core/telemetry/logger';
import { FormErrorBoundary } from '@/shared/ui/feedback/error-boundary';

// ─── Layout Constants ────────────────────────────────────────────────────────

const FORM_MAX_WIDTH = 'mx-auto max-w-5xl' as const;

export function AddProductForm(): ReactElement {
  const { t } = useI18n();
  const controller = useProductFormController('create');
  const {
    isLoading,
    isError,
    error,
    refetch,
    form,
    activeTab,
    setActiveTab,
    catalog,
    media,
    submit,
  } = controller;

  const loadStartTimeRef = useRef<number>(Date.now());
  const focusTargetRef = useRef<HTMLDivElement>(null);

  // ── 1. Telemetry / Funnel Tracking ─────────────────────────────────────────
  useEffect(() => {
    try {
      trackEvent('product_form_viewed', { mode: 'create' });
    } catch (err) {
      logger.warn('[AddProductForm] Failed to track form view', { error: err });
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isError) {
      try {
        trackEvent('product_form_loaded', {
          mode: 'create',
          duration_ms: Date.now() - loadStartTimeRef.current,
        });
      } catch (err) {
        logger.warn('[AddProductForm] Failed to track load success', { error: err });
      }
    }
  }, [isLoading, isError]);

  useEffect(() => {
    if (isError) {
      try {
        trackEvent('product_form_load_failed', {
          mode: 'create',
          error_message: error?.message || 'Unknown error',
          is_timeout: error?.message === 'LOADING_TIMEOUT',
        });
      } catch (err) {
        logger.warn('[AddProductForm] Failed to track load failure', { error: err });
      }
    }
  }, [isError, error]);

  // ── 2. Accessibility Focus Management ──────────────────────────────────────
  useEffect(() => {
    if (!isLoading && !isError && focusTargetRef.current) {
      // Focus the form wrapper for screen reader context once loading completes
      focusTargetRef.current.focus();
    }
  }, [isLoading, isError]);

  // ── 3. Render Loading Skeleton ─────────────────────────────────────────────
  if (isLoading) {
    return <ProductFormSkeleton />;
  }

  // ── 4. Render Error / Timeout State ────────────────────────────────────────
  if (isError) {
    const isTimeout = error?.message === 'LOADING_TIMEOUT';
    return (
      <Card className={FORM_MAX_WIDTH} data-testid="product-form-error">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
          <AlertCircle className="h-8 w-8 text-destructive animate-bounce" aria-hidden="true" />
          <p className="text-sm font-medium text-muted-foreground text-center" aria-live="assertive">
            {isTimeout
              ? t('products.form.timeoutError', {
                  defaultValue: 'Request timed out. Please check your connection and try again.',
                })
              : t('products.form.loadError', {
                  defaultValue: 'Failed to load product form information.',
                })}
          </p>
          <Button variant="outline" onClick={refetch} data-testid="product-form-retry">
            {t('common.retry', { defaultValue: 'Retry' })}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── 5. Render Main Form Shell inside an Error Boundary ─────────────────────
  return (
    <div
      ref={focusTargetRef}
      tabIndex={-1}
      className={`${FORM_MAX_WIDTH} focus:outline-none`}
      data-testid="product-form-container"
    >
      <FormErrorBoundary>
        <ProductFormShell
          mode="create"
          form={form}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          catalog={catalog}
          media={media}
          submit={submit}
        />
      </FormErrorBoundary>
    </div>
  );
}
