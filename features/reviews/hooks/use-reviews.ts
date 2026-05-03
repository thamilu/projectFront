/**
 * Reviews Hook
 * @module features/reviews/hooks/use-reviews
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '../api/reviews-api';

export function useReviews(productId: string) {
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => reviewsApi.getReviews(productId),
    enabled: !!productId,
  });

  const createMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (review: any) => reviewsApi.createReview(productId, review),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
    },
  });

  const updateMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: ({ reviewId, review }: { reviewId: string; review: any }) =>
      reviewsApi.updateReview(reviewId, review),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: reviewsApi.deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
    },
  });

  return {
    reviews,
    isLoading,
    createReview: createMutation.mutate,
    updateReview: updateMutation.mutate,
    deleteReview: deleteMutation.mutate,
  };
}
