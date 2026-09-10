import { z } from 'zod';

/**
 * Card number/expiry/CVC fields were removed from this schema entirely —
 * they used to be collected as plain form inputs and were never actually
 * submitted anywhere (see the checkout page's prior TODO), but keeping them
 * in the schema/UI at all was a latent PCI-DSS risk: Stripe Elements exists
 * specifically so raw cardholder data never touches this frontend's own
 * form state or servers. Real card entry now goes through
 * features/checkout/components/StripePaymentForm.tsx, which mounts Stripe's
 * own PaymentElement — Stripe tokenizes the card directly in its iframe and
 * this app never sees the PAN/CVC at all.
 */
const CheckoutSchema = z
  .object({
    shippingAddressId: z.string().min(1, 'Please select a shipping address'),
    billingSameAsShipping: z.boolean().default(true),
    billingAddressId: z.string().optional(),
    // Only 'card' (via Stripe) is a real, working payment method today —
    // UPI/wallet/EMI have no backend integration and are shown disabled in
    // the UI rather than silently accepted here. See the infrastructure/
    // review's "incomplete Stripe checkout integration" finding.
    paymentMethod: z.literal('card').default('card'),
    notes: z.string().max(500).optional(),
    acceptTerms: z.boolean().refine((v) => v === true, { message: 'You must accept the terms' }),
  })
  .refine((data) => data.billingSameAsShipping || !!data.billingAddressId, {
    message: 'Please select a billing address',
    path: ['billingAddressId'],
  });

export type CheckoutFormValues = z.infer<typeof CheckoutSchema>;

export default CheckoutSchema;
