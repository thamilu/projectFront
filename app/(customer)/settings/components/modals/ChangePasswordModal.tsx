'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/atoms/dialog';
import { Button } from '@/shared/ui/atoms/button';
import { Input } from '@/shared/ui/atoms/input';
import { Label } from '@/shared/ui/atoms/label';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import PasswordStrength from '@/shared/ui/atoms/password-strength';
import { toast } from 'sonner';
import { apiClient } from '@/core/client';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import { ChangePasswordSchema } from '@/features/auth/schemas/auth.schema';

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INITIAL_FORM = { currentPassword: '', newPassword: '', confirmNewPassword: '' };

/**
 * Maps a change-password API failure to a user-facing message.
 *
 * The request is sent with X-Bypass-Toast so the global axios interceptor
 * (core/interceptors/index.ts) doesn't ALSO show its own generic toast for
 * 403/404/422/429/500 — this is the only place the specific "why did it
 * fail" message should appear, matching the pattern already used for the
 * profile-save request (see useProfileSubmit.ts).
 */
function resolveErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const response = (err as { response?: { status?: number; data?: { message?: string } } })
      .response;
    const status = response?.status;
    const serverMessage = response?.data?.message;

    if (status === 400 || status === 401) {
      return 'Current password is incorrect.';
    }
    if (status === 409) {
      return 'This password was already changed in another session. Please refresh and try again.';
    }
    if (status === 429) {
      return 'Too many attempts. Please wait a few minutes before trying again.';
    }
    if (status && status >= 500) {
      return 'Our servers are temporarily unavailable. Please try again shortly.';
    }
    if (serverMessage) return serverMessage;
  }
  if (err instanceof Error && err.message.includes('Network')) {
    return 'Network connection lost. Please check your internet connectivity and try again.';
  }
  return 'Unable to change your password. Please try again.';
}

export function ChangePasswordModal({ open, onOpenChange }: ChangePasswordModalProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live criteria hints only — the authoritative check on submit is the
  // real, shared ChangePasswordSchema (also used server-side contract-wise),
  // not this ad-hoc regex set.
  const hasMinLength = form.newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(form.newPassword);
  const hasNumber = /[0-9]/.test(form.newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(form.newPassword);
  const passwordsMatch = form.newPassword.length > 0 && form.newPassword === form.confirmNewPassword;

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setForm(INITIAL_FORM);
    setFieldErrors({});
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = ChangePasswordSchema.safeParse(form);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    try {
      await apiClient.put(
        API_ENDPOINTS.USERS.CHANGE_PASSWORD,
        {
          currentPassword: result.data.currentPassword,
          newPassword: result.data.newPassword,
        },
        { headers: { 'X-Bypass-Toast': 'true' } }
      );

      toast.success('Password updated successfully', {
        description: 'You have been signed out of your other active sessions.',
      });
      setForm(INITIAL_FORM);
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error('Unable to change password', { description: resolveErrorMessage(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1 text-primary">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Lock className="h-5 w-5" />
            </span>
            <DialogTitle className="text-xl">Change Password</DialogTitle>
          </div>
          <DialogDescription>
            Update your account password. Credential updates will invalidate active sessions on other devices.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showPassword ? 'text' : 'password'}
                value={form.currentPassword}
                onChange={handleChange('currentPassword')}
                placeholder="Enter current password"
                autoComplete="current-password"
                required
                disabled={isSubmitting}
                aria-invalid={!!fieldErrors.currentPassword}
                aria-describedby={fieldErrors.currentPassword ? 'current-password-error' : undefined}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.currentPassword && (
              <p id="current-password-error" role="alert" className="text-xs text-destructive font-medium">
                {fieldErrors.currentPassword}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              value={form.newPassword}
              onChange={handleChange('newPassword')}
              placeholder="Enter new strong password"
              autoComplete="new-password"
              required
              disabled={isSubmitting}
              aria-invalid={!!fieldErrors.newPassword}
              aria-describedby={fieldErrors.newPassword ? 'new-password-error' : undefined}
            />
            <PasswordStrength password={form.newPassword} />
            {fieldErrors.newPassword && (
              <p id="new-password-error" role="alert" className="text-xs text-destructive font-medium">
                {fieldErrors.newPassword}
              </p>
            )}
          </div>

          {/* Policy Checklist — live visual feedback only */}
          <div className="rounded-lg bg-muted/40 p-3 space-y-1.5 text-xs text-muted-foreground border border-border/40">
            <p className="font-semibold text-foreground mb-1">Password Policy Requirements:</p>
            <div className="grid grid-cols-2 gap-1.5">
              <span className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${hasMinLength ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                At least 8 characters
              </span>
              <span className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${hasUpper ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                1 uppercase letter
              </span>
              <span className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${hasNumber ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                1 number
              </span>
              <span className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${hasSpecial ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                1 special symbol
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={form.confirmNewPassword}
              onChange={handleChange('confirmNewPassword')}
              placeholder="Re-enter new password"
              autoComplete="new-password"
              required
              disabled={isSubmitting}
              aria-invalid={!!fieldErrors.confirmNewPassword}
              aria-describedby={fieldErrors.confirmNewPassword ? 'confirm-password-error' : undefined}
            />
            {(fieldErrors.confirmNewPassword || form.confirmNewPassword.length > 0) && (
              <p
                className={`text-xs ${
                  fieldErrors.confirmNewPassword
                    ? 'text-destructive font-medium'
                    : passwordsMatch
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-destructive'
                }`}
                id={fieldErrors.confirmNewPassword ? 'confirm-password-error' : undefined}
                role={fieldErrors.confirmNewPassword ? 'alert' : undefined}
              >
                {fieldErrors.confirmNewPassword ||
                  (passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match')}
              </p>
            )}
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
