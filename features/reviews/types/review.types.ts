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

/**
 * A review as shown on the customer's own "My reviews" page.
 *
 * Carries a product summary because that page lists reviews *by* a user across
 * many products, and would otherwise need an N+1 fetch to render each title
 * and link.
 */
export interface MyReview extends Review {
  product: {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string;
  };
}
