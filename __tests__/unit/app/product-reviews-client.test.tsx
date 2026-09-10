import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useReviews } from '@/features/reviews';
import ProductReviewsClient from '@/app/(public)/products/[slug]/reviews/product-reviews-client';
import type { Review } from '@/features/reviews';
import type { ProductDTO } from '@/domains/catalog/contracts/catalog.types';

beforeAll(() => {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.ResizeObserver = MockResizeObserver;
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
});

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('@/features/reviews', () => ({
  useReviews: jest.fn(),
}));

const mockProduct = {
  id: 42,
  name: 'Wireless Headphones',
  urlSlug: 'wireless-headphones',
  averageRating: 4.5,
  reviewCount: 2,
} as unknown as ProductDTO;

const otherReview: Review = {
  id: '1',
  productId: '42',
  userId: 'user-other',
  userName: 'Alex',
  rating: 5,
  title: 'Great sound',
  comment: 'Really happy with these.',
  verified: true,
  helpful: 3,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const ownReview: Review = {
  id: '2',
  productId: '42',
  userId: 'user-me',
  userName: 'Me',
  rating: 4,
  title: 'Good value',
  comment: 'Solid for the price.',
  verified: false,
  helpful: 0,
  createdAt: new Date('2026-01-02'),
  updatedAt: new Date('2026-01-02'),
};

function mockUseReviews(overrides: Partial<ReturnType<typeof useReviews>> = {}) {
  const defaults: ReturnType<typeof useReviews> = {
    reviews: [otherReview, ownReview],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    hasMore: false,
    isLoadingMore: false,
    loadMoreReviews: jest.fn(),
    currentUserId: 'user-me',
    createReview: jest.fn(),
    isCreating: false,
    updateReview: jest.fn(),
    isUpdating: false,
    deleteReview: jest.fn(),
    isDeleting: false,
    markHelpful: jest.fn(),
    isMarkingHelpful: false,
  };
  (useReviews as jest.Mock).mockReturnValue({ ...defaults, ...overrides });
  return { ...defaults, ...overrides };
}

describe('ProductReviewsClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({ status: 'authenticated', data: { user: { id: 'user-me' } } });
  });

  it('renders loading skeletons', () => {
    mockUseReviews({ isLoading: true, reviews: [] });
    render(<ProductReviewsClient product={mockProduct} />);
    expect(screen.getByLabelText('Loading reviews')).toBeInTheDocument();
  });

  it('renders an error state with a working retry button', () => {
    const refetch = jest.fn();
    mockUseReviews({ isError: true, reviews: [], refetch });
    render(<ProductReviewsClient product={mockProduct} />);

    expect(screen.getByText("Couldn't load reviews")).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it('renders an empty state when there are no reviews', () => {
    mockUseReviews({ reviews: [] });
    render(<ProductReviewsClient product={mockProduct} />);
    expect(screen.getByText('No reviews yet')).toBeInTheDocument();
  });

  it('shows a sign-in prompt instead of the write-review form when unauthenticated', () => {
    (useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated', data: null });
    mockUseReviews();
    render(<ProductReviewsClient product={mockProduct} />);

    expect(screen.getByText('Sign in to write a review')).toBeInTheDocument();
    expect(screen.queryByText('Write a Review')).not.toBeInTheDocument();
  });

  it('disables the Helpful button and hides Edit/Delete when unauthenticated', () => {
    (useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated', data: null });
    mockUseReviews({ currentUserId: undefined });
    render(<ProductReviewsClient product={mockProduct} />);

    const helpfulButtons = screen.getAllByRole('button', { name: /helpful/i });
    helpfulButtons.forEach((btn) => expect(btn).toBeDisabled());
    expect(screen.queryByRole('button', { name: /^edit$/i })).not.toBeInTheDocument();
  });

  it('only shows Edit/Delete controls on the current user\'s own review', () => {
    mockUseReviews();
    render(<ProductReviewsClient product={mockProduct} />);

    // Two reviews rendered, only one (ownReview) belongs to user-me.
    expect(screen.getAllByRole('button', { name: /^edit$/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /^delete$/i })).toHaveLength(1);
  });

  it('requires a rating and a comment of at least 10 characters before enabling submit', () => {
    mockUseReviews();
    render(<ProductReviewsClient product={mockProduct} />);

    const submit = screen.getByRole('button', { name: /submit review/i });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByRole('radio', { name: '4 stars' }));
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Review comment'), { target: { value: 'too short' } });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Review comment'), {
      target: { value: 'This product exceeded my expectations.' },
    });
    expect(submit).not.toBeDisabled();
  });

  it('submits a new review with the trimmed form values', () => {
    const createReview = jest.fn();
    mockUseReviews({ createReview });
    render(<ProductReviewsClient product={mockProduct} />);

    fireEvent.click(screen.getByRole('radio', { name: '5 stars' }));
    fireEvent.change(screen.getByLabelText('Review title'), { target: { value: '  Loved it  ' } });
    fireEvent.change(screen.getByLabelText('Review comment'), {
      target: { value: '  Works great every day.  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit review/i }));

    expect(createReview).toHaveBeenCalledWith(
      { rating: 5, title: 'Loved it', comment: 'Works great every day.' },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it('marks a review helpful once per session', () => {
    const markHelpful = jest.fn((_id, callbacks) => callbacks?.onSuccess?.());
    mockUseReviews({ markHelpful });
    render(<ProductReviewsClient product={mockProduct} />);

    const helpfulButton = screen.getAllByRole('button', { name: /helpful/i })[0];
    fireEvent.click(helpfulButton);

    expect(markHelpful).toHaveBeenCalledWith(otherReview.id, expect.objectContaining({ onSuccess: expect.any(Function) }));
    expect(helpfulButton).toBeDisabled();
  });

  it('edits an own review in place and exits edit mode on success', () => {
    const updateReview = jest.fn((_vars, callbacks) => callbacks?.onSuccess?.());
    mockUseReviews({ updateReview });
    render(<ProductReviewsClient product={mockProduct} />);

    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }));
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();

    // Two "Review comment" fields exist while editing: the always-present
    // "Write a Review" form, and this review's inline edit form (rendered
    // second in DOM order).
    const commentFields = screen.getAllByLabelText('Review comment');
    fireEvent.change(commentFields[commentFields.length - 1], {
      target: { value: 'Updated opinion after two more weeks of use.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(updateReview).toHaveBeenCalledWith(
      {
        reviewId: ownReview.id,
        review: { rating: ownReview.rating, title: ownReview.title, comment: 'Updated opinion after two more weeks of use.' },
      },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
  });

  it('deletes a review only after confirming in the dialog', async () => {
    const deleteReview = jest.fn();
    mockUseReviews({ deleteReview });
    render(<ProductReviewsClient product={mockProduct} />);

    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    const dialogConfirm = await screen.findByRole('button', { name: 'Delete' });
    expect(deleteReview).not.toHaveBeenCalled();

    fireEvent.click(dialogConfirm);
    expect(deleteReview).toHaveBeenCalledWith(ownReview.id, expect.objectContaining({ onSuccess: expect.any(Function) }));
  });

  it('shows a Load more button when hasMore is true and calls loadMoreReviews', () => {
    const loadMoreReviews = jest.fn();
    mockUseReviews({ hasMore: true, loadMoreReviews });
    render(<ProductReviewsClient product={mockProduct} />);

    fireEvent.click(screen.getByRole('button', { name: /load more reviews/i }));
    expect(loadMoreReviews).toHaveBeenCalled();
  });

  it('disables the Load more button while fetching the next page', () => {
    mockUseReviews({ hasMore: true, isLoadingMore: true });
    render(<ProductReviewsClient product={mockProduct} />);

    expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled();
  });
});
