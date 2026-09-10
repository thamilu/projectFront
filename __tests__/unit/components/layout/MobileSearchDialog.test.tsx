import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MobileSearchDialog } from '@/features/seller/components/layout/mobile-search-dialog';

describe('MobileSearchDialog Component', () => {
  const defaultProps = {
    isOpen: true,
    onOpenChange: jest.fn(),
    searchQuery: '',
    onSearchChange: jest.fn(),
    onSubmit: jest.fn(),
    isPending: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render visually hidden DialogTitle for accessibility', () => {
    render(<MobileSearchDialog {...defaultProps} />);
    const title = screen.getByText('Search the seller dashboard');
    expect(title).toBeInTheDocument();
    expect(title.parentElement).toHaveClass('sr-only');
  });

  it('should have form with role="search" and correct aria-label', () => {
    render(<MobileSearchDialog {...defaultProps} />);
    const form = screen.getByRole('search');
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute('aria-label', 'Seller dashboard mobile search');
  });

  it('should render ARIA live region with correct text when isPending is true', () => {
    render(<MobileSearchDialog {...defaultProps} isPending={true} />);
    const liveRegion = screen.getByText('Searching, please wait...');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveClass('sr-only');
  });

  it('should render empty ARIA live region when isPending is false', () => {
    render(<MobileSearchDialog {...defaultProps} isPending={false} />);
    const liveRegion = screen.getByRole('search').querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toBeEmptyDOMElement();
  });

  it('should set correct accessibility attributes on trigger button based on isPending', () => {
    // When isPending is false (and dialog closed to prevent hidden inert state)
    const { rerender } = render(<MobileSearchDialog {...defaultProps} isOpen={false} isPending={false} />);
    const triggerBtn = screen.getByRole('button', { name: 'Open search' });
    expect(triggerBtn).toBeInTheDocument();
    expect(triggerBtn).not.toHaveAttribute('aria-busy');

    // When isPending is true
    rerender(<MobileSearchDialog {...defaultProps} isOpen={false} isPending={true} />);
    const pendingTriggerBtn = screen.getByRole('button', { name: 'Search in progress' });
    expect(pendingTriggerBtn).toBeInTheDocument();
    expect(pendingTriggerBtn).toHaveAttribute('aria-busy', 'true');
  });

  it('should move focus programmatically to input on open after 50ms', () => {
    render(<MobileSearchDialog {...defaultProps} isOpen={true} />);
    const input = screen.getByLabelText('Search products, orders, or inventory');

    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(input).toHaveFocus();
  });

  it('should prevent form submission and show validation error if search query is empty', () => {
    render(<MobileSearchDialog {...defaultProps} searchQuery="" />);
    const form = screen.getByRole('search');
    const input = screen.getByLabelText('Search products, orders, or inventory');

    fireEvent.submit(form);

    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    const errorMsg = screen.getByRole('alert');
    expect(errorMsg).toHaveTextContent('Please enter a search term');
    expect(errorMsg).toHaveClass('text-destructive');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'mobile-search-error');
  });

  it('should clear validation error when query becomes non-empty', () => {
    const { rerender } = render(<MobileSearchDialog {...defaultProps} searchQuery="" />);
    const form = screen.getByRole('search');

    fireEvent.submit(form);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Rerender with non-empty search query
    rerender(<MobileSearchDialog {...defaultProps} searchQuery="laptop" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should trigger trimStart on input change and preserve trailing spaces during typing', () => {
    render(<MobileSearchDialog {...defaultProps} />);
    const input = screen.getByLabelText('Search products, orders, or inventory');

    fireEvent.change(input, { target: { value: '   laptop  ' } });

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('laptop  ');
  });

  it('should have maxLength={200} and noValidate on form elements', () => {
    render(<MobileSearchDialog {...defaultProps} />);
    const input = screen.getByLabelText('Search products, orders, or inventory');
    const form = screen.getByRole('search');

    expect(input).toHaveAttribute('maxLength', '200');
    expect(form).toHaveAttribute('noValidate');
  });

  it('should disable submit button when query is empty or pending', () => {
    // Empty query
    const { rerender } = render(<MobileSearchDialog {...defaultProps} searchQuery="" />);
    const submitBtn = screen.getByRole('button', { name: 'Search' });
    expect(submitBtn).toBeDisabled();

    // Query non-empty, pending is true
    rerender(<MobileSearchDialog {...defaultProps} searchQuery="mac" isPending={true} />);
    const pendingSubmitBtn = screen.getByRole('button', { name: 'Searching...' });
    expect(pendingSubmitBtn).toBeDisabled();
    expect(pendingSubmitBtn.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should configure custom top offsets defaults or values correctly', () => {
    // Default top offset
    const { rerender } = render(<MobileSearchDialog {...defaultProps} />);
    const content = screen.getByRole('dialog');
    expect(content).toHaveClass('top-16');

    // Custom offset value
    rerender(<MobileSearchDialog {...defaultProps} dialogTopOffset="top-14" />);
    const updatedContent = screen.getByRole('dialog');
    expect(updatedContent).toHaveClass('top-14');
  });

  it('should define correct component displayName', () => {
    expect(MobileSearchDialog.displayName).toBe('MobileSearchDialog');
  });

  it('should submit query string directly when submit is clicked with valid query', () => {
    render(<MobileSearchDialog {...defaultProps} searchQuery="keyboard" />);
    const form = screen.getByRole('search');

    fireEvent.submit(form);

    expect(defaultProps.onSubmit).toHaveBeenCalledWith('keyboard');
  });

  it('should clear search query and refocus input when clear button is clicked', () => {
    render(<MobileSearchDialog {...defaultProps} searchQuery="mouse" />);
    const clearBtn = screen.getByRole('button', { name: 'Clear search query' });
    const input = screen.getByLabelText('Search products, orders, or inventory');

    fireEvent.click(clearBtn);

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('');
    expect(input).toHaveFocus();
  });

  it('should display character remaining countdown when query reaches threshold (>=160)', () => {
    const { rerender } = render(<MobileSearchDialog {...defaultProps} searchQuery={'a'.repeat(159)} />);
    expect(screen.queryByText(/remaining/)).not.toBeInTheDocument();

    rerender(<MobileSearchDialog {...defaultProps} searchQuery={'a'.repeat(165)} />);
    const countdown = screen.getByText('35 characters remaining');
    expect(countdown).toBeInTheDocument();
    expect(countdown).toHaveAttribute('aria-live', 'polite');
  });

  it('should reset validation error when dialog closes', () => {
    const { rerender } = render(<MobileSearchDialog {...defaultProps} isOpen={true} searchQuery="" />);
    const form = screen.getByRole('search');

    fireEvent.submit(form);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(<MobileSearchDialog {...defaultProps} isOpen={false} searchQuery="" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should not set aria-invalid initially, but set it explicitly to "false" after a successful submission attempt', () => {
    render(<MobileSearchDialog {...defaultProps} searchQuery="valid-query" />);
    const input = screen.getByLabelText('Search products, orders, or inventory');
    expect(input).not.toHaveAttribute('aria-invalid');

    const form = screen.getByRole('search');
    fireEvent.submit(form);
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('should set aria-busy on search form during active pending states', () => {
    const { rerender } = render(<MobileSearchDialog {...defaultProps} isPending={false} />);
    const form = screen.getByRole('search');
    expect(form).not.toHaveAttribute('aria-busy');

    rerender(<MobileSearchDialog {...defaultProps} isPending={true} />);
    expect(form).toHaveAttribute('aria-busy', 'true');
  });

  it('should display "Maximum length reached" when charsRemaining is 0', () => {
    render(<MobileSearchDialog {...defaultProps} searchQuery={'a'.repeat(200)} />);
    const message = screen.getByText('Maximum length reached');
    expect(message).toBeInTheDocument();
  });
});
