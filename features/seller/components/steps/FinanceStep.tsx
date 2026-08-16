'use client';

import React, { useState, useMemo, useId, useCallback } from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { motion, useReducedMotion } from 'framer-motion';
import { CreditCard, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '@/shared/ui/atoms/input';
import { Label } from '@/shared/ui/atoms/label';
import { Checkbox } from '@/shared/ui/atoms/checkbox';
import { useI18n } from '@/core/i18n';
import { useQuery } from '@tanstack/react-query';
import type { SellerOnboardingValues } from '@/domains/seller/contracts/seller.schema';

/**
 * FinanceStep Component
 *
 * Renders the banking details and Terms of Service consent step.
 * Implements strict security (account masking, autocomplete safety, session replay suppression),
 * real-time IFSC RBI-lookup validation, layout shift preventions, and complete WCAG accessibility.
 */
export function FinanceStep(): React.ReactElement {
  const {
    register,
    control,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useFormContext<SellerOnboardingValues>();
  const { t } = useI18n();

  // Access motion preference for accessibility (prefers-reduced-motion)
  const shouldReduceMotion = useReducedMotion();

  // State to toggle display masking for sensitive account numbers
  const [showAccount, setShowAccount] = useState(false);
  const [showConfirmAccount, setShowConfirmAccount] = useState(false);

  // Generate unique ARIA IDs to prevent layout collisions
  const bankFieldsetId = useId();
  const accErrorId = useId();
  const accDescId = useId();
  const accConfirmErrorId = useId();
  const accConfirmDescId = useId();
  const ifscErrorId = useId();
  const ifscDescId = useId();
  const termsErrorId = useId();

  // Watch IFSC code for live verification lookup
  const watchedIfsc = useWatch({ control, name: 'bankIfsc', defaultValue: '' }) || '';
  const cleanIfsc = useMemo(() => watchedIfsc.trim().toUpperCase(), [watchedIfsc]);
  const isIfscFormatValid = useMemo(() => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc), [cleanIfsc]);

  // Real-time IFSC lookup query using RBI canonical database via Razorpay public API
  const { data: bankDetails, isLoading: isIfscLoading, isError: isIfscError } = useQuery({
    queryKey: ['seller', 'verify', 'ifsc', cleanIfsc],
    queryFn: async ({ signal }) => {
      const res = await fetch(`https://ifsc.razorpay.com/${cleanIfsc}`, { signal });
      if (!res.ok) throw new Error('IFSC lookup failed');
      return res.json();
    },
    enabled: isIfscFormatValid,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 1,
  });

  // Custom change handlers to force uppercase/digits and update RHF state programmatically
  const handleIfscChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = e.target.value.trim().toUpperCase();
      setValue('bankIfsc', formatted, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [setValue]
  );

  const handleIfscPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text');
      const formatted = pasted.trim().toUpperCase();
      setValue('bankIfsc', formatted, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [setValue]
  );

  // Form-level error summary list (WCAG 3.3.1)
  const errorItems = useMemo(() => {
    const items = [];
    if (errors.bankAccountNumber) {
      items.push({ id: 'bankAccountNumber', message: `${t('sellerOnboarding.verification.fields.bankAccount', { defaultValue: 'Account Number' })}: ${errors.bankAccountNumber.message}` });
    }
    if (errors.bankAccountNumberConfirm) {
      items.push({ id: 'bankAccountNumberConfirm', message: `${t('sellerOnboarding.verification.fields.bankAccountConfirm', { defaultValue: 'Confirm Account Number' })}: ${errors.bankAccountNumberConfirm.message}` });
    }
    if (errors.bankIfsc) {
      items.push({ id: 'bankIfsc', message: `${t('sellerOnboarding.verification.fields.ifsc', { defaultValue: 'IFSC Code' })}: ${errors.bankIfsc.message}` });
    }
    if (errors.acceptedTerms) {
      items.push({ id: 'acceptedTerms', message: `${t('sellerOnboarding.verification.fields.acceptedTerms', { defaultValue: 'Terms Agreement' })}: ${errors.acceptedTerms.message}` });
    }
    return items;
  }, [errors, t]);

  // No custom formatting needed for a plain account number — use RHF's default
  // onChange directly (unlike IFSC below, nothing here replaces it if stripped).
  const accountRegister = register('bankAccountNumber');
  // IFSC's default onChange is intentionally discarded — handleIfscChange below
  // replaces it via setValue() to force uppercase formatting live.
  const { onChange: _ifscOnChange, ...ifscRegister } = register('bankIfsc');

  return (
    <motion.div
      key="step4"
      initial={shouldReduceMotion ? {} : { opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-8 max-w-4xl mx-auto"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          {t('sellerOnboarding.finance.title', { defaultValue: 'Financials & Agreement' })}
        </h2>
        <p className="text-muted-foreground mt-2">
          {t('sellerOnboarding.finance.description', { defaultValue: 'Where should we send your payouts?' })}
        </p>
      </div>

      {/* Visually Hidden Screen Reader Announcements (WCAG 4.1.3) */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {isIfscLoading && 'Verifying IFSC Code...'}
        {bankDetails && `IFSC verified. Bank branch is ${bankDetails.BANK}, ${bankDetails.BRANCH}`}
        {isIfscError && 'IFSC verification failed. Please check the entered code.'}
      </div>

      {/* Form-level Error Summary Region (WCAG 3.3.1) */}
      {errorItems.length > 0 && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm space-y-2 animate-in fade-in"
          data-testid="finance-error-summary"
        >
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Please correct the errors in the following fields:</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 font-medium">
            {errorItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="hover:underline focus:outline-none focus:ring-2 focus:ring-destructive rounded"
                >
                  {item.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bank details fieldset */}
      <fieldset
        id={bankFieldsetId}
        disabled={isSubmitting}
        className="m-0 border-0 p-0 bg-primary/5 border-primary/10 rounded-2xl border p-6 space-y-6"
      >
        <legend className="sr-only">Bank Account Details</legend>
        
        <div className="flex items-center gap-2 border-b border-border/40 pb-4">
          <CreditCard className="text-primary h-5 w-5 shrink-0" />
          <h3 className="text-lg font-semibold">Bank Details</h3>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Account Number Input */}
          <div className="space-y-2 relative">
            <Label htmlFor="bankAccountNumber">Account Number</Label>
            <div className="relative flex items-center">
              <Input
                id="bankAccountNumber"
                type={showAccount ? 'text' : 'password'}
                inputMode="numeric"
                placeholder="000012345678"
                className="bg-background h-12 font-mono pr-10 tracking-widest"
                aria-invalid={!!errors.bankAccountNumber}
                aria-describedby={errors.bankAccountNumber ? accErrorId : accDescId}
                autoComplete="new-password"
                data-lpignore="true"
                data-form-type="other"
                data-1p-ignore
                data-hj-suppress
                data-fs-mask="true"
                data-private
                maxLength={18}
                {...accountRegister}
              />
              <button
                type="button"
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-200 transition-colors"
                onClick={() => setShowAccount((prev) => !prev)}
                aria-label={showAccount ? 'Hide account number' : 'Show account number'}
              >
                {showAccount ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* Height-reserved error/description block to prevent CLS */}
            <div className="min-h-[2.25rem]">
              {errors.bankAccountNumber ? (
                <p id={accErrorId} className="text-destructive text-xs font-medium flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.bankAccountNumber.message}
                </p>
              ) : (
                <p id={accDescId} className="text-[11px] font-medium text-slate-500 dark:text-slate-400 ml-1">
                  Enter the account number where you want to receive payouts.
                </p>
              )}
            </div>
          </div>

          {/* Confirm Account Number */}
          <div className="space-y-2 relative">
            <Label htmlFor="bankAccountNumberConfirm">Confirm Account Number</Label>
            <div className="relative flex items-center">
              <Input
                id="bankAccountNumberConfirm"
                type={showConfirmAccount ? 'text' : 'password'}
                inputMode="numeric"
                placeholder="Re-enter account number"
                className="bg-background h-12 font-mono pr-10 tracking-widest"
                aria-invalid={!!errors.bankAccountNumberConfirm}
                aria-describedby={errors.bankAccountNumberConfirm ? accConfirmErrorId : accConfirmDescId}
                autoComplete="new-password"
                data-lpignore="true"
                data-form-type="other"
                data-1p-ignore
                data-hj-suppress
                data-fs-mask="true"
                data-private
                onPaste={(e) => e.preventDefault()} // Force manual entry to verify correctness
                maxLength={18}
                {...register('bankAccountNumberConfirm', {
                  required: 'Please confirm your bank account number',
                  validate: (val) => val === getValues('bankAccountNumber') || 'Account numbers do not match',
                })}
              />
              <button
                type="button"
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-200 transition-colors"
                onClick={() => setShowConfirmAccount((prev) => !prev)}
                aria-label={showConfirmAccount ? 'Hide confirm account number' : 'Show confirm account number'}
              >
                {showConfirmAccount ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="min-h-[2.25rem]">
              {errors.bankAccountNumberConfirm ? (
                <p id={accConfirmErrorId} className="text-destructive text-xs font-medium flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.bankAccountNumberConfirm.message}
                </p>
              ) : (
                <p id={accConfirmDescId} className="text-[11px] font-medium text-slate-500 dark:text-slate-400 ml-1">
                  Re-type your account number to confirm destination validity.
                </p>
              )}
            </div>
          </div>

          {/* IFSC Code Input */}
          <div className="space-y-2">
            <Label htmlFor="bankIfsc">IFSC Code</Label>
            <Input
              id="bankIfsc"
              placeholder="SBIN0123456"
              className="bg-background focus:ring-primary/20 h-12 font-mono uppercase"
              aria-invalid={!!errors.bankIfsc}
              aria-describedby={errors.bankIfsc ? ifscErrorId : ifscDescId}
              maxLength={11}
              autoComplete="off"
              onChange={handleIfscChange}
              onPaste={handleIfscPaste}
              {...ifscRegister}
            />
            <div className="min-h-[2.5rem] space-y-1">
              {errors.bankIfsc ? (
                <p id={ifscErrorId} className="text-destructive text-xs font-medium flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.bankIfsc.message}
                </p>
              ) : (
                <>
                  <p id={ifscDescId} className="text-[11px] font-medium text-slate-500 dark:text-slate-400 ml-1">
                    11-character Indian Financial System Code (IFSC), e.g. SBIN0123456
                  </p>
                  {isIfscLoading && (
                    <p className="text-xs text-amber-500 dark:text-amber-400 flex items-center gap-1 animate-pulse ml-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping inline-block" />
                      Verifying IFSC details...
                    </p>
                  )}
                  {bankDetails && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium ml-1">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span>{bankDetails.BANK} — {bankDetails.BRANCH}</span>
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </fieldset>

      {/* Terms of Service Section */}
      <div className="bg-muted/40 border-border/40 flex items-start space-x-3 rounded-2xl border p-4">
        <Controller
          name="acceptedTerms"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="acceptedTerms"
              className="mt-1 h-5 w-5 shrink-0 border-slate-700 focus-visible:ring-primary focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:outline-none"
              checked={field.value}
              onCheckedChange={field.onChange}
              onBlur={field.onBlur}
              aria-invalid={!!errors.acceptedTerms}
              aria-describedby={errors.acceptedTerms ? termsErrorId : undefined}
            />
          )}
        />
        <div className="grid gap-1.5 leading-tight">
          <Label htmlFor="acceptedTerms" className="cursor-pointer text-base font-semibold">
            I agree to the{' '}
            <a
              href="/legal/seller-terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-0.5"
              onClick={(e) => e.stopPropagation()} // Prevents toggling the checkbox when clicking the link
            >
              Seller Terms of Service
              <span className="sr-only">(opens in new tab)</span>
            </a>
          </Label>
          <p className="text-muted-foreground text-sm">
            By checking this box, you confirm that the information provided is completely accurate,
            and you agree to our platform policies, commission structures, and privacy practices.
          </p>
          {errors.acceptedTerms && (
            <p
              id={termsErrorId}
              className="text-destructive mt-1 text-sm font-medium flex items-center gap-1 animate-in fade-in"
              role="alert"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {errors.acceptedTerms.message}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
