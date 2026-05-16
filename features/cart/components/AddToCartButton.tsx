"use client";

import { Button } from '@/components/ui/button';
import { useCartStore } from '@/features/cart/store/cart-store';

const LABEL = 'Add to Cart';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AddToCartButton({ product }: { product: any }) {
  const addToCart = useCartStore((s) => s.addItem);

  return (
    <Button
      size="sm"
      className="w-full min-h-[44px]"
      onClick={() => addToCart(product)}
      aria-label={`${LABEL} ${product?.title || 'product'}`}
    >
      {LABEL}
    </Button>
  );
}
