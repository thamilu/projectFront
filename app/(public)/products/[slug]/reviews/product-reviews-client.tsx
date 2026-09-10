'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { AlertCircle, Loader2, Pencil, RotateCcw, Star, ThumbsUp, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Avatar, AvatarFallback } from '@/shared/ui/atoms/avatar';
import { Button } from '@/shared/ui/atoms/button';
import { Input } from '@/shared/ui/atoms/input';
import { Textarea } from '@/shared/ui/atoms/textarea';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { ConfirmDialog } from '@/shared/ui/molecules/ConfirmDialog';
import { useReviews } from '@/features/reviews';
import { APP_ROUTES } from '@/shared/routes';
import type { Review } from '@/features/reviews';
import type { ProductDTO } from '@/domains/catalog/contracts/catalog.types';

interface ProductReviewsClientProps {
  product: ProductDTO;
}

const MIN_COMMENT_LENGTH = 10;

interface ReviewFormValues {
  rating: number;
  title: string;
  comment: string;
}

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
  return (
    <div className="flex gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`${cls} ${i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
}

function StarRatingInput({ value, onChange }: { value: number; onChange: (rating: number) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {Array.from({ length: 5 }, (_, i) => {
        const star = i + 1;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            onClick={() => onChange(star)}
            className="p-0.5"
          >
            <Star
              className={`h-7 w-7 transition-colors ${star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30 hover:text-yellow-400/60'}`}
            />
          </button>
        );
      })}
    </div>
  );
}

/** Shared form for both writing a new review and editing an existing one —
 * same fields, same validation, different submit label and initial values. */
function ReviewForm({
  initialValues,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: {
  initialValues?: ReviewFormValues;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (input: ReviewFormValues, callbacks: { onSuccess: () => void }) => void;
  onCancel?: () => void;
}) {
  const [rating, setRating] = useState(initialValues?.rating ?? 0);
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [comment, setComment] = useState(initialValues?.comment ?? '');

  const isValid = rating > 0 && comment.trim().length >= MIN_COMMENT_LENGTH;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;
    onSubmit(
      { rating, title: title.trim(), comment: comment.trim() },
      {
        onSuccess: () => {
          setRating(0);
          setTitle('');
          setComment('');
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-muted-foreground mb-1.5 text-xs">Your rating</p>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        maxLength={120}
        aria-label="Review title"
      />
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience with this product…"
        maxLength={2000}
        showCharCount
        aria-label="Review comment"
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={!isValid || isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export default function ProductReviewsClient({ product }: ProductReviewsClientProps) {
  const { status } = useSession();
  const {
    reviews,
    isLoading,
    isError,
    refetch,
    hasMore,
    isLoadingMore,
    loadMoreReviews,
    currentUserId,
    createReview,
    isCreating,
    updateReview,
    isUpdating,
    deleteReview,
    isDeleting,
    markHelpful,
  } = useReviews(String(product.id));
  const [helpfulVoted, setHelpfulVoted] = useState<Set<string>>(new Set());
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);

  const handleConfirmDelete = () => {
    if (!deletingReview) return;
    deleteReview(deletingReview.id, { onSuccess: () => setDeletingReview(null) });
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <nav className="text-muted-foreground mb-4 text-sm" aria-label="Breadcrumb">
        <Link href={`/products/${product.urlSlug || product.id}`} className="hover:text-foreground">
          &larr; Back to {product.name}
        </Link>
      </nav>
      <h1 className="mb-1 text-2xl font-bold">Customer Reviews</h1>
      <p className="text-muted-foreground mb-6 text-sm">{product.name}</p>

      {/* Summary — uses the product's real aggregate rating, not the
          (possibly paginated) review list below, since that's the
          authoritative count from the backend. */}
      {product.averageRating != null && (
        <div className="bg-muted/50 mb-8 flex flex-col items-center justify-center rounded-xl px-8 py-6">
          <p className="text-5xl font-extrabold">{product.averageRating.toFixed(1)}</p>
          <Stars rating={product.averageRating} size="lg" />
          <p className="text-muted-foreground mt-1 text-sm">
            {product.reviewCount ?? reviews.length} review{(product.reviewCount ?? reviews.length) === 1 ? '' : 's'}
          </p>
        </div>
      )}

      {status === 'authenticated' ? (
        <Card className="mb-8">
          <CardContent className="space-y-4 pt-5">
            <h2 className="font-semibold">Write a Review</h2>
            <ReviewForm submitLabel="Submit Review" isSubmitting={isCreating} onSubmit={createReview} />
          </CardContent>
        </Card>
      ) : status === 'unauthenticated' ? (
        <Card className="mb-8">
          <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-sm font-medium">Sign in to write a review</p>
            <Button asChild size="sm" variant="outline">
              <Link href={APP_ROUTES.AUTH_LOGIN}>Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {isLoading && (
        <div className="space-y-4" aria-label="Loading reviews">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-3 pt-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertCircle className="text-destructive h-8 w-8" aria-hidden="true" />
            <p className="font-semibold">Couldn&apos;t load reviews</p>
            <p className="text-muted-foreground text-sm">Please try again.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && reviews.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-semibold">No reviews yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Be the first to share your experience with this product.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => {
            const isOwnReview = !!currentUserId && review.userId === currentUserId;
            const isEditing = editingReviewId === review.id;

            return (
              <Card key={review.id}>
                <CardContent className="pt-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {(review.userName || '?').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">
                          {review.userName || 'Anonymous'}
                          {review.verified && (
                            <span className="text-muted-foreground ml-2 text-xs font-normal">
                              Verified purchase
                            </span>
                          )}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(review.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    {!isEditing && <Stars rating={review.rating} />}
                  </div>

                  {isEditing ? (
                    <ReviewForm
                      initialValues={{ rating: review.rating, title: review.title, comment: review.comment }}
                      submitLabel="Save Changes"
                      isSubmitting={isUpdating}
                      onCancel={() => setEditingReviewId(null)}
                      onSubmit={(input, { onSuccess }) =>
                        updateReview(
                          { reviewId: review.id, review: input },
                          {
                            onSuccess: () => {
                              onSuccess();
                              setEditingReviewId(null);
                            },
                          }
                        )
                      }
                    />
                  ) : (
                    <>
                      {review.title && <p className="font-semibold">{review.title}</p>}
                      <p className="text-muted-foreground mt-1 text-sm">{review.comment}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground h-7 gap-1 text-xs"
                          disabled={status !== 'authenticated' || helpfulVoted.has(review.id)}
                          onClick={() =>
                            markHelpful(review.id, {
                              onSuccess: () => setHelpfulVoted((prev) => new Set(prev).add(review.id)),
                            })
                          }
                        >
                          <ThumbsUp
                            className={`h-3.5 w-3.5 ${helpfulVoted.has(review.id) ? 'fill-current' : ''}`}
                            aria-hidden="true"
                          />{' '}
                          Helpful ({review.helpful ?? 0})
                        </Button>
                        {isOwnReview && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground h-7 gap-1 text-xs"
                              onClick={() => setEditingReviewId(review.id)}
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-destructive h-7 gap-1 text-xs"
                              onClick={() => setDeletingReview(review)}
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={loadMoreReviews} disabled={isLoadingMore} className="gap-2">
                {isLoadingMore && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {isLoadingMore ? 'Loading…' : 'Load more reviews'}
              </Button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deletingReview}
        onOpenChange={(open) => !open && setDeletingReview(null)}
        title="Delete review?"
        description="This permanently removes your review. This cannot be undone."
        confirmLabel="Delete"
        destructive
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
