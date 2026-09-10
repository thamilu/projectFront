'use client';

/**
 * Return / refund request.
 *
 * [CORRECTNESS] This page previously simulated its own success. `onSubmit`
 * ignored its form data, awaited a 1,200ms `setTimeout`, showed *"Return
 * request submitted! You'll hear from us within 24 hours."* and navigated away.
 * Nothing was ever sent anywhere, so a customer believed a refund was in
 * progress while the business held no record of it — a consumer-protection
 * exposure rather than merely a bug.
 *
 * It now submits to the real returns endpoint and, additionally:
 *
 * - **Verifies eligibility before showing the form.** The order must exist,
 *   belong to the customer, be delivered, and fall inside the returns window.
 *   Previously the route parameter was used only to print an id in a subheading.
 * - **Supports per-item selection.** A multi-item order rarely needs returning
 *   in full; the previous form could only express "all of it".
 * - **Shows the reference number** the customer can quote to support, instead
 *   of a toast that disappears.
 */

import { use, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { RotateCcw, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/atoms/card';
import { Label } from '@/shared/ui/atoms/label';
import { Textarea } from '@/shared/ui/atoms/textarea';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/atoms/radio-group';
import { Checkbox } from '@/shared/ui/atoms/checkbox';
import { toast } from 'sonner';
import { APP_ROUTES } from '@/shared/routes';
import { useOrder, useCreateReturnRequest } from '@/features/orders/hooks/use-orders';
import { OrderStatus } from '@/domains/order/contracts/order.types';
import { formatCurrency } from '@/shared/utils/formatters';
import { env } from '@/env';

// ============================================================
// 1. POLICY
// ============================================================

/**
 * Returns window, in days from delivery.
 *
 * Configurable rather than hardcoded in copy: the previous page asserted "30
 * days" in a static banner with no code path that enforced it, so the stated
 * policy and the (nonexistent) behaviour could not disagree — because there was
 * no behaviour. Now the same constant drives both the copy and the check.
 */
const RETURN_WINDOW_DAYS = 30;

const RETURN_REASONS = [
  { value: 'DEFECTIVE', label: 'Item is defective / not working' },
  { value: 'WRONG_ITEM', label: 'Wrong item received' },
  { value: 'NOT_AS_DESCRIBED', label: 'Item not as described' },
  { value: 'SIZE_ISSUE', label: 'Size / fit issue' },
  { value: 'CHANGED_MIND', label: 'Changed my mind' },
  { value: 'OTHER', label: 'Other' },
] as const;

/** Reasons where free-text detail is genuinely needed to process the claim. */
const REASONS_REQUIRING_DETAIL = new Set(['DEFECTIVE', 'NOT_AS_DESCRIBED', 'OTHER']);

// ============================================================
// 2. SCHEMA
// ============================================================

/**
 * `details` is conditionally required.
 *
 * The previous schema declared `.min(10).optional().or(z.literal(''))`, which
 * meant the field was labelled "optional" yet rejected anything under ten
 * characters — a customer typing "broken" got an error on a field they were
 * told they could skip.
 */
const returnSchema = z
  .object({
    reason: z.string().min(1, 'Please select a reason for your return.'),
    details: z.string().max(1_000, 'Please keep details under 1,000 characters.').optional(),
    itemIds: z.array(z.number()).min(1, 'Select at least one item to return.'),
  })
  .superRefine((value, ctx) => {
    if (REASONS_REQUIRING_DETAIL.has(value.reason) && (value.details ?? '').trim().length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['details'],
        message: 'Please describe the issue in at least 10 characters so we can process this.',
      });
    }
  });

type ReturnValues = z.infer<typeof returnSchema>;

// ============================================================
// 3. ELIGIBILITY
// ============================================================

type Eligibility =
  | { eligible: true; daysRemaining: number }
  | { eligible: false; reason: string };

/**
 * Decide whether this order may be returned.
 *
 * Evaluated client-side for the *user experience* only — to explain the
 * situation rather than let someone submit into a rejection. The backend
 * remains authoritative and re-checks on submit.
 */
