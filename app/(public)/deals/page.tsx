'use client';

import Link from 'next/link';
import { Tag, Flame, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';

const DEALS = [
  { id: '1', name: 'Wireless Earbuds Pro', slug: 'wireless-earbuds-pro', category: 'Electronics', originalPrice: 4999, dealPrice: 2499, discount: 50, expires: 'Ends in 2 days' },
  { id: '2', name: 'Running Shoes X200', slug: 'running-shoes-x200', category: 'Footwear', originalPrice: 3999, dealPrice: 1999, discount: 50, expires: 'Ends in 5 days' },
  { id: '3', name: 'Cotton Kurta Set', slug: 'cotton-kurta-set', category: 'Fashion', originalPrice: 1499, dealPrice: 749, discount: 50, expires: 'Ends in 1 day' },
  { id: '4', name: 'Stainless Steel Bottle', slug: 'steel-bottle', category: 'Kitchen', originalPrice: 999, dealPrice: 399, discount: 60, expires: 'Ends in 3 days' },
  { id: '5', name: 'Yoga Mat Premium', slug: 'yoga-mat-premium', category: 'Sports', originalPrice: 1299, dealPrice: 649, discount: 50, expires: 'Ends in 4 days' },
  { id: '6', name: 'Leather Wallet', slug: 'leather-wallet', category: 'Accessories', originalPrice: 799, dealPrice: 299, discount: 63, expires: 'Ends in 6 days' },
];

export default function DealsPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900">
          <Tag className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Today's Deals</h1>
          <p className="text-sm text-muted-foreground">Hand-picked deals updated daily</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEALS.map(deal => (
          <Card key={deal.id} className="group overflow-hidden transition-shadow hover:shadow-lg">
            <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950">
              <ShoppingCart className="h-16 w-16 text-orange-200 dark:text-orange-800" />
              <Badge className="absolute left-3 top-3 bg-orange-600 text-white">
                {deal.discount}% OFF
              </Badge>
              <Badge variant="outline" className="absolute right-3 top-3 text-xs">
                {deal.expires}
              </Badge>
            </div>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{deal.category}</p>
              <Link href={APP_ROUTES.PRODUCT_DETAIL(deal.slug)} className="mt-1 line-clamp-1 font-semibold hover:text-primary hover:underline">
                {deal.name}
              </Link>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-lg font-bold text-orange-600">₹{deal.dealPrice.toLocaleString('en-IN')}</span>
                <span className="text-sm text-muted-foreground line-through">₹{deal.originalPrice.toLocaleString('en-IN')}</span>
              </div>
              <Button size="sm" className="mt-3 w-full">Add to Cart</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
