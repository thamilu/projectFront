'use client';

import { use } from 'react';
import { Star, ThumbsUp, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Avatar, AvatarFallback } from '@/shared/ui/atoms/avatar';
import { Progress } from '@/shared/ui/atoms/progress';
import { Button } from '@/shared/ui/atoms/button';

const MOCK_REVIEWS = [
  { id: '1', author: 'Priya S.', rating: 5, date: '2026-02-15', title: 'Absolutely love it!', body: 'Great build quality and amazing sound. Worth every penny.', helpful: 24 },
  { id: '2', author: 'Arjun M.', rating: 4, date: '2026-02-10', title: 'Good value', body: 'Connection is stable, battery lasts 6h. Could use better bass.', helpful: 12 },
  { id: '3', author: 'Sneha K.', rating: 5, date: '2026-01-30', title: 'Premium feel', body: 'Feels very premium. The noise cancellation is excellent.', helpful: 9 },
  { id: '4', author: 'Rahul P.', rating: 3, date: '2026-01-18', title: 'Average', body: 'Sound is OK for the price. Not the best but acceptable.', helpful: 5 },
];

const RATING_DIST = [5, 0, 30, 60, 5]; // pct for 5→1

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`${cls} ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );
}

export default function ProductReviewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const avg = (MOCK_REVIEWS.reduce((s, r) => s + r.rating, 0) / MOCK_REVIEWS.length).toFixed(1);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold">Customer Reviews</h1>
      <p className="mb-6 text-sm text-muted-foreground capitalize">{slug.replace(/-/g, ' ')}</p>

      {/* Summary */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row">
        <div className="flex flex-col items-center justify-center rounded-xl bg-muted/50 px-8 py-6">
          <p className="text-5xl font-extrabold">{avg}</p>
          <Stars rating={Math.round(Number(avg))} size="lg" />
          <p className="mt-1 text-sm text-muted-foreground">{MOCK_REVIEWS.length} reviews</p>
        </div>
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((star, i) => (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-4 text-right text-muted-foreground">{star}</span>
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <Progress value={RATING_DIST[i]} className="h-2 flex-1" />
              <span className="w-8 text-right text-muted-foreground">{RATING_DIST[i]}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Reviews */}
      <div className="space-y-4">
        {MOCK_REVIEWS.map(review => (
          <Card key={review.id}>
            <CardContent className="pt-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{review.author.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{review.author}</p>
                    <p className="text-xs text-muted-foreground">{new Date(review.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                <Stars rating={review.rating} />
              </div>
              <p className="font-semibold">{review.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>
              <div className="mt-3 flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground">
                  <ThumbsUp className="h-3.5 w-3.5" /> Helpful ({review.helpful})
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