function assessEligibility(
  status: OrderStatus | undefined,
  deliveredAt: string | undefined
): Eligibility {
  if (status !== OrderStatus.DELIVERED) {
    return {
      eligible: false,
      reason:
        'This order has not been delivered yet. You can request a return once it arrives, or cancel it from the order page.',
    };
  }

  if (!deliveredAt) {
    // Missing delivery date: fail open rather than blocking a legitimate
    // request over incomplete data. The backend will make the final call.
    return { eligible: true, daysRemaining: RETURN_WINDOW_DAYS };
  }

  const deliveredTime = Date.parse(deliveredAt);
  if (!Number.isFinite(deliveredTime)) {
    return { eligible: true, daysRemaining: RETURN_WINDOW_DAYS };
  }

  const elapsedDays = Math.floor((Date.now() - deliveredTime) / (24 * 60 * 60 * 1_000));
  const daysRemaining = RETURN_WINDOW_DAYS - elapsedDays;

  if (daysRemaining <= 0) {
    return {
      eligible: false,
      reason: `The ${RETURN_WINDOW_DAYS}-day return window for this order has closed. Please contact support if you believe this is an error.`,
    };
  }

  return { eligible: true, daysRemaining };
}

// ============================================================
// 4. PAGE
// ============================================================

export default function OrderReturnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const orderId = Number(id);
  const isValidId = Number.isInteger(orderId) && orderId > 0;

  const { data: order, isLoading, isError } = useOrder(isValidId ? orderId : 0);
  const createReturn = useCreateReturnRequest(orderId);

  const [submittedReference, setSubmittedReference] = useState<string | null>(null);

  const currency = env.NEXT_PUBLIC_DEFAULT_CURRENCY;
  const locale = env.NEXT_PUBLIC_DEFAULT_LOCALE;

  const eligibility = useMemo(
    () => assessEligibility(order?.orderStatus, order?.updatedAt),
    [order?.orderStatus, order?.updatedAt]
  );

  const {
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReturnValues>({
    resolver: zodResolver(returnSchema),
    defaultValues: { reason: '', details: '', itemIds: [] },
  });

  const selectedReason = watch('reason');
  const selectedItemIds = watch('itemIds');

  const toggleItem = (itemId: number, checked: boolean) => {
    const next = checked
      ? [...selectedItemIds, itemId]
      : selectedItemIds.filter((existing) => existing !== itemId);
    setValue('itemIds', next, { shouldValidate: true });
  };

  const onSubmit = async (values: ReturnValues) => {
    try {
      const result = await createReturn.mutateAsync({
        reason: values.reason,
        details: values.details?.trim() || undefined,
        // Omitted when every item is selected, so the backend records a
        // whole-order return rather than an enumerated equivalent.
        itemIds:
          order && values.itemIds.length === order.items.length ? undefined : values.itemIds,
      });

      // Shown on the page rather than in a toast: a reference number the
      // customer may need to quote must not vanish after four seconds.
      setSubmittedReference(result.reference ?? `#${result.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Could not submit your return request. Please try again.'
      );
    }
  };

  // ---------- Invalid route parameter ----------
  if (!isValidId) {
    return (
      <StatusPanel
        tone="error"
        title="We couldn't find that order"
        body="The order reference in this link isn't valid."
        action={{ href: APP_ROUTES.ORDERS, label: 'View your orders' }}
      />
    );
  }

  // ---------- Loading ----------
  if (isLoading) {
    return (
      <div
        className="container mx-auto max-w-2xl px-4 py-10"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="sr-only">Loading your order…</span>
        <div className="bg-muted mb-3 h-8 w-2/5 animate-pulse rounded" aria-hidden="true" />
        <div className="bg-muted mb-8 h-4 w-1/4 animate-pulse rounded" aria-hidden="true" />
        <div className="bg-muted h-64 animate-pulse rounded-lg" aria-hidden="true" />
      </div>
    );
  }

  // ---------- Not found / not yours ----------
  if (isError || !order) {
    return (
      <StatusPanel
        tone="error"
        title="We couldn't load this order"
        body="It may no longer exist, or it isn't associated with your account."
        action={{ href: APP_ROUTES.ORDERS, label: 'View your orders' }}
      />
    );
  }

  // ---------- Submitted ----------
  if (submittedReference) {
    return (
      <StatusPanel
        tone="success"
        title="Return request received"
        body={`We've logged your request as ${submittedReference}. Our team will review it and email you within 24 hours. Refunds are processed within 5–7 business days of approval.`}
        action={{ href: APP_ROUTES.ORDER_DETAIL(String(orderId)), label: 'Back to order' }}
      />
    );
  }

  // ---------- Not eligible ----------
  if (!eligibility.eligible) {
    return (
      <StatusPanel
        tone="warning"
        title="This order can't be returned"
        body={eligibility.reason}
        action={{ href: APP_ROUTES.ORDER_DETAIL(String(orderId)), label: 'Back to order' }}
      />
    );
  }

  // ---------- Form ----------
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold">Return / Refund Request</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Order {order.orderNumber} · {order.items.length} item
        {order.items.length === 1 ? '' : 's'}
      </p>

      <Card className="border-warning/40 bg-warning/10 mb-5">
        <CardContent className="flex items-start gap-3 pt-5">
          <RotateCcw className="text-warning mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm">
            You have <strong>{eligibility.daysRemaining} day
            {eligibility.daysRemaining === 1 ? '' : 's'}</strong> left to return this order. Refunds
            are processed within 5–7 business days of approval.
          </p>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* ---------- Items ---------- */}
        <Card>
          <CardHeader>
            <CardTitle id="items-heading">What are you returning?</CardTitle>
            <CardDescription>
              Select the items you&apos;d like to return. You can return part of an order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <fieldset aria-describedby={errors.itemIds ? 'items-error' : undefined}>
              <legend className="sr-only">Items to return</legend>
              <div className="space-y-2">
                {order.items.map((item) => {
                  const checked = selectedItemIds.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                        checked ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => toggleItem(item.id, value === true)}
                        aria-label={`Return ${item.product.name}`}
                      />
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="block truncate font-medium">{item.product.name}</span>
                        <span className="text-muted-foreground">
                          Qty {item.quantity} · {formatCurrency(item.subtotal, currency, locale)}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {errors.itemIds && (
              <p id="items-error" role="alert" className="text-destructive mt-2 text-sm">
                {errors.itemIds.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* ---------- Reason ---------- */}
        <Card>
          <CardHeader>
            <CardTitle>Why are you returning?</CardTitle>
            <CardDescription>
              A reason helps us process your request faster and improve the listing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <RadioGroup
                value={selectedReason}
                onValueChange={(value) => setValue('reason', value, { shouldValidate: true })}
                aria-label="Reason for return"
                aria-invalid={errors.reason ? true : undefined}
                aria-describedby={errors.reason ? 'reason-error' : undefined}
              >
                <div className="space-y-2">
                  {RETURN_REASONS.map((reason) => (
                    <label
                      key={reason.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                        selectedReason === reason.value
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <RadioGroupItem value={reason.value} />
                      <span className="text-sm">{reason.label}</span>
                    </label>
                  ))}
                </div>
              </RadioGroup>

              {errors.reason && (
                <p id="reason-error" role="alert" className="text-destructive mt-2 text-sm">
                  {errors.reason.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="return-details">
                Additional details
                {/* The requirement is stated up front rather than discovered
                    on submit — the previous field said "optional" and then
                    rejected short input. */}
                {REASONS_REQUIRING_DETAIL.has(selectedReason) ? (
                  <span className="text-destructive"> (required)</span>
                ) : (
                  <span className="text-muted-foreground"> (optional)</span>
                )}
              </Label>
              <Textarea
                id="return-details"
                {...register('details')}
                placeholder="Describe the issue in more detail…"
                rows={4}
                aria-invalid={errors.details ? true : undefined}
                aria-describedby={errors.details ? 'details-error' : undefined}
              />
              {errors.details && (
                <p id="details-error" role="alert" className="text-destructive text-sm">
                  {errors.details.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={createReturn.isPending}>
            {createReturn.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {createReturn.isPending ? 'Submitting…' : 'Submit return request'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ============================================================
// 5. SHARED PANEL
// ============================================================

/**
 * Terminal state panel — success, ineligible, or not found.
 *
 * One component for all three so the three outcomes cannot drift apart in
 * spacing, heading level or focus behaviour.
 */
function StatusPanel({
  tone,
  title,
  body,
  action,
}: {
  tone: 'success' | 'warning' | 'error';
  title: string;
  body: string;
  action: { href: string; label: string };
}) {
  const Icon = tone === 'success' ? CheckCircle2 : AlertTriangle;
  const toneClass =
    tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-destructive';

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <Icon className={`h-10 w-10 ${toneClass}`} aria-hidden="true" />
          {/* The status is announced, so a screen-reader user learns the
              outcome without having to hunt for it. */}
          <h1 className="text-xl font-semibold" role="status">
            {title}
          </h1>
          <p className="text-muted-foreground max-w-md text-sm">{body}</p>
          <Button asChild>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
