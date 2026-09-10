'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import CheckoutSchema, { CheckoutFormValues } from '@/domains/order/contracts/checkout.schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/atoms/card';
import { Button } from '@/shared/ui/atoms/button';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/atoms/radio-group';
import { Label } from '@/shared/ui/atoms/label';
import Link from 'next/link';
import {
  CreditCard,
  Smartphone,
  Wallet,
  Calculator,
  Shield,
  ArrowLeft,
  MapPin,
  Clock,
  Truck,
  Loader2,
  PackageOpen,
} from 'lucide-react';
import { DeliveryDatePicker } from '@/shared/ui/molecules/date-picker';
import type { DeliverySelection } from '@/shared/ui/molecules/date-picker/types/delivery-picker.types';
import { useCart } from '@/features/cart/hooks/use-cart';
import { useAppliedCoupon } from '@/features/cart/hooks/use-applied-coupon';
import { calculateCartTotals } from '@/features/cart/utils/pricing-policy';
import { useAddresses } from '@/features/addresses/hooks/use-addresses';
import { formatAddressForOrder } from '@/features/addresses/utils/format-address';
import { useCreateOrder } from '@/features/orders/hooks/use-orders';
import { useCreatePaymentIntent } from '@/features/checkout/hooks/use-create-payment-intent';
import { StripePaymentForm } from '@/features/checkout/components/StripePaymentForm';
import { formatCurrency } from '@/shared/utils/formatters';
import { APP_ROUTES } from '@/shared/routes/app-routes';
import { env } from '@/env';
import type { OrderDTO } from '@/domains/order/contracts/order.types';

// Only 'card' is actually accepted today. Previously this list rendered
// four equal-weight, individually disabled cards ("Coming soon" repeated
// three times) — three-out-of-four visibly-disabled options on the one page
// where a customer is trying to complete a purchase added visual noise
// without adding a real choice. Now the one real method is shown as
// selected, and the rest are a single compact roadmap note (see below).
const COMING_SOON_PAYMENT_METHODS = [
  { id: 'upi' as const, name: 'UPI', icon: Smartphone },
  { id: 'wallet' as const, name: 'Digital Wallet', icon: Wallet },
  { id: 'emi' as const, name: 'EMI Options', icon: Calculator },
];

type CheckoutPhase = 'form' | 'payment';

