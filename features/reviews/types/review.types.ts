/**
 * Review Types
 */

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReviewDto {
  productId: string;
  rating: number;
  title: string;
  comment: string;
}

export interface UpdateReviewDto {
  rating?: number;
  title?: string;
  comment?: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
