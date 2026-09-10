import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SellerHeaderActions } from '@/features/seller/components/layout/SellerHeaderActions';

// Mock sub-components
jest.mock('@/shared/ui/layout/theme-toggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));
jest.mock('@/features/seller/components/layout/user-nav', () => ({
  UserNav: () => <div data-testid="user-nav" />,
}));

// Mock ResizeObserver for Radix UI compatibility in JSDOM
beforeAll(() => {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.ResizeObserver = MockResizeObserver;
});

describe('SellerHeaderActions Component', () => {
  const defaultProps = {
    locale: 'en',
    onLocaleChange: jest.fn(),
    isLocalePending: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should define correct displayName and be a named export only', () => {
    expect(SellerHeaderActions.displayName).toBe('SellerHeaderActions');
  });

  it('should render trigger button with currentLocaleName visible text', () => {
    render(<SellerHeaderActions {...defaultProps} />);
    const trigger = screen.getByRole('button', { name: 'English — language selector' });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('English');
  });

  it('should apply HEADER_ACTION_BUTTON_CLASS and focus-visible:outline-none class to trigger', () => {
    render(<SellerHeaderActions {...defaultProps} />);
    const trigger = screen.getByRole('button');
    expect(trigger).toHaveClass('focus-visible:outline-none');
    expect(trigger).not.toHaveClass('focus:outline-hidden');
  });

  it('should render fallback display text for unsupported locale', () => {
    render(<SellerHeaderActions {...defaultProps} locale="fr" />);
    const trigger = screen.getByRole('button', { name: 'Language — language selector' });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('Language');
  });

  it('should open dropdown menu on click', async () => {
    const user = userEvent.setup();
    render(<SellerHeaderActions {...defaultProps} />);
    const trigger = screen.getByRole('button', { name: 'English — language selector' });

    await user.click(trigger);

    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('should highlight active locale with visual check icon and "(currently selected)" text', async () => {
    const user = userEvent.setup();
    render(<SellerHeaderActions {...defaultProps} locale="en" />);
    const trigger = screen.getByRole('button');

    await user.click(trigger);

    const activeItem = screen.getByRole('menuitem', { name: /English/ });
    expect(activeItem).toBeInTheDocument();
    expect(activeItem).toHaveTextContent('(currently selected)');

    const activeCheckIcon = activeItem.querySelector('svg');
    expect(activeCheckIcon).toBeInTheDocument();
    expect(activeCheckIcon).toHaveAttribute('aria-hidden', 'true');
  });

  it('should trigger onLocaleChange with correct code when inactive locale is clicked', async () => {
    const user = userEvent.setup();
    render(<SellerHeaderActions {...defaultProps} locale="en" />);
    const trigger = screen.getByRole('button');

    await user.click(trigger);

    const inactiveItem = screen.getByRole('menuitem', { name: 'हिन्दी' });
    await user.click(inactiveItem);

    expect(defaultProps.onLocaleChange).toHaveBeenCalledWith('hi');
  });

  it('should NOT trigger onLocaleChange when active locale is clicked', async () => {
    const user = userEvent.setup();
    render(<SellerHeaderActions {...defaultProps} locale="en" />);
    const trigger = screen.getByRole('button');

    await user.click(trigger);

    const activeItem = screen.getByRole('menuitem', { name: /English/ });
    await user.click(activeItem);

    expect(defaultProps.onLocaleChange).not.toHaveBeenCalled();
  });

  it('should show Loader2, disable trigger, and set aria-busy="true" when isLocalePending is true', () => {
    const { container } = render(<SellerHeaderActions {...defaultProps} isLocalePending={true} />);
    const trigger = screen.getByRole('button');

    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute('aria-busy', 'true');
    expect(trigger).toHaveTextContent('Switching...');

    const loaderIcon = container.querySelector('.animate-spin');
    expect(loaderIcon).toBeInTheDocument();
    expect(loaderIcon).toHaveAttribute('aria-hidden', 'true');
  });

  it('should hide Globe and ChevronDown icons from screen readers', () => {
    const { container } = render(<SellerHeaderActions {...defaultProps} />);
    const icons = container.querySelectorAll('svg');
    icons.forEach((icon) => {
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('should render ThemeToggle and UserNav as smoke test', () => {
    render(<SellerHeaderActions {...defaultProps} />);
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('user-nav')).toBeInTheDocument();
  });

  it('should support standard Radix DropdownMenu keyboard shortcuts', async () => {
    render(<SellerHeaderActions {...defaultProps} />);
    const trigger = screen.getByRole('button');

    // Trigger focus
    act(() => {
      trigger.focus();
    });

    // Press ArrowDown to open dropdown menu
    await act(async () => {
      fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });
    });
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // Press Escape to close dropdown menu
    await act(async () => {
      fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape', code: 'Escape' });
    });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
