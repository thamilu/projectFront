'use client';

import { Button } from '@/shared/ui/atoms/button';
import { useCart } from '@/features/cart/hooks/use-cart';

const LABEL = 'Add to Cart';

interface AddToCartButtonProduct {
  id: number;
  title?: string;
  name?: string;
}

export function AddToCartButton({ product }: { product: AddToCartButtonProduct }) {
  const { addToCart, isAdding } = useCart();

  return (
    <Button
      size="sm"
      className="min-h-[44px] w-full"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        addToCart({ productId: product.id, quantity: 1 });
      }}
      disabled={isAdding}
      aria-label={`${LABEL} ${product?.title || product?.name || 'product'}`}
    >
      {LABEL}
    </Button>
  );
}
