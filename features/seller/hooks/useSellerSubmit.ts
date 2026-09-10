'use client';

import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { SellerOnboardingValues } from '@/domains/seller/contracts/seller.schema';
import { sellerApi } from '@/features/seller/api/seller-api';
import { eventBus } from '@/platform/events';
import { logger } from '@/core/telemetry/logger';
import { toast } from 'sonner';
import { mapApiErrorsToForm } from '../utils/form-error-mapper';

interface UseSellerSubmitProps {
  methods: UseFormReturn<SellerOnboardingValues>;
  setStatus: (status: string) => void;
  setErrorMessage: (msg: string | null) => void;
  onSuccess?: () => void;
  setReferenceId: (id: string | null) => void;
}

export function useSellerSubmit({
  methods,
  setStatus,
  setErrorMessage,
  onSuccess,
  setReferenceId,
}: UseSellerSubmitProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: SellerOnboardingValues) => {
    logger.debug('Attempting final submission');
    setIsSubmitting(true);
    try {
      const response = await sellerApi.register(data as any);
      logger.debug('Registration success response');
      toast.success('Registration successful! Redirecting...');

      const sellerId = (response as any).sellerId || response.seller?.id || 0;
      if (sellerId) {
        setReferenceId(`SEL-${sellerId}`);
      }
      setStatus('PENDING');

      // Publish event safely with real ID
      try {
        eventBus.publish('SellerRegistered', {
          sellerId: Number(sellerId),
          shopName: data.shopName,
        });
      } catch (eventErr) {
        logger.error('[EventBus] Failed to publish SellerRegistered event', { eventErr });
      }

      if (onSuccess) onSuccess();
    } catch (error: any) {
      logger.error('[SellerRegistration] FAILED', {
        status: error.status || 'N/A',
        message: error.message || 'Unknown Error',
      });

      if (error.errors) {
        mapApiErrorsToForm(error.errors, methods.setError);
        toast.error('Registration failed: Please check the highlighted fields across all steps.');
      } else {
        setStatus('ERROR');
        setErrorMessage(
          error.message || 'We could not process your registration. Please try again.'
        );
        toast.error(error.message || 'Registration failed. Please check your data.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, onSubmit };
}