export default function CheckoutPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<CheckoutPhase>('form');
  const [pendingOrder, setPendingOrder] = useState<OrderDTO | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentSetupError, setPaymentSetupError] = useState<string | null>(null);
  const [deliverySelection, setDeliverySelection] = useState<DeliverySelection | null>(null);

  const { cart, isLoading: isCartLoading } = useCart();
  const { addresses, isLoading: isAddressesLoading } = useAddresses();
  const createOrder = useCreateOrder({ redirectOnSuccess: false });
  const createPaymentIntent = useCreatePaymentIntent();

  const currency = env.NEXT_PUBLIC_DEFAULT_CURRENCY;
  const locale = env.NEXT_PUBLIC_DEFAULT_LOCALE;
  const cartItems = useMemo(() => cart?.items ?? [], [cart]);

  // The promo the shopper applied in the cart. Only the code travels with
  // them; the discount is whatever the server grants at order creation.
  const appliedCoupon = useAppliedCoupon();

  /**
   * Computed with the same `calculateCartTotals` the cart page uses, from the
   * same inputs, so the two screens can never display different figures for
   * the same basket — they previously did, because checkout showed a bare
   * `cart.totalAmount` with no tax, shipping or discount line at all.
   *
   * This is a display estimate. Once an order exists, `orderTotals` below
   * takes over and shows the server's authoritative breakdown.
   */
  const estimatedTotals = useMemo(
    () =>
      calculateCartTotals(
        cartItems.map((item) => ({ price: item.price, quantity: item.quantity })),
        // No client-side discount is assumed: the cart validated the code
        // server-side, but this page has not, so the estimate stays
        // conservative and the real figure appears once the order is placed.
        0
      ),
    [cartItems]
  );

  /** Authoritative breakdown, present only after the order has been created. */
  const orderTotals = useMemo(() => {
    if (!pendingOrder) return null;
    return {
      subtotal:
        pendingOrder.totalAmount -
        (pendingOrder.taxAmount ?? 0) -
        (pendingOrder.shippingAmount ?? 0) +
        (pendingOrder.discountAmount ?? 0),
      discount: pendingOrder.discountAmount ?? 0,
      shipping: pendingOrder.shippingAmount ?? 0,
      tax: pendingOrder.taxAmount ?? 0,
      total: pendingOrder.totalAmount,
    };
  }, [pendingOrder]);

  /** Whichever breakdown is currently authoritative for display. */
  const displayTotals = orderTotals ?? estimatedTotals;

  const defaultAddressId = useMemo(
    () => addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? '',
    [addresses]
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(CheckoutSchema),
    defaultValues: {
      shippingAddressId: '',
      billingSameAsShipping: true,
      paymentMethod: 'card',
      acceptTerms: false,
    },
  });

  // Populate the shipping address selection once addresses load — can't be
  // a static defaultValue above since addresses arrive asynchronously.
  useEffect(() => {
    if (defaultAddressId) {
      setValue('shippingAddressId', defaultAddressId, { shouldValidate: false });
    }
  }, [defaultAddressId, setValue]);

  useEffect(() => {
    import('@/platform/events')
      .then(({ eventBus }) => {
        eventBus.publish('CheckoutStarted', {
          cartId: cart?.id ? String(cart.id) : 'unknown',
          totalAmount: estimatedTotals.total,
        });
      })
      .catch(() => {});
    // Deliberately keyed on the cart id alone: this is a funnel event that
    // must fire once per checkout, not on every total recalculation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.id]);

  const shippingAddressId = watch('shippingAddressId');
  const billingSameAsShipping = watch('billingSameAsShipping');
  const billingAddressId = watch('billingAddressId');

  const onSubmit = async (data: CheckoutFormValues) => {
    const shippingAddress = addresses.find((a) => a.id === data.shippingAddressId);
    if (!shippingAddress) {
      toast.error('Please select a shipping address');
      return;
    }
    const billingAddress = data.billingSameAsShipping
      ? shippingAddress
      : addresses.find((a) => a.id === data.billingAddressId);

    const deliveryNote = deliverySelection
      ? `Requested delivery: ${deliverySelection.date}${
          deliverySelection.timeSlotLabel ? ` (${deliverySelection.timeSlotLabel})` : ''
        }`
      : undefined;

    setPaymentSetupError(null);

    let order: OrderDTO;
    try {
      order = await createOrder.mutateAsync({
        shippingAddress: formatAddressForOrder(shippingAddress),
        billingAddress: billingAddress ? formatAddressForOrder(billingAddress) : undefined,
        phone: shippingAddress.phone,
        notes: [deliveryNote, data.notes].filter(Boolean).join(' | ') || undefined,
        // The code the shopper applied in the cart. Sending it here is what
        // closes the gap where a promo was shown, then silently dropped.
        couponCode: appliedCoupon.code ?? undefined,
      });
    } catch {
      // useCreateOrder's own onError already surfaced a toast.
      return;
    }

    setPendingOrder(order);
    await setUpPayment(order);
  };

  const setUpPayment = async (order: OrderDTO) => {
    try {
      // Only the order id is sent. The amount, currency and description are
      // all derived server-side from the stored order — see
      // features/checkout/api/payment-api.ts for why this must not carry a
      // client-supplied figure.
      const intent = await createPaymentIntent.mutateAsync({ orderId: order.id });
      setClientSecret(intent.clientSecret);
      setPhase('payment');
    } catch (err) {
      // The order already exists at this point — surfaced as a retryable
      // error rather than a toast, since simply trying again shouldn't mean
      // placing a second, duplicate order.
      setPaymentSetupError(
        err instanceof Error ? err.message : 'Could not set up payment for this order.'
      );
      setPhase('payment');
    }
  };

  const handlePaymentSuccess = () => {
    if (!pendingOrder) return;
    import('@/platform/events')
      .then(({ eventBus }) => {
        eventBus.publish('OrderPlaced', {
          orderId: String(pendingOrder.id),
          totalAmount: pendingOrder.totalAmount,
          items: cartItems.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
        });
      })
      .catch(() => {});
    // The promo has been redeemed against this order; leaving it in session
    // storage would re-apply it to the shopper's next basket.
    appliedCoupon.clear();

    toast.success('Payment successful — your order is confirmed!');
    router.push(APP_ROUTES.ORDER_DETAIL(String(pendingOrder.id)));
  };

  if (isCartLoading || isAddressesLoading) {
    return (
      <div className="bg-background flex min-h-dvh items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" aria-label="Loading checkout" />
      </div>
    );
  }

  if (cartItems.length === 0 && phase === 'form') {
    return (
      <div className="bg-background flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <PackageOpen className="text-muted-foreground h-12 w-12" aria-hidden="true" />
        <h1 className="text-xl font-semibold">Your cart is empty</h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          Add items to your cart before checking out.
        </p>
        <Button asChild>
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-dvh">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/cart">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Link>
        </Button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-6">
            <div>
              <h1 className="mb-2 text-2xl font-semibold tracking-normal sm:text-3xl">Checkout</h1>
              <p className="text-muted-foreground">Complete your purchase securely</p>
            </div>

            {phase === 'form' && (
              <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Shipping Address */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {addresses.length === 0 ? (
                      <div className="bg-muted/30 rounded-lg border p-4 text-sm">
                        <p className="mb-2">You don&apos;t have any saved addresses yet.</p>
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/account/addresses">Add an address</Link>
                        </Button>
                      </div>
                    ) : (
                      <RadioGroup
                        value={shippingAddressId}
                        onValueChange={(value) =>
                          setValue('shippingAddressId', value, { shouldValidate: true })
                        }
                        // Without a name, a screen reader announces this only
                        // as "radio group" with no indication of what is being
                        // chosen — WCAG 1.3.1 / 4.1.2.
                        aria-label="Shipping address"
                        aria-invalid={errors.shippingAddressId ? true : undefined}
                        aria-describedby={
                          errors.shippingAddressId ? 'shipping-address-error' : undefined
                        }
                      >
                        {addresses.map((address) => (
                          <Label
                            key={address.id}
                            htmlFor={`shipping-${address.id}`}
                            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${
                              shippingAddressId === address.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <RadioGroupItem
                              value={address.id}
                              id={`shipping-${address.id}`}
                              className="mt-1"
                            />
                            <span className="text-sm">
                              <span className="font-medium">
                                {address.name} · {address.type}
                              </span>
                              <br />
                              {address.line1}
                              {address.line2 ? `, ${address.line2}` : ''}
                              <br />
                              {address.city}, {address.state} {address.pincode}
                            </span>
                          </Label>
                        ))}
                      </RadioGroup>
                    )}
                    {/*
                      role="alert" makes the validation message an announced
                      status change. Previously these were plain paragraphs
                      with no programmatic link to the control, so a screen
                      reader user who submitted with no address selected heard
                      nothing at all — WCAG 3.3.1 / 4.1.3.
                    */}
                    {errors.shippingAddressId && (
                      <p
                        id="shipping-address-error"
                        role="alert"
                        className="text-destructive text-sm"
                      >
                        {errors.shippingAddressId.message}
                      </p>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/account/addresses">Manage addresses</Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* Delivery Schedule */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Delivery Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DeliveryDatePicker
                      onChange={(_date, selection) => setDeliverySelection(selection ?? null)}
                      onConfirm={(selection) => setDeliverySelection(selection)}
                      currencySymbol={env.NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL}
                    />
                  </CardContent>
                </Card>

                {/* Payment Method Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Payment Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="border-primary bg-primary/5 rounded-lg border p-4"
                      aria-label="Selected payment method: Credit/Debit Card"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="text-primary h-5 w-5 shrink-0" aria-hidden="true" />
                        <div>
                          <p className="font-medium">Credit/Debit Card</p>
                          <p className="text-muted-foreground text-sm">
                            Visa, MasterCard, American Express — via Stripe
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span>More payment methods coming soon:</span>
                      {COMING_SOON_PAYMENT_METHODS.map((method) => (
                        <span key={method.id} className="inline-flex items-center gap-1">
                          <method.icon className="h-3.5 w-3.5" aria-hidden="true" />
                          {method.name}
                        </span>
                      ))}
                    </p>

                    <input type="hidden" {...register('paymentMethod')} value="card" />
                  </CardContent>
                </Card>

                {/* Billing Address */}
                <Card>
                  <CardHeader>
                    <CardTitle>Billing Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="sameAsShipping"
                        className="border-input mt-1 h-4 w-4 rounded"
                        {...register('billingSameAsShipping')}
                      />
                      <Label htmlFor="sameAsShipping" className="text-sm">
                        Same as shipping address
                      </Label>
                    </div>

                    {!billingSameAsShipping && (
                      <RadioGroup
                        value={billingAddressId}
                        onValueChange={(value) =>
                          setValue('billingAddressId', value, { shouldValidate: true })
                        }
                        aria-label="Billing address"
                        aria-invalid={errors.billingAddressId ? true : undefined}
                        aria-describedby={
                          errors.billingAddressId ? 'billing-address-error' : undefined
                        }
                      >
                        {addresses.map((address) => (
                          <Label
                            key={address.id}
                            htmlFor={`billing-${address.id}`}
                            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${
                              billingAddressId === address.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <RadioGroupItem
                              value={address.id}
                              id={`billing-${address.id}`}
                              className="mt-1"
                            />
                            <span className="text-sm">
                              <span className="font-medium">
                                {address.name} · {address.type}
                              </span>
                              <br />
                              {address.line1}
                              {address.line2 ? `, ${address.line2}` : ''}
                              <br />
                              {address.city}, {address.state} {address.pincode}
                            </span>
                          </Label>
                        ))}
                      </RadioGroup>
                    )}
                    {errors.billingAddressId && (
                      <p
                        id="billing-address-error"
                        role="alert"
                        className="text-destructive mt-2 text-sm"
                      >
                        {errors.billingAddressId.message}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <div className="flex items-start gap-2">
                  <input
                    id="acceptTerms"
                    type="checkbox"
                    className="border-input mt-1 h-4 w-4 rounded"
                    aria-invalid={errors.acceptTerms ? true : undefined}
                    aria-describedby={errors.acceptTerms ? 'accept-terms-error' : undefined}
                    {...register('acceptTerms')}
                  />
                  <Label htmlFor="acceptTerms" className="text-sm">
                    {/*
                      next/link, not a bare anchor: an <a href> here triggers a
                      full page load that discards the in-progress checkout
                      form — losing the shopper's selections at the exact
                      moment they are trying to complete a purchase.
                    */}
                    I agree to the{' '}
                    <Link href="/terms" className="underline">
                      Terms
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
                {errors.acceptTerms && (
                  <p id="accept-terms-error" role="alert" className="text-destructive text-sm">
                    {errors.acceptTerms.message}
                  </p>
                )}
              </form>
            )}

            {phase === 'payment' && pendingOrder && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment — Order {pendingOrder.orderNumber}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {clientSecret ? (
                    <StripePaymentForm
                      clientSecret={clientSecret}
                      returnUrl={
                        typeof window !== 'undefined'
                          ? `${window.location.origin}${APP_ROUTES.ORDER_DETAIL(String(pendingOrder.id))}`
                          : ''
                      }
                      onSuccess={handlePaymentSuccess}
                    />
                  ) : (
                    <div className="space-y-4">
                      <p role="alert" className="text-destructive text-sm">
                        {paymentSetupError ?? 'Could not set up payment for this order.'}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Your order has already been placed as {pendingOrder.orderNumber}. You can
                        retry setting up payment, or view the order and pay from there later.
                      </p>
                      <div className="flex gap-2">
                        <Button onClick={() => setUpPayment(pendingOrder)}>Retry payment setup</Button>
                        <Button variant="outline" asChild>
                          <Link href={APP_ROUTES.ORDER_DETAIL(String(pendingOrder.id))}>
                            View order
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <aside className="h-fit space-y-6 lg:sticky lg:top-24" aria-label="Checkout summary">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className="font-medium">{item.product.name}</span>
                      <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                    </div>
                    <span>{formatCurrency(item.subtotal, currency, locale)}</span>
                  </div>
                ))}

                <hr />

                {/*
                  The full breakdown, matching the cart line for line. Checkout
                  previously showed a single bare total with no tax, shipping or
                  discount row, so the two screens disagreed about the same
                  basket and any applied promo simply disappeared.
                */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(displayTotals.subtotal, currency, locale)}</span>
                </div>

                {displayTotals.discount > 0 && (
                  <div className="text-success flex justify-between text-sm">
                    <span>{appliedCoupon.code ? `Promo (${appliedCoupon.code})` : 'Discount'}</span>
                    <span>-{formatCurrency(displayTotals.discount, currency, locale)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className={displayTotals.shipping === 0 ? 'text-success' : undefined}>
                    {displayTotals.shipping === 0
                      ? 'FREE'
                      : formatCurrency(displayTotals.shipping, currency, locale)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(displayTotals.tax, currency, locale)}</span>
                </div>

                <hr />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(displayTotals.total, currency, locale)}</span>
                </div>

                {/*
                  Says which figure the shopper is looking at. Before the order
                  exists these are estimates from the same policy the cart uses;
                  afterwards they are the server's own numbers.
                */}
                <p className="text-muted-foreground text-xs">
                  {orderTotals
                    ? 'Confirmed by our server for this order.'
                    : 'Estimated. Final tax, shipping and any promo are confirmed when you place the order.'}
                </p>

                {appliedCoupon.code && !orderTotals && (
                  <p className="text-muted-foreground text-xs">
                    Promo code <span className="font-medium">{appliedCoupon.code}</span> will be
                    applied when your order is placed.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-3">
                  <Clock className="text-success h-5 w-5" aria-hidden="true" />
                  <div>
                    <div className="font-medium">Expected Delivery</div>
                    <div className="text-muted-foreground text-sm">
                      {deliverySelection
                        ? `${deliverySelection.date}${deliverySelection.timeSlotLabel ? ` · ${deliverySelection.timeSlotLabel}` : ''}`
                        : '3-5 business days'}
                    </div>
                  </div>
                </div>
                <div className="text-muted-foreground text-sm">
                  Your order will be processed within 24 hours
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Shield className="text-success h-5 w-5" aria-hidden="true" />
                  <span className="text-success font-medium">Secure Checkout</span>
                </div>
                <div className="text-muted-foreground space-y-1 text-sm">
                  <div>Payments processed by Stripe</div>
                  <div>PCI DSS compliant — card details never touch our servers</div>
                  <div>Money-back guarantee</div>
                </div>
              </CardContent>
            </Card>

            {phase === 'form' && (
              <>
                <Button
                  type="submit"
                  form="checkout-form"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting || createOrder.isPending || createPaymentIntent.isPending}
                >
                  {createOrder.isPending
                    ? 'Placing order...'
                    : createPaymentIntent.isPending
                      ? 'Setting up payment...'
                      : `Continue to Payment — ${formatCurrency(displayTotals.total, currency, locale)}`}
                </Button>

                <p className="text-muted-foreground text-center text-xs">
                  By placing your order, you agree to our Terms of Service and Privacy Policy
                </p>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
