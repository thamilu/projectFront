import { reviewsApi } from '@/features/reviews/api/reviews-api';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';

jest.mock('@/core/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const { apiClient } = require('@/core/client');

describe('reviewsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Regression: createReview previously posted to a hardcoded, unvalidated
  // `/api/v1/reviews/${productId}` path that diverged from the shared
  // API_ENDPOINTS.REVIEWS.CREATE contract (and from CreateReviewDto, which
  // carries productId in the request body, not the URL).
  it('posts the full review DTO (including productId) to the shared CREATE endpoint', async () => {
    apiClient.post.mockResolvedValue({ data: { id: 'r1' } });

    await reviewsApi.createReview({
      productId: '123',
      rating: 5,
      title: 'Great product',
      comment: 'Loved it',
    });

    expect(apiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.REVIEWS.CREATE, {
      productId: '123',
      rating: 5,
      title: 'Great product',
      comment: 'Loved it',
    });
  });

  it('posts to the HELPFUL endpoint for a given review id', async () => {
    apiClient.post.mockResolvedValue({ data: {} });

    await reviewsApi.markHelpful('9');

    expect(apiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.REVIEWS.HELPFUL('9'));
  });

  it('normalizes a raw-array response from getReviews into a single-page PageResponse', async () => {
    apiClient.get.mockResolvedValue({ data: [{ id: 'r1' }] });

    const result = await reviewsApi.getReviews('123');

    expect(result.content).toEqual([{ id: 'r1' }]);
    expect(result.last).toBe(true);
    expect(apiClient.get).toHaveBeenCalledWith(
      API_ENDPOINTS.PRODUCTS.REVIEWS('123'),
      expect.objectContaining({ params: { page: 0, size: 10 } })
    );
  });

  it('normalizes a paginated { data: { content, totalPages, last } } envelope from getReviews', async () => {
    apiClient.get.mockResolvedValue({
      data: { data: { content: [{ id: 'r2' }], totalElements: 15, totalPages: 2, last: false } },
    });

    const result = await reviewsApi.getReviews('123', { page: 0, size: 10 });

    expect(result.content).toEqual([{ id: 'r2' }]);
    expect(result.totalPages).toBe(2);
    expect(result.last).toBe(false);
  });

  it('requests the given page/size for getReviews', async () => {
    apiClient.get.mockResolvedValue({ data: { content: [] } });

    await reviewsApi.getReviews('123', { page: 2, size: 5 });

    expect(apiClient.get).toHaveBeenCalledWith(
      API_ENDPOINTS.PRODUCTS.REVIEWS('123'),
      expect.objectContaining({ params: { page: 2, size: 5 } })
    );
  });
});
