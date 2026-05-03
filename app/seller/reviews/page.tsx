'use client';

import { Star, TrendingUp, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const REVIEWS = [
  { id: '1', product: 'Wireless Earbuds Pro', customer: 'Priya S.', rating: 5, comment: 'Amazing product! Fast shipping.', date: '2026-02-22' },
  { id: '2', product: 'Cotton Kurta Set', customer: 'Rahul M.', rating: 4, comment: 'Good quality. Slightly large sizing.', date: '2026-02-18' },
  { id: '3', product: 'Steel Water Bottle', customer: 'Sneha K.', rating: 3, comment: 'Product is okay. Packaging could be better.', date: '2026-02-14' },
  { id: '4', product: 'Leather Wallet', customer: 'Arjun P.', rating: 5, comment: 'Premium quality! Exactly as described.', date: '2026-02-10' },
];

const DIST = [75, 15, 5, 3, 2]; // % for 5→1

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );
}

export default function SellerReviewsPage() {
  const avg = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Customer Reviews</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="text-center">
              <p className="text-5xl font-extrabold">{avg}</p>
              <Stars rating={Math.round(Number(avg))} />
              <p className="mt-1 text-xs text-muted-foreground">{REVIEWS.length} reviews</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((s, i) => (
                <div key={s} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-muted-foreground">{s}</span>
                  <Progress value={DIST[i]} className="h-1.5 flex-1" />
                  <span className="w-6 text-right text-muted-foreground">{DIST[i]}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center gap-3"><TrendingUp className="h-5 w-5 text-green-600" /><div><p className="font-bold">98%</p><p className="text-xs text-muted-foreground">Positive reviews</p></div></div>
            <div className="flex items-center gap-3"><MessageSquare className="h-5 w-5 text-blue-600" /><div><p className="font-bold">{REVIEWS.length}</p><p className="text-xs text-muted-foreground">Total reviews this month</p></div></div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {REVIEWS.map(review => (
          <Card key={review.id}>
            <CardContent className="pt-5">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7"><AvatarFallback className="text-xs">{review.customer.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                  <div>
                    <p className="text-sm font-medium">{review.customer}</p>
                    <p className="text-xs text-muted-foreground">{review.product}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Stars rating={review.rating} />
                  <p className="text-xs text-muted-foreground">{new Date(review.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{review.comment}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
