'use client';

/**
 * The customer's own reviews.
 *
 * [CORRECTNESS] This page previously rendered a `MOCK_REVIEWS` constant — two
 * invented reviews for "Wireless Earbuds Pro" and "Running Shoes X200", shown
 * identically to every signed-in user. There was no edit, no delete, no
 * pagination, and the `MOCK_REVIEWS.length === 0` empty state was unreachable
 * because the constant had length two.
 *
 * It now reads the customer's real reviews and supports editing and deleting
 * them — a review is public content attached to a person's name, so being able
 * to correct or withdraw one is a baseline expectation, not a nice-to-have.
 */

import { useState } from 'react';
import Link from 'next/link';
import { Star, Package, AlertTriangle, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Button } from '@/shared/ui/atoms/button';
import { Badge } from '@/shared/ui/atoms/badge';
import { Input } from '@/shared/ui/atoms/input';
import { Label } from '@/shared/ui/atoms/label';
import { Textarea } from '@/shared/ui/atoms/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/atoms/dialog';
import { useMyReviews } from '@/features/reviews/hooks/use-reviews';
import type { MyReview } from '@/features/reviews/types/review.types';
import { APP_ROUTES } from '@/shared/routes';
import { formatDate } from '@/shared/utils/formatters';

const MAX_RATING = 5;

export default function AccountReviewsPage() {
  const [page, setPage] = useState(0);
  const {
    reviews,
    totalPages,
    totalElements,
    isLoading,
    isFetching,
    isError,
    refetch,
    deleteReview,
    isDeleting,
    updateReview,
    isUpdating,
  } = useMyReviews(page);

  const [editing, setEditing] = useState<MyReview | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<MyReview | null>(null);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My reviews</h1>
        {totalElements > 0 && (
          <p className="text-muted-foreground text-sm">
            {totalElements} review{totalElements === 1 ? '' : 's'} published
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4" role="status" aria-busy="true" aria-live="polite">
          <span className="sr-only">Loading your reviews…</span>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-muted h-36 animate-pulse rounded-lg" aria-hidden="true" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="text-destructive h-8 w-8" aria-hidden="true" />
            <p className="font-medium" role="alert">
              We couldn&apos;t load your reviews
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Star className="text-muted-foreground h-10 w-10 opacity-40" aria-hidden="true" />
            <p className="font-medium">You haven&apos;t written any reviews yet</p>
            <p className="text-muted-foreground max-w-sm text-sm">
              Reviews help other shoppers decide. You can leave one for anything you&apos;ve
              received.
            </p>
            <Button variant="outline" asChild>
              <Link href={APP_ROUTES.ORDERS}>View past orders</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <ul className="space-y-4">
            {reviews.map((review) => (
              <li key={review.id}>
                <Card>
                  <CardContent className="pt-5">
                    <div className="mb-3 flex items-start gap-3">
                      <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                        <Package className="text-muted-foreground h-5 w-5" aria-hidden="true" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={APP_ROUTES.PRODUCT_DETAIL(review.product.slug)}
                          className="font-medium hover:underline"
                        >
                          {review.product.name}
                        </Link>
                        <p className="text-muted-foreground text-xs">
                          <time dateTime={String(review.createdAt)}>
                            {formatDate(String(review.createdAt))}
                          </time>
                        </p>
                      </div>

                      {review.verified && (
                        <Badge variant="outline" className="shrink-0 text-xs">
                          Verified purchase
                        </Badge>
                      )}
                    </div>

                    <StarRating rating={review.rating} />

                    <p className="mt-2 font-semibold">{review.title}</p>
                    <p className="text-muted-foreground mt-1 text-sm">{review.comment}</p>

                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing(review)}
                        aria-label={`Edit your review of ${review.product.name}`}
                      >
                        <Pencil className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setPendingDeletion(review)}
                        aria-label={`Delete your review of ${review.product.name}`}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav className="mt-6 flex items-center justify-between" aria-label="Reviews pagination">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || isFetching}
              >
                Previous
              </Button>
              <span className="text-muted-foreground text-sm" aria-live="polite">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || isFetching}
              >
                Next
              </Button>
            </nav>
          )}
        </>
      )}

      <EditReviewDialog
        review={editing}
        isSaving={isUpdating}
        onClose={() => setEditing(null)}
        onSave={(values) => {
          if (!editing) return;
          updateReview(
            { reviewId: editing.id, review: values },
            { onSuccess: () => setEditing(null) }
          );
        }}
      />

      <Dialog
        open={pendingDeletion !== null}
        onOpenChange={(open) => !open && setPendingDeletion(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this review?</DialogTitle>
            <DialogDescription>
              {pendingDeletion
                ? `Your review of ${pendingDeletion.product.name} will be removed permanently. This can't be undone.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setPendingDeletion(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={() => {
                if (!pendingDeletion) return;
                deleteReview(pendingDeletion.id, {
                  onSuccess: () => setPendingDeletion(null),
                });
              }}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              Delete review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Parts
// ============================================================

/**
 * Star rating display.
 *
 * The stars are decorative; the rating is conveyed once, textually, to
 * assistive technology. Five separately-announced icons would otherwise read as
 * meaningless repetition.
 */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`Rated ${rating} out of ${MAX_RATING}`}>
      {Array.from({ length: MAX_RATING }, (_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${
            index < rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/** Edit dialog. Uncontrolled inputs seeded per review via `key`. */
function EditReviewDialog({
  review,
  isSaving,
  onClose,
  onSave,
}: {
  review: MyReview | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (values: { rating: number; title: string; comment: string }) => void;
}) {
  const [rating, setRating] = useState(review?.rating ?? MAX_RATING);

  return (
    <Dialog open={review !== null} onOpenChange={(open) => !open && onClose()}>
      {/* Remounting on review change resets every field, so the previous
          review's text can never leak into the next one's form. */}
      <DialogContent key={review?.id}>
        <DialogHeader>
          <DialogTitle>Edit your review</DialogTitle>
          <DialogDescription>{review?.product.name}</DialogDescription>
        </DialogHeader>

        {review && (
          <form
            id="edit-review-form"
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              onSave({
                rating,
                title: String(form.get('title') ?? '').trim(),
                comment: String(form.get('comment') ?? '').trim(),
              });
            }}
          >
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Rating</legend>
              <div className="flex gap-1">
                {Array.from({ length: MAX_RATING }, (_, index) => {
                  const value = index + 1;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      aria-pressed={rating === value}
                      aria-label={`${value} star${value === 1 ? '' : 's'}`}
                      className="focus-visible:ring-ring rounded p-1 focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          value <= rating ? 'fill-warning text-warning' : 'text-muted-foreground/40'
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="space-y-1.5">
              <Label htmlFor="review-title">Title</Label>
              <Input
                id="review-title"
                name="title"
                defaultValue={review.title}
                maxLength={120}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="review-comment">Your review</Label>
              <Textarea
                id="review-comment"
                name="comment"
                defaultValue={review.comment}
                rows={5}
                maxLength={2000}
                required
              />
            </div>
          </form>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" form="edit-review-form" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
