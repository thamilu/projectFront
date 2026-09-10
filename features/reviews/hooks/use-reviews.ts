/**
 * Reviews Hook
 * @module features/reviews/hooks/use-reviews
 */

import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { reviewsApi } from '../api/reviews-api';
import type { CreateReviewDto, Review, UpdateReviewDto } from '../types/review.types';

const REVIEWS_PAGE_SIZE = 10;

export function useReviews(productId: string) {
  const { data: session } = useSession();
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<Review[]>([]);

  // A different product means a different review list — start over rather
  // than showing the previous product's accumulated pages while the new
  // page 0 loads.
  useEffect(() => {
    setPage(0);
    setItems([]);
  }, [productId]);

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['reviews', productId, page],
    queryFn: () => reviewsApi.getReviews(productId, { page, size: REVIEWS_PAGE_SIZE }),
    enabled: !!productId,
  });

  // react-query v5 dropped useQuery's onSuccess/onError — accumulating pages
  // client-side has to happen as an effect on `data` instead.
  useEffect(() => {
    if (!data) return;
    setItems((prev) => (page === 0 ? data.content : [...prev, ...data.content]));
  }, [data, page]);

  const hasMore = data ? !data.last : false;
  const isLoadingMore = isFetching && page > 0;

  const loadMoreReviews = useCallback(() => {
    if (hasMore && !isFetching) setPage((p) => p + 1);
  }, [hasMore, isFetching]);

  /** Reloads from the first page — used after a create, where the new
   * review's real id/timestamps only exist once the server has responded. */
  const resetToFirstPage = useCallback(() => {
    if (page === 0) {
      refetch();
    } else {
      setPage(0);
    }
  }, [page, refetch]);

  const createMutation = useMutation({
    mutationFn: (review: Omit<CreateReviewDto, 'productId'>) =>
      reviewsApi.createReview({ ...review, productId }),
    onSuccess: () => {
      resetToFirstPage();
      toast.success('Review submitted');
    },
    onError: () => {
      toast.error('Failed to submit review. Please try again.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ reviewId, review }: { reviewId: string; review: UpdateReviewDto }) =>
      reviewsApi.updateReview(reviewId, review),
    // Patched locally from the known request payload rather than the PUT's
    // response body (whose exact shape isn't pinned to a shared contract) —
    // avoids a full list reload just to reflect an edit to one review.
    onSuccess: (_data, variables) => {
      setItems((prev) =>
        prev.map((r) =>
          r.id === variables.reviewId ? { ...r, ...variables.review, updatedAt: new Date() } : r
        )
      );
      toast.success('Review updated');
    },
    onError: () => {
      toast.error('Failed to update review. Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: reviewsApi.deleteReview,
    onSuccess: (_data, reviewId) => {
      setItems((prev) => prev.filter((r) => r.id !== reviewId));
      toast.success('Review deleted');
    },
    onError: () => {
      toast.error('Failed to delete review. Please try again.');
    },
  });

  const helpfulMutation = useMutation({
    mutationFn: reviewsApi.markHelpful,
    onSuccess: (_data, reviewId) => {
      setItems((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, helpful: (r.helpful ?? 0) + 1 } : r))
      );
    },
    onError: () => {
      toast.error('Failed to mark review as helpful.');
    },
  });

  return {
    reviews: items,
    isLoading,
    isError,
    refetch: resetToFirstPage,
    hasMore,
    isLoadingMore,
    loadMoreReviews,
    currentUserId: session?.user?.id,
    createReview: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateReview: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteReview: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    markHelpful: helpfulMutation.mutate,
    isMarkingHelpful: helpfulMutation.isPending,
  };
}

/**
 * The signed-in customer's own reviews, across every product.
 *
 * Deliberately a separate hook from {@link useReviews} rather than a variant
 * of it: that hook accumulates pages for an infinite-scroll product page and
 * owns local list state, whereas this is a paginated account list where React
 * Query's cache is the only state needed. Merging the two would force one
 * shape to carry the other's complexity.
 */
export function useMyReviews(page: number, size: number = REVIEWS_PAGE_SIZE) {
  const queryClient = useQueryClient();
  const queryKey = ['reviews', 'mine', page, size] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => reviewsApi.getMyReviews({ page, size }),
    // Keeps the previous page rendered while the next loads, so paging does
    // not blank the list and shift the layout.
    placeholderData: (previous) => previous,
  });

  const deleteMutation = useMutation({
    mutationFn: reviewsApi.deleteReview,
    onSuccess: () => {
      // Invalidated rather than patched: removing an item changes pagination,
      // so a locally-spliced list would disagree with the server's page
      // boundaries on the very next navigation.
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review deleted');
    },
    onError: () => {
      toast.error('Failed to delete review. Please try again.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ reviewId, review }: { reviewId: string; review: UpdateReviewDto }) =>
      reviewsApi.updateReview(reviewId, review),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review updated');
    },
    onError: () => {
      toast.error('Failed to update review. Please try again.');
    },
  });

  return {
    reviews: query.data?.content ?? [],
    totalPages: query.data?.totalPages ?? 0,
    totalElements: query.data?.totalElements ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
    deleteReview: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    updateReview: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
