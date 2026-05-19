'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/atoms/card';
import { Button } from '@/shared/ui/atoms/button';
import { Input } from '@/shared/ui/atoms/input';
import { Badge } from '@/shared/ui/atoms/badge';
import { Minus, Plus, Trash2, ShoppingBag, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/core/client';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082/api/v1';

interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  inStock: boolean;
}

interface CartResponse {
  items: CartItem[];
  subtotal: number;
  total: number;
}

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [savedForLater, setSavedForLater] = useState<CartItem[]>([]);
  const currency = useMemo(
    () => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }),
    []
  );

  // Fetch cart data
  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      fetchCart();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status, session]);

  const fetchCart = async () => {
    if (!session?.accessToken) return;

    setLoading(true);
    try {
      const { data } = await apiClient.get<CartResponse | { data: CartResponse }>(`/cart`);

      // Handle both cases: an un-wrapped CartResponse, or wrapped inside { data: ... }
      const cartData: CartResponse = 'data' in data && data.data ? data.data : (data as CartResponse);
      setCartItems(cartData.items || []);
    } catch (error: any) {
      console.error('Failed to fetch cart', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (id: number, newQuantity: number) => {
    if (newQuantity < 1 || !session?.accessToken) return;

    try {
      await apiClient.put(`/cart/items/${id}?quantity=${newQuantity}`);

      setCartItems((items) =>
        items.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item))
      );
    } catch (error: any) {
      console.error('Failed to update quantity', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update quantity');
    }
  };

  const removeItem = async (id: number) => {
    if (!session?.accessToken) return;

    const prev = cartItems;
    const removed = prev.find((i) => i.id === id);

    // Optimistic update
    setCartItems((items) => items.filter((item) => item.id !== id));

    try {
      await apiClient.delete(`/cart/items/${id}`);

      if (removed) {
        toast('Removed from cart', {
          description: removed.name,
          action: {
            label: 'Undo',
            onClick: async () => {
              setCartItems(prev);
              // Re-add to cart via API
              await apiClient.post(`/cart/items`, { productId: removed.productId, quantity: removed.quantity });
            },
          },
        });
      }
    } catch (error: any) {
      // Revert on failure
      setCartItems(prev);
      console.error('Failed to remove item', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove item');
    }
  };

  const moveToSaved = (id: number) => {
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;
    setCartItems((items) => items.filter((i) => i.id !== id));
    setSavedForLater((items) => [item, ...items]);
    toast.success('Saved for later', { description: item.name });
  };

  const restoreFromSaved = async (id: number) => {
    const item = savedForLater.find((i) => i.id === id);
    if (!item || !session?.accessToken) return;

    setSavedForLater((items) => items.filter((i) => i.id !== id));

    // Re-add to cart via API
    try {
      await apiClient.post(`/cart/items`, { productId: item.productId, quantity: item.quantity });
      fetchCart(); // Refresh cart
      toast.success('Moved back to cart', { description: item.name });
    } catch (error) {
      setSavedForLater((items) => [item, ...items]); // Revert
      toast.error('Failed to move to cart');
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = appliedPromo === 'SAVE10' ? subtotal * 0.1 : 0;
  const shipping = subtotal > 50 ? 0 : 9.99;
  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * 0.08; // 8% tax
  const total = taxable + shipping + tax;

  const hasOutOfStock = cartItems.some((i) => !i.inStock);
  const freeShippingThreshold = 50;
  const freeShipRemaining = Math.max(0, freeShippingThreshold - subtotal);
  const freeShipProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Auth guard
  if (status === 'loading' || loading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="border-primary mx-auto h-12 w-12 animate-spin rounded-full border-b-2" />
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
          <Button onClick={() => router.push(`${APP_ROUTES.AUTH_LOGIN}?callbackUrl=${APP_ROUTES.CART}`)}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-2">
          <ShoppingBag className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <Badge variant="secondary" className="ml-2">
            {totalItems} items
          </Badge>
          <span className="sr-only" aria-live="polite">
            Cart contains {totalItems} items
          </span>
        </div>

        {cartItems.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
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
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="space-y-4 lg:col-span-2">
              {hasOutOfStock && (
                <Card>
                  <CardContent className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-amber-700">
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
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Product Image */}
                      <div
                        className="h-24 w-24 shrink-0 rounded-lg bg-linear-to-br from-gray-100 to-gray-200"
                        aria-label={`${item.name} image`}
                      />

                      {/* Product Info */}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold">{item.name}</h3>
                        <p className="text-muted-foreground">SKU: #{item.productId}</p>

                        {!item.inStock && (
                          <Badge variant="destructive" className="mt-2">
                            Out of Stock
                          </Badge>
                        )}

                        <div className="mt-4 flex items-center justify-between">
                          <div className="text-xl font-bold">{currency.format(item.price)}</div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center rounded-md border">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="h-8 w-8 p-0"
                                aria-label={`Decrease quantity of ${item.name}`}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="min-w-12 px-3 py-1 text-center">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="h-8 w-8 p-0"
                                aria-label={`Increase quantity of ${item.name}`}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="text-destructive hover:text-destructive"
                              aria-label={`Remove ${item.name} from cart`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveToSaved(item.id)}
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

              {savedForLater.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Saved for later</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {savedForLater.map((item) => (
                      <div key={`saved-${item.id}`} className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{item.name}</p>
                          <p className="text-muted-foreground text-sm">
                            {currency.format(item.price)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => restoreFromSaved(item.id)}>
                            Move to cart
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setSavedForLater((list) => list.filter((i) => i.id !== item.id))
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div className="h-fit space-y-6 lg:sticky lg:top-24">
              {/* Promo Code */}
              <Card>
                <CardHeader>
                  <CardTitle>Promo Code</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      aria-label="Promo code"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (!promoCode) return;
                        if (promoCode.toUpperCase() === 'SAVE10') {
                          setAppliedPromo('SAVE10');
                          toast.success('Promo applied', {
                            description: '10% discount applied to your order.',
                          });
                        } else {
                          setAppliedPromo(null);
                          toast.error('Invalid promo code');
                        }
                      }}
                    >
                      {appliedPromo ? 'Applied' : 'Apply'}
                    </Button>
                  </div>
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
                    <span>{currency.format(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Promo (SAVE10)</span>
                      <span>-{currency.format(discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? 'text-green-600' : ''}>
                      {shipping === 0 ? 'FREE' : currency.format(shipping)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{currency.format(tax)}</span>
                  </div>

                  <hr />

                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{currency.format(total)}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-muted h-2 overflow-hidden rounded">
                      <div
                        className="h-2 bg-green-600"
                        style={{ width: `${freeShipProgress}%` }}
                        aria-hidden
                      />
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {shipping === 0 ? (
                        'You have unlocked free shipping!'
                      ) : (
                        <>Add {currency.format(freeShipRemaining)} more for free shipping</>
                      )}
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    disabled={hasOutOfStock}
                    aria-disabled={hasOutOfStock}
                  >
                    Proceed to Checkout
                  </Button>

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
                      <span className="text-green-600">✓</span>
                      <span>Secure SSL checkout</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>30-day return policy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Free shipping on orders ₹50+</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
