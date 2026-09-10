'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useWatch, Control, FieldErrors } from 'react-hook-form';
import { sellerApi } from '../api/seller-api';
import { KYC_PATTERNS, KYC_FIELD_LENGTHS } from '../constants/kyc.constants';
import { logger } from '@/core/telemetry/logger';
import * as Sentry from '@sentry/nextjs';

export function useKycVerification(control: Control<any>, errors: FieldErrors<any>) {
  // Use useWatch with explicit field names for surgical subscriptions to minimize re-renders
  const businessPan = useWatch({ control, name: 'businessPan', defaultValue: '' }) || '';
  const gstin = useWatch({ control, name: 'gstin', defaultValue: '' }) || '';
  const panNumber = useWatch({ control, name: 'panNumber', defaultValue: '' }) || '';
  const aadhar = useWatch({ control, name: 'aadhar', defaultValue: '' }) || '';

  // Clean and sanitize inputs defensively before regex check to prevent ReDoS
  const cleanBusinessPan = useMemo(() => {
    return businessPan.trim().slice(0, KYC_FIELD_LENGTHS.PAN).replace(/[^A-Z0-9]/gi, '').toUpperCase();
  }, [businessPan]);

  const cleanGstin = useMemo(() => {
    return gstin.trim().slice(0, KYC_FIELD_LENGTHS.GSTIN).replace(/[^A-Z0-9]/gi, '').toUpperCase();
  }, [gstin]);

  const cleanPanNumber = useMemo(() => {
    return panNumber.trim().slice(0, KYC_FIELD_LENGTHS.PAN).replace(/[^A-Z0-9]/gi, '').toUpperCase();
  }, [panNumber]);

  const cleanAadhar = useMemo(() => {
    return aadhar.replace(/\s/g, '').slice(0, KYC_FIELD_LENGTHS.AADHAR);
  }, [aadhar]);

  // Client-side format checks (memoized to prevent INP degradation)
  const isBusinessPanFormatValid = useMemo(() => {
    return KYC_PATTERNS.PAN.test(cleanBusinessPan) && !errors.businessPan;
  }, [cleanBusinessPan, errors.businessPan]);

  const isGstinFormatValid = useMemo(() => {
    return KYC_PATTERNS.GSTIN.test(cleanGstin) && !errors.gstin;
  }, [cleanGstin, errors.gstin]);

  const isPanNumberFormatValid = useMemo(() => {
    return KYC_PATTERNS.PAN.test(cleanPanNumber) && !errors.panNumber;
  }, [cleanPanNumber, errors.panNumber]);

  const isAadharFormatValid = useMemo(() => {
    return KYC_PATTERNS.AADHAR.test(cleanAadhar) && !errors.aadhar;
  }, [cleanAadhar, errors.aadhar]);

  // Async server-side verification using TanStack Query
  const businessPanQuery = useQuery({
    queryKey: ['seller', 'verify', 'businessPan', cleanBusinessPan],
    queryFn: async ({ signal }) => {
      // Logs the field name only, never the raw PAN value — knowing
      // verification was initiated for 'businessPan' has debugging value;
      // the actual government ID number does not, and previously reached
      // structured logs (local log file + /api/logs) under the key `pan`,
      // which the redaction list's panNumber/businessPan entries don't
      // match (see core/telemetry/logger.ts's sensitiveKeys fix).
      logger.info('Initiating server-side PAN verification', { field: 'businessPan' });
      try {
        const res = await sellerApi.verifyPan(cleanBusinessPan, { signal });
        return res.verified;
      } catch (err: any) {
        logger.error('Server PAN verification failed', { error: err });
        Sentry.captureException(err);
        return false;
      }
    },
    enabled: isBusinessPanFormatValid,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const gstinQuery = useQuery({
    queryKey: ['seller', 'verify', 'gstin', cleanGstin],
    queryFn: async ({ signal }) => {
      logger.info('Initiating server-side GSTIN verification', { gstin: cleanGstin });
      try {
        const res = await sellerApi.verifyGstin(cleanGstin, { signal });
        return res.verified;
      } catch (err: any) {
        logger.error('Server GSTIN verification failed', { error: err });
        Sentry.captureException(err);
        return false;
      }
    },
    enabled: isGstinFormatValid,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const panNumberQuery = useQuery({
    queryKey: ['seller', 'verify', 'panNumber', cleanPanNumber],
    queryFn: async ({ signal }) => {
      logger.info('Initiating server-side PAN verification', { field: 'panNumber' });
      try {
        const res = await sellerApi.verifyPan(cleanPanNumber, { signal });
        return res.verified;
      } catch (err: any) {
        logger.error('Server PAN verification failed', { error: err });
        Sentry.captureException(err);
        return false;
      }
    },
    enabled: isPanNumberFormatValid,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const aadharQuery = useQuery({
    queryKey: ['seller', 'verify', 'aadhar', cleanAadhar],
    queryFn: async ({ signal }) => {
      logger.info('Initiating server-side Aadhaar verification', { aadhar: cleanAadhar });
      try {
        const res = await sellerApi.verifyAadhar(cleanAadhar, { signal });
        return res.verified;
      } catch (err: any) {
        logger.error('Server Aadhaar verification failed', { error: err });
        Sentry.captureException(err);
        return false;
      }
    },
    enabled: isAadharFormatValid,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    isBusinessPanVerified: isBusinessPanFormatValid && !!businessPanQuery.data,
    isBusinessPanVerifying: businessPanQuery.isLoading && businessPanQuery.isFetching,
    isGstinVerified: isGstinFormatValid && !!gstinQuery.data,
    isGstinVerifying: gstinQuery.isLoading && gstinQuery.isFetching,
    isPanNumberVerified: isPanNumberFormatValid && !!panNumberQuery.data,
    isPanNumberVerifying: panNumberQuery.isLoading && panNumberQuery.isFetching,
    isAadharVerified: isAadharFormatValid && !!aadharQuery.data,
    isAadharVerifying: aadharQuery.isLoading && aadharQuery.isFetching,
  };
}
