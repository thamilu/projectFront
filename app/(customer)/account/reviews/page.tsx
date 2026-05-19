'use client';

import { Star, Package } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Badge } from '@/shared/ui/atoms/badge';
import Link from 'next/link';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';

interface Review {
  id: string;
  productName: string;
  productSlug: string;
  productImage: string;
  rating: number;
  title: string;
  body: string;
  date: string;
}

const MOCK_REVIEWS: Review[] = [
  { id: '1', productName: 'Wireless Earbuds Pro', productSlug: 'wireless-earbuds-pro', productImage: '', rating: 5, title: 'Excellent sound quality!', body: 'These earbuds are amazing. Crystal clear audio and great bass.', date: '2026-02-10' },
  { id: '2', productName: 'Running Shoes X200', productSlug: 'running-shoes-x200', productImage: '', rating: 4, title: 'Very comfortable', body: 'Lightweight and comfortable for long runs. Would recommend.', date: '2026-01-28' },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );
}

export default function AccountReviewsPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">My Reviews</h1>

      {MOCK_REVIEWS.length === 0 ? (
        <div className="mt-12 text-center text-muted-foreground">
          <Star className="mx-auto mb-3 h-10 w-10 opacity-40" />
          <p>You haven&apos;t written any reviews yet.</p>
          <Link href={APP_ROUTES.ORDERS} className="mt-3 inline-block text-sm text-primary hover:underline">
            View past orders to leave a review →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {MOCK_REVIEWS.map(review => (
            <Card key={review.id}>
              <CardContent className="pt-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <Link href={APP_ROUTES.PRODUCT_DETAIL(review.productSlug)} className="font-medium hover:underline">
                      {review.productName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{new Date(review.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <Badge variant="outline" className="ml-auto text-xs">Published</Badge>
                </div>
                <StarRating rating={review.rating} />
                <p className="mt-2 font-semibold">{review.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
