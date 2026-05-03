'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCartStore, selectCartItems, selectCartTotal } from '@/store/cart-store';
import { formatCurrency } from '@/lib/utils';
import { ShoppingBag } from 'lucide-react';

/**
 * Cart Preview Component - Mini Cart
 * Enterprise standard: Hover preview of cart contents
 */
export default function CartPreview() {
  const items = useCartStore(selectCartItems);
  const total = useCartStore(selectCartTotal);

  if (!items.length) {
    return (
      <div className="p-6 text-center">
        <ShoppingBag className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
        <p className="text-muted-foreground mb-4 text-sm">Your cart is empty</p>
        <Button asChild variant="default" className="w-full">
          <Link href="/products">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-95">
      {/* Cart Items */}
      <div className="max-h-100 overflow-y-auto">
        {items.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="hover:bg-accent/50 flex gap-3 border-b p-4 transition-colors"
          >
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-100">
              <Image
                src={item.product.imageUrl || '/images/placeholder.png'}
                alt={item.product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/products/${item.product.id}`}
                className="line-clamp-2 text-sm font-medium hover:underline"
              >
                {item.product.name}
              </Link>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Qty: {item.quantity}</span>
                <span className="text-sm font-semibold">
                  {formatCurrency(item.product.price * item.quantity)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {items.length > 3 && (
          <div className="text-muted-foreground p-3 text-center text-xs">
            +{items.length - 3} more items
          </div>
        )}
      </div>

      {/* Subtotal and Actions */}
      <div className="bg-muted/30 border-t p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium">Subtotal:</span>
          <span className="text-lg font-bold">{formatCurrency(total)}</span>
        </div>

        <div className="flex flex-col gap-2">
          <Button asChild className="w-full" size="sm">
            <Link href="/cart">View Cart</Link>
          </Button>
          <Button asChild variant="outline" className="w-full" size="sm">
            <Link href="/checkout">Checkout</Link>
          </Button>
        </div>

        <p className="text-muted-foreground mt-2 text-center text-xs">
          Free shipping on orders over ₹500
        </p>
      </div>
    </div>
  );
}
