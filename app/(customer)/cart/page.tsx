'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/atoms/card';
import { Button } from '@/shared/ui/atoms/button';
import { Input } from '@/shared/ui/atoms/input';
import { Badge } from '@/shared/ui/atoms/badge';
import { Progress } from '@/shared/ui/atoms/progress';
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  AlertTriangle,
  CircleCheck,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { APP_ROUTES } from '@/shared/routes';
import { useCart } from '@/features/cart/hooks/use-cart';
import { useValidateCoupon } from '@/features/cart/hooks/use-validate-coupon';
import { useSavedForLater } from '@/features/cart/hooks/use-saved-for-later';
import { useAppliedCoupon } from '@/features/cart/hooks/use-applied-coupon';
import { calculateCartTotals } from '@/features/cart/utils/pricing-policy';
import type { CouponValidationResult } from '@/features/cart/api/coupon-api';
import { CouponValidationError } from '@/features/cart/api/coupon-api';
import { formatCurrency } from '@/shared/utils/formatters';
import { env } from '@/env';

interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  inStock: boolean;
}

export default function CartPage() {
  const { status } = useSession();
  const router = useRouter();

  const { cart, isLoading, updateCartItem, removeCartItem, addToCartAsync } = useCart();

  const [promoCode, setPromoCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  // Guards the one-shot re-validation of a carried-over code, so a rejected
  // code is not retried on every render.
  const [hasRevalidated, setHasRevalidated] = useState(false);
  const [restoringProductId, setRestoringProductId] = useState<number | null>(null);
  const validateCoupon = useValidateCoupon();

  // Persisted per device and shared with checkout — see the hook docblocks for
  // why neither may live in component state.
  const savedForLater = useSavedForLater();
  const persistedCoupon = useAppliedCoupon();

  // Previously hardcoded to Intl.NumberFormat('en-IN', { currency: 'INR' })
  // regardless of deployment config — inconsistent with the checkout page
  // one step later in the same flow, which already reads the configured
  // currency from env.NEXT_PUBLIC_DEFAULT_CURRENCY. A non-INR deployment
  // would have shown INR here and the real configured currency at checkout.
  const currency = useMemo(
    () => ({
      format: (amount: number) =>
        formatCurrency(amount, env.NEXT_PUBLIC_DEFAULT_CURRENCY, env.NEXT_PUBLIC_DEFAULT_LOCALE),
    }),
    []
  );

  const cartItems = useMemo((): CartItem[] => {
    const items = (cart?.items || []) as any[];
    return items.map((item) => ({
      id: item.id,
      productId: item.product?.id || 0,
      name: item.product?.name || '',
      price: item.price,
      quantity: item.quantity,
      image: item.product?.imageUrl || item.product?.images?.[0] || '',
      inStock: (item.product?.stockQuantity ?? 0) > 0,
    }));
  }, [cart]);

  // Compute totals using pricing policy utility, applying the real,
  // server-validated discount amount (if any coupon has been applied).
  const totals = useMemo(() => {
    return calculateCartTotals(cartItems, appliedCoupon?.discountAmount ?? 0);
  }, [cartItems, appliedCoupon]);

  /**
   * Validate a promo code and, on success, persist it for the rest of the
   * shopping session so checkout applies the same discount. Only the code is
   * stored — the amount is always re-derived server-side.
   */
  const applyCouponCode = useCallback(
    (rawCode: string, options: { silent?: boolean } = {}) => {
      const code = rawCode.trim();
      if (!code) return;

      validateCoupon.mutate(
        { couponCode: code, cartTotal: totals.subtotal },
        {
          onSuccess: (result) => {
            setAppliedCoupon(result);
            setCouponError(null);
            persistedCoupon.apply(result.couponCode);
            if (!options.silent) {
              toast.success('Promo applied', { description: result.message });
            }
          },
          onError: (error) => {
            setAppliedCoupon(null);

            const message =
              error instanceof Error ? error.message : 'Could not apply this promo code.';
            setCouponError(message);

            // A 4xx means the code itself is wrong or no longer eligible, so
            // it is dropped. A 5xx means the service is down — the code is
            // kept so it can be retried rather than silently forgotten.
            const isUserCorrectable =
              error instanceof CouponValidationError ? error.isUserCorrectable : true;
            if (isUserCorrectable) {
              persistedCoupon.clear();
            }

            if (!options.silent) toast.error(message);
          },
        }
      );
    },
    [persistedCoupon, totals.subtotal, validateCoupon]
  );

  const handleApplyCoupon = () => applyCouponCode(promoCode);

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
    setPromoCode('');
    persistedCoupon.clear();
    toast.success('Promo code removed');
  };

  /**
   * Re-validate a code carried over from an earlier visit (or from checkout)
   * exactly once, against the *current* subtotal — a code that qualified for a
   * larger basket may no longer meet its minimum after items were removed.
   * Silent, because the shopper did not just perform an action.
   */
  useEffect(() => {
    if (!persistedCoupon.isReady || !persistedCoupon.code) return;
    if (appliedCoupon || validateCoupon.isPending || hasRevalidated) return;
    if (totals.subtotal <= 0) return;

    setHasRevalidated(true);
    setPromoCode(persistedCoupon.code);
    applyCouponCode(persistedCoupon.code, { silent: true });
  }, [
    persistedCoupon.isReady,
    persistedCoupon.code,
    appliedCoupon,
    validateCoupon.isPending,
    hasRevalidated,
    totals.subtotal,
    applyCouponCode,
  ]);

  const hasOutOfStock = useMemo(() => {
    return cartItems.some((i) => !i.inStock);
  }, [cartItems]);

  /**
   * Cart → saved.
   *
   * Persist FIRST, remove SECOND. If the write fails (blocked storage, quota),
   * the cart is left untouched and the shopper is told — the previous version
   * removed the item first and pushed it into component state, so a failure or
   * a refresh destroyed it.
   */
  const moveToSaved = (id: number) => {
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;

    const persisted = savedForLater.save({
      productId: item.productId,
      quantity: item.quantity,
      name: item.name,
      price: item.price,
      image: item.image,
    });

    if (!persisted) {
      toast.error('Could not save this item', {
        description: 'Your browser is blocking storage, so the item was left in your cart.',
      });
      return;
    }

    removeCartItem(id);
    toast.success('Saved for later', { description: item.name });
  };

  /**
   * Saved → cart.
   *
   * Add FIRST, drop from the saved list SECOND, and roll the removal back if
   * the add fails. The previous version dropped the item from the saved list
   * and reported success without calling any cart mutation at all, so the item
   * disappeared from both places.
   */
  const restoreFromSaved = async (productId: number) => {
    const item = savedForLater.find(productId);
    if (!item) return;

    setRestoringProductId(productId);
    try {
      await addToCartAsync({ productId: item.productId, quantity: item.quantity, silent: true });
      savedForLater.remove(productId);
      toast.success('Moved back to cart', { description: item.name });
    } catch {
      // The item is still in the saved list because removal has not happened
      // yet; restoreEntry covers the case where a concurrent tab removed it.
      savedForLater.restoreEntry(item);
      toast.error('Could not move this item to your cart', {
        description: 'It is still saved for later. Please try again.',
      });
    } finally {
      setRestoringProductId(null);
    }
  };

  const discardSaved = (productId: number, name: string) => {
    savedForLater.remove(productId);
    toast.success('Removed from saved items', { description: name });
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="text-muted-foreground mx-auto h-12 w-12 animate-spin" />
          <p className="text-muted-foreground mt-4">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
          <h2 className="mb-4 text-2xl font-bold">Please sign in to view your cart</h2>
          <Button
            onClick={() => router.push(`${APP_ROUTES.AUTH_LOGIN}?callbackUrl=${APP_ROUTES.CART}`)}
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <ShoppingBag className="h-6 w-6 shrink-0" />
          <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">Shopping Cart</h1>
          <Badge variant="secondary">{totals.totalItems} items</Badge>
        </div>

        {cartItems.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center sm:p-12">
              <ShoppingBag className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
              <h2 className="mb-2 text-xl font-semibold">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">
                Looks like you haven't added any items to your cart yet.
              </p>
              <Button asChild>
                <Link href={APP_ROUTES.PRODUCTS}>Continue Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
            {/* Cart Items */}
            <div className="min-w-0 space-y-4">
              {hasOutOfStock && (
                <Card className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                  <CardContent className="flex items-start gap-3 p-4">
                    <AlertTriangle className="mt-0.5 h-5 w-5" />
                    <div>
                      <p className="font-medium">Some items are out of stock</p>
                      <p className="text-sm">Remove out-of-stock items to proceed to checkout.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      {/* Product Image */}
                      <div
                        className="bg-muted relative h-24 w-24 shrink-0 overflow-hidden rounded-md"
                        aria-label={`${item.name} image`}
                      >
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        ) : null}
                      </div>

                      {/* Product Info */}
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-base leading-5 font-semibold sm:text-lg">
                          {item.name}
                        </h3>
                        <p className="text-muted-foreground mt-1 text-sm">SKU: #{item.productId}</p>

                        {!item.inStock && (
                          <Badge variant="destructive" className="mt-2">
                            Out of Stock
                          </Badge>
                        )}

                        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="text-xl font-bold">{currency.format(item.price)}</div>

                          {/* Quantity Controls */}
                          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            <div className="flex items-center rounded-md border">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  updateCartItem({ itemId: item.id, quantity: item.quantity - 1 })
                                }
                                disabled={item.quantity <= 1}
                                className="h-8 w-8 p-0"
                                aria-label={`Decrease quantity of ${item.name}`}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="min-w-12 px-3 py-1 text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  updateCartItem({ itemId: item.id, quantity: item.quantity + 1 })
                                }
                                className="h-8 w-8 p-0"
                                aria-label={`Increase quantity of ${item.name}`}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCartItem(item.id)}
                              className="text-destructive hover:text-destructive"
                              aria-label={`Remove ${item.name} from cart`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveToSaved(item.id)}
                              className="whitespace-nowrap"
                            >
                              Save for later
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {savedForLater.items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Saved for later</CardTitle>
                    {/*
                      Stated plainly rather than implied: the list is stored on
                      this device because the backend exposes no saved-items
                      resource yet. Letting a shopper assume it follows them to
                      their phone would be the more damaging default.
                    */}
                    <p className="text-muted-foreground text-sm">
                      Saved on this device. Prices are confirmed when you move an item back to
                      your cart.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {savedForLater.items.map((item) => {
                      const isRestoring = restoringProductId === item.productId;
                      return (
                        <div
                          key={`saved-${item.productId}`}
                          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">{item.name}</p>
                            <p className="text-muted-foreground text-sm">
                              {currency.format(item.price)}
                              {item.quantity > 1 ? ` · Qty ${item.quantity}` : ''}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() => restoreFromSaved(item.productId)}
                              disabled={isRestoring}
                            >
                              {isRestoring && (
                                <Loader2
                                  className="mr-2 h-4 w-4 animate-spin"
                                  aria-hidden="true"
                                />
                              )}
                              {isRestoring ? 'Moving…' : 'Move to cart'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => discardSaved(item.productId, item.name)}
                              disabled={isRestoring}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <aside className="h-fit space-y-6 lg:sticky lg:top-24" aria-label="Cart summary">
              {/* Promo Code */}
              <Card>
                <CardHeader>
                  <CardTitle id="promo-heading">Promo Code</CardTitle>
                </CardHeader>
                <CardContent>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{appliedCoupon.couponCode}</p>
                        <p className="text-muted-foreground truncate text-sm">
                          {appliedCoupon.message}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveCoupon}
                        aria-label={`Remove promo code ${appliedCoupon.couponCode}`}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value);
                          // Clear a stale rejection as soon as the shopper
                          // edits the field, so the message always describes
                          // what is currently in the input.
                          if (couponError) setCouponError(null);
                        }}
                        onKeyDown={(e) => {
                          // The field sits outside a <form>, so Enter would
                          // otherwise do nothing — a common and avoidable
                          // friction point.
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                        aria-label="Promo code"
                        aria-invalid={couponError ? true : undefined}
                        aria-describedby={couponError ? 'promo-error' : undefined}
                        disabled={validateCoupon.isPending}
                      />
                      <Button
                        variant="outline"
                        onClick={handleApplyCoupon}
                        disabled={validateCoupon.isPending || !promoCode.trim()}
                      >
                        {validateCoupon.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                            Checking…
                          </>
                        ) : (
                          'Apply'
                        )}
                      </Button>
                    </div>
                  )}

                  {/*
                    role="alert" so the rejection reason is announced. Without
                    it a screen-reader user pressing Apply hears nothing at all
                    — WCAG 3.3.1 / 4.1.3.
                  */}
                  {couponError && (
                    <p id="promo-error" role="alert" className="text-destructive mt-2 text-sm">
                      {couponError}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{currency.format(totals.subtotal)}</span>
                  </div>
                  {totals.discount > 0 && appliedCoupon && (
                    <div className="text-success flex justify-between">
                      <span>Promo ({appliedCoupon.couponCode})</span>
                      <span>-{currency.format(totals.discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className={totals.shipping === 0 ? 'text-success' : ''}>
                      {totals.shipping === 0 ? 'FREE' : currency.format(totals.shipping)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{currency.format(totals.tax)}</span>
                  </div>

                  <hr />

                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{currency.format(totals.total)}</span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Estimated. Final shipping and tax are confirmed at checkout.
                  </p>

                  <div className="space-y-2">
                    <Progress
                      value={totals.freeShipProgress}
                      className="h-2"
                      aria-label="Free shipping progress"
                    />
                    <p className="text-muted-foreground text-sm">
                      {totals.shipping === 0 ? (
                        'You have unlocked free shipping!'
                      ) : (
                        <>Add {currency.format(totals.freeShipRemaining)} more for free shipping</>
                      )}
                    </p>
                  </div>

                  {hasOutOfStock ? (
                    <Button className="w-full" size="lg" disabled aria-disabled="true">
                      Proceed to Checkout
                    </Button>
                  ) : (
                    <Button className="w-full" size="lg" asChild>
                      <Link href={APP_ROUTES.CHECKOUT}>Proceed to Checkout</Link>
                    </Button>
                  )}

                  <Button variant="outline" className="w-full" asChild>
                    <Link href={APP_ROUTES.PRODUCTS}>Continue Shopping</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Trust Indicators */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CircleCheck className="text-success h-4 w-4" aria-hidden="true" />
                      <span>Secure SSL checkout</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CircleCheck className="text-success h-4 w-4" aria-hidden="true" />
                      <span>30-day return policy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CircleCheck className="text-success h-4 w-4" aria-hidden="true" />
                      <span>Free shipping on eligible orders</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
