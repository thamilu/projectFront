'use client';

import { useState, useMemo, useId, useCallback } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '@/shared/ui/atoms/input';
import { Label } from '@/shared/ui/atoms/label';
import type { SellerOnboardingValues } from '@/domains/seller/contracts/seller.schema';

/**
 * BankDetailsFields
 *
 * Payout bank account collection, rendered as part of StoreStep (not a
 * separate wizard step — see the comment on FinanceStep.tsx, which this
 * replaces). Real-time IFSC RBI-lookup validation, account masking,
 * autocomplete safety, and full WCAG accessibility carried over unchanged
 * from the original FinanceStep implementation this was extracted from.
 *
 * Missing-feature fix: previously nothing in the live onboarding wizard
 * collected bank/payout details at all — the schema had the fields
 * (bankAccountNumber, bankAccountNumberConfirm, bankIfsc) and a dedicated
 * component existed (FinanceStep.tsx), but the component was never
 * imported by the live 6-step flow. Adding it as a NEW step was rejected as
 * too risky (33 files reference hardcoded step counts/numbers, including
 * telemetry step_number literals and 12+ step-position-specific tests) —
 * extending the existing StoreStep instead requires no step-count change,
 * no renumbering, and no telemetry/test updates beyond StoreStep's own.
 */
export function BankDetailsFields(): React.ReactElement {
  const {
    register,
    control,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useFormContext<SellerOnboardingValues>();

  const [showAccount, setShowAccount] = useState(false);
  const [showConfirmAccount, setShowConfirmAccount] = useState(false);

  const bankFieldsetId = useId();
  const accErrorId = useId();
  const accDescId = useId();
  const accConfirmErrorId = useId();
  const accConfirmDescId = useId();
  const ifscErrorId = useId();
  const ifscDescId = useId();

  const watchedIfsc = useWatch({ control, name: 'bankIfsc', defaultValue: '' }) || '';
  const cleanIfsc = useMemo(() => watchedIfsc.trim().toUpperCase(), [watchedIfsc]);
  const isIfscFormatValid = useMemo(() => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc), [cleanIfsc]);

  const { data: bankDetails, isLoading: isIfscLoading, isError: isIfscError } = useQuery({
    queryKey: ['seller', 'verify', 'ifsc', cleanIfsc],
    queryFn: async ({ signal }) => {
      const res = await fetch(`https://ifsc.razorpay.com/${cleanIfsc}`, { signal });
      if (!res.ok) throw new Error('IFSC lookup failed');
      return res.json();
    },
    enabled: isIfscFormatValid,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

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

  const accountRegister = register('bankAccountNumber');
  const { onChange: _ifscOnChange, ...ifscRegister } = register('bankIfsc');

  return (
    <fieldset
      id={bankFieldsetId}
      disabled={isSubmitting}
      className="m-0 border-0 p-0 bg-primary/5 border-primary/10 rounded-2xl border p-6 space-y-6 mt-6"
    >
      <legend className="sr-only">Bank Account Details</legend>

      <div className="flex items-center gap-2 border-b border-border/40 pb-4">
        <CreditCard className="text-primary h-5 w-5 shrink-0" aria-hidden="true" />
        <h3 className="text-lg font-semibold">Payout Bank Details</h3>
      </div>

      {/* Visually Hidden Screen Reader Announcements (WCAG 4.1.3) */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {isIfscLoading && 'Verifying IFSC Code...'}
        {bankDetails && `IFSC verified. Bank branch is ${bankDetails.BANK}, ${bankDetails.BRANCH}`}
        {isIfscError && 'IFSC verification failed. Please check the entered code.'}
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
              autoComplete="off"
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
              autoComplete="off"
              data-lpignore="true"
              data-form-type="other"
              data-1p-ignore
              data-hj-suppress
              data-fs-mask="true"
              data-private
              onPaste={(e) => e.preventDefault()}
              maxLength={18}
              {...register('bankAccountNumberConfirm', {
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
  );
}
