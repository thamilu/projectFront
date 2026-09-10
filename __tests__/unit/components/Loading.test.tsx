import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { Loading } from '@/shared/ui/feedback/loading';

describe('Loading Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders with default props and contains status role', () => {
    render(<Loading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays custom message', () => {
    render(<Loading message="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('shows slow warning after 5 seconds', () => {
    render(<Loading message="Testing slow warning..." />);

    // Check that warning is not displayed initially
    expect(screen.queryByText(/taking longer than usual/i)).not.toBeInTheDocument();

    // Fast-forward warning timer (5000ms)
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.getByText(/taking longer than usual/i)).toBeInTheDocument();
  });

  it('calls onTimeout callback after specified timeout', () => {
    const onTimeout = jest.fn();
    render(<Loading timeout={1000} onTimeout={onTimeout} />);

    // Fast-forward timeout timer (1000ms)
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onTimeout).toHaveBeenCalled();
    expect(screen.getByText(/Loading timeout/i)).toBeInTheDocument();
  });

  it('is accessible and polite', () => {
    const { container } = render(<Loading />);
    const statusEl = container.querySelector('[role="status"]');
    expect(statusEl).toBeInTheDocument();
    expect(statusEl).toHaveAttribute('aria-live', 'polite');
    expect(statusEl).toHaveAttribute('aria-label', 'Loading content');
  });

  it('hides spinner when showSpinner is false', () => {
    const { container } = render(<Loading showSpinner={false} />);
    const spinner = container.querySelector('[aria-hidden="true"]');
    expect(spinner).not.toBeInTheDocument();
  });
});
