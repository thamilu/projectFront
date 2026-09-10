'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { getStripe } from '@/infrastructure/payments/stripe-client';

interface StripePaymentFormProps {
  clientSecret: string;
  /** Absolute URL Stripe redirects back to for payment methods that require
   * an off-site step (certain bank redirects, some 3DS challenges) —
   * `redirect: 'if_required'` below keeps the common case on this page, but
   * Stripe still needs a valid return_url for the cases it can't avoid. */
  returnUrl: string;
  onSuccess: () => void;
}

/**
 * Mounts Stripe's own PaymentElement inside an Elements provider scoped to
 * one payment intent's clientSecret. Card data is tokenized directly inside
 * Stripe's iframe — this component (and this app) never sees a card number,
 * expiry, or CVC. See checkout.schema.ts's docblock for why that replaced
 * the plain <Input> card fields this page used to have.
 */
export function StripePaymentForm({ clientSecret, returnUrl, onSuccess }: StripePaymentFormProps) {
  // Memoized so getStripe()'s cached Promise<StripeClient|null> isn't
  // re-requested on every render — Elements expects a stable reference.
  const stripePromise = useMemo(() => getStripe(), []);

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance: { theme: 'stripe' } }}
    >
      <PaymentElementForm returnUrl={returnUrl} onSuccess={onSuccess} />
    </Elements>
  );
}

function PaymentElementForm({
  returnUrl,
  onSuccess,
}: Pick<StripePaymentFormProps, 'returnUrl' | 'onSuccess'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      // Keeps the user on this page for the common case (a card that
      // doesn't need 3DS) instead of a full-page redirect round-trip;
      // Stripe still redirects on its own for payment methods/challenges
      // that genuinely require it.
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(
        error.message ?? 'Your payment could not be processed. Please try again.'
      );
      setIsSubmitting(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
      onSuccess();
      return;
    }

    // Any other status (e.g. requires_action) means Stripe is handling an
    // off-site redirect itself — nothing further to do here.
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <PaymentElement />

      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Button type="submit" disabled={!stripe || !elements || isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Processing payment...
          </>
        ) : (
          'Pay now'
        )}
      </Button>
    </form>
  );
}
