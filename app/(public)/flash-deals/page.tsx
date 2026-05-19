'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, Clock, ShoppingCart, Zap } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Progress } from '@/shared/ui/atoms/progress';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';

const FLASH_DEALS = [
  { id: '1', name: 'TWS Earphones Z9', slug: 'tws-earphones-z9', originalPrice: 3999, flashPrice: 1299, discount: 68, stock: 12, totalStock: 50, endsAt: Date.now() + 2 * 60 * 60 * 1000 },
  { id: '2', name: 'Smart LED Bulb 4-Pack', slug: 'smart-led-bulb', originalPrice: 1499, flashPrice: 499, discount: 67, stock: 5, totalStock: 30, endsAt: Date.now() + 1 * 60 * 60 * 1000 },
  { id: '3', name: 'Portable Power Bank 20K', slug: 'power-bank-20k', originalPrice: 2999, flashPrice: 999, discount: 67, stock: 20, totalStock: 100, endsAt: Date.now() + 3 * 60 * 60 * 1000 },
];

function CountdownTimer({ endsAt }: { endsAt: number }) {
  const [timeLeft, setTimeLeft] = useState(endsAt - Date.now());

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(endsAt - Date.now()), 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  const h = Math.floor(timeLeft / 3600000);
  const m = Math.floor((timeLeft % 3600000) / 60000);
  const s = Math.floor((timeLeft % 60000) / 1000);

  const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');

  return (
    <div className="flex items-center gap-1.5">
      <Clock className="h-3.5 w-3.5 text-red-500" />
      <div className="flex gap-1 font-mono text-sm font-bold text-red-600">
        <span className="rounded bg-red-100 px-1.5 py-0.5 dark:bg-red-900">{pad(h)}</span>
        <span className="self-center">:</span>
        <span className="rounded bg-red-100 px-1.5 py-0.5 dark:bg-red-900">{pad(m)}</span>
        <span className="self-center">:</span>
        <span className="rounded bg-red-100 px-1.5 py-0.5 dark:bg-red-900">{pad(s)}</span>
      </div>
    </div>
  );
}

export default function FlashDealsPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-xl bg-red-100 dark:bg-red-900">
          <Zap className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">⚡ Flash Deals</h1>
          <p className="text-sm text-muted-foreground">Limited time. Limited stock. Grab them before they're gone!</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FLASH_DEALS.map(deal => {
          const soldPct = Math.round(((deal.totalStock - deal.stock) / deal.totalStock) * 100);
          return (
            <Card key={deal.id} className="group overflow-hidden border-red-200 shadow-sm transition-shadow hover:shadow-lg dark:border-red-900">
              <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950">
                <Flame className="h-16 w-16 text-red-200 dark:text-red-800" />
                <Badge className="absolute left-3 top-3 bg-red-600 text-white">
                  {deal.discount}% OFF
                </Badge>
                <Badge variant="outline" className="absolute right-3 top-3 border-red-300 text-xs text-red-600">
                  Only {deal.stock} left!
                </Badge>
              </div>
              <CardContent className="p-4">
                <div className="mb-2">
                  <CountdownTimer endsAt={deal.endsAt} />
                </div>
                <Link href={APP_ROUTES.PRODUCT_DETAIL(deal.slug)} className="line-clamp-1 font-semibold hover:text-primary hover:underline">
                  {deal.name}
                </Link>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-lg font-bold text-red-600">₹{deal.flashPrice.toLocaleString('en-IN')}</span>
                  <span className="text-sm text-muted-foreground line-through">₹{deal.originalPrice.toLocaleString('en-IN')}</span>
                </div>
                {/* Stock progress */}
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Selling fast</span>
                    <span>{soldPct}% sold</span>
                  </div>
                  <Progress value={soldPct} className="h-1.5 bg-red-100 [&>div]:bg-red-500" />
                </div>
                <Button size="sm" variant="destructive" className="mt-3 w-full gap-2">
                  <ShoppingCart className="h-4 w-4" /> Grab Deal
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
