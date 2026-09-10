'use client';

/**
 * Saved payment methods.
 *
 * [CORRECTNESS + TRUST] This page previously rendered a `MOCK_METHODS`
 * constant — a fabricated "HDFC Visa ••••4242", a fake UPI handle and a
 * "₹250 balance" Paytm wallet — identically for every signed-in user. Delete
 * and Set Default mutated `useState` and fired success toasts while persisting
 * nothing, so both silently reverted on refresh, and "Add New" had no handler
 * at all. The footer asserted *"Your payment information is encrypted and
 * stored securely"* when no payment information existed — an affirmative false
 * statement about security handling, which is the most damaging line on the
 * page and is not reinstated below in that form.
 *
 * @see features/payments/api/payment-methods-api — why no card data reaches this app
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  Smartphone,
  Wallet,
  AlertTriangle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Badge } from '@/shared/ui/atoms/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/atoms/dialog';
import {
  usePaymentMethods,
  useSetDefaultPaymentMethod,
  useRemovePaymentMethod,
} from '@/features/payments/hooks/use-payment-methods';
import {
  describePaymentMethod,
  isExpired,
  type PaymentMethodDTO,
} from '@/features/payments/api/payment-methods-api';
import { APP_ROUTES } from '@/shared/routes';

/** Icon per instrument family. Colour comes from tokens, not the palette. */
function TypeIcon({ type }: { type: PaymentMethodDTO['type'] }) {
  const className = 'h-5 w-5 text-muted-foreground';
  if (type === 'CARD') return <CreditCard className={className} aria-hidden="true" />;
  if (type === 'UPI') return <Smartphone className={className} aria-hidden="true" />;
  return <Wallet className={className} aria-hidden="true" />;
}

export default function PaymentMethodsPage() {
  const { data: methods, isLoading, isError, refetch } = usePaymentMethods();
  const setDefault = useSetDefaultPaymentMethod();
  const removeMethod = useRemovePaymentMethod();

  /**
   * Removal is confirmed rather than immediate.
   *
   * Previously a single click deleted a method with no confirmation — a
   * destructive, irreversible action behind an unlabelled trash icon.
   */
  const [pendingRemoval, setPendingRemoval] = useState<PaymentMethodDTO | null>(null);

  const confirmRemoval = async () => {
    if (!pendingRemoval) return;
    try {
      await removeMethod.mutateAsync(pendingRemoval.id);
      setPendingRemoval(null);
    } catch {
      // The mutation surfaced a toast; the dialog stays open so the user can
      // retry rather than being left unsure whether it worked.
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Payment methods</h1>
        <Button size="sm" asChild>
          {/*
            Adding a card requires Stripe Elements mounted against a
            SetupIntent, which belongs in the checkout flow where the SDK is
            already loaded. Linking there is honest; a button that opens
            nothing — the previous behaviour — is not.
          */}
          <Link href={APP_ROUTES.CHECKOUT}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Add at checkout
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3" role="status" aria-busy="true" aria-live="polite">
          <span className="sr-only">Loading your payment methods…</span>
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="bg-muted h-24 animate-pulse rounded-lg" aria-hidden="true" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="text-destructive h-8 w-8" aria-hidden="true" />
            <p className="font-medium" role="alert">
              We couldn&apos;t load your payment methods
            </p>
            <p className="text-muted-foreground max-w-sm text-sm">
              This is usually temporary. Nothing has been changed.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : !methods || methods.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <CreditCard className="text-muted-foreground h-10 w-10 opacity-40" aria-hidden="true" />
            <p className="font-medium">No saved payment methods</p>
            <p className="text-muted-foreground max-w-sm text-sm">
              You can save a card while paying for an order, so your next checkout is faster.
            </p>
            <Button variant="outline" asChild>
              <Link href={APP_ROUTES.PRODUCTS}>Start shopping</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {methods.map((method) => {
            const expired = isExpired(method);
            const isMutating =
              (setDefault.isPending && setDefault.variables === method.id) ||
              (removeMethod.isPending && removeMethod.variables === method.id);

            return (
              <li key={method.id}>
                <Card className={method.isDefault ? 'border-primary' : ''}>
                  <CardContent className="flex flex-wrap items-center gap-4 pt-5">
                    <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                      <TypeIcon type={method.type} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{describePaymentMethod(method)}</p>
                        {method.isDefault && (
                          <Badge className="bg-success/15 text-success gap-1 text-xs">
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Default
                          </Badge>
                        )}
                        {expired && (
                          <Badge className="bg-destructive/15 text-destructive text-xs">
                            Expired
                          </Badge>
                        )}
                      </div>
                      {method.expiryMonth && method.expiryYear && (
                        <p className="text-muted-foreground text-sm">
                          Expires {String(method.expiryMonth).padStart(2, '0')}/
                          {String(method.expiryYear).slice(-2)}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-2">
                      {!method.isDefault && !expired && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDefault.mutate(method.id)}
                          disabled={isMutating}
                        >
                          {isMutating && setDefault.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                          )}
                          Set default
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setPendingRemoval(method)}
                        disabled={isMutating}
                        // An icon-only control needs a name that identifies
                        // *which* method it removes, not just "delete".
                        aria-label={`Remove ${describePaymentMethod(method)}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {/*
        A factual statement about where card details live, replacing the
        previous unconditional claim that this app stored them securely.
      */}
      <p className="text-muted-foreground mt-6 flex items-center justify-center gap-2 text-center text-xs">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Card details are held by our payment provider, Stripe. We only ever see the last four
        digits.
      </p>

      {/* ---------- Removal confirmation ---------- */}
      <Dialog open={pendingRemoval !== null} onOpenChange={(open) => !open && setPendingRemoval(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this payment method?</DialogTitle>
            <DialogDescription>
              {pendingRemoval
                ? `${describePaymentMethod(pendingRemoval)} will be removed from your account. Any orders already paid with it are unaffected.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setPendingRemoval(null)}
              disabled={removeMethod.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoval}
              disabled={removeMethod.isPending}
            >
              {removeMethod.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
