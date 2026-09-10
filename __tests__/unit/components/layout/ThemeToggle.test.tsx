import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeToggle } from '@/shared/ui/layout/theme-toggle';
import { useTheme } from 'next-themes';

jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}));

jest.mock('@/shared/ui/atoms/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-content">{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onClick,
    'aria-current': ariaCurrent,
  }: {
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    'aria-current'?: string;
  }) => (
    <button
      onClick={onClick}
      aria-current={ariaCurrent as React.AriaAttributes['aria-current']}
      role="menuitem"
    >
      {children}
    </button>
  ),
}));

describe('ThemeToggle Component', () => {
  const mockSetTheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      themes: ['light', 'dark', 'system'],
    });
  });

  it('should not render dropdown toggle until mounted to prevent hydration flashes (SSR Loading State)', () => {
    const useEffectSpy = jest.spyOn(React, 'useEffect').mockImplementation(() => {});

    try {
      render(<ThemeToggle />);
      expect(screen.getByLabelText('Loading theme toggle')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading theme toggle')).toBeDisabled();
    } finally {
      useEffectSpy.mockRestore();
    }
  });

  it('should render theme toggle button after mount', async () => {
    render(<ThemeToggle />);
    await waitFor(() => {
      expect(screen.queryByLabelText('Loading theme toggle')).not.toBeInTheDocument();
    });
    expect(screen.getByLabelText(/current theme: light/i)).toBeInTheDocument();
  });

  it('should display menu items', async () => {
    render(<ThemeToggle />);
    await waitFor(() => {
      expect(screen.queryByLabelText('Loading theme toggle')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('should display selected checkmark and aria-current properties next to the active theme selection', async () => {
    render(<ThemeToggle />);
    await waitFor(() => {
      expect(screen.queryByLabelText('Loading theme toggle')).not.toBeInTheDocument();
    });

    const lightItem =
      screen.getByText('Light').closest('[role="menuitem"]') || screen.getByText('Light');
    expect(lightItem).toHaveAttribute('aria-current', 'true');

    // Selected checkmark check
    const checkIcon = screen.getByLabelText('Selected');
    expect(checkIcon).toBeInTheDocument();
  });

  it('should trigger setTheme to dark when clicked', async () => {
    render(<ThemeToggle />);
    await waitFor(() => {
      expect(screen.queryByLabelText('Loading theme toggle')).not.toBeInTheDocument();
    });

    const darkItem = screen.getByText('Dark');
    fireEvent.click(darkItem);

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('should trigger setTheme to system when clicked', async () => {
    render(<ThemeToggle />);
    await waitFor(() => {
      expect(screen.queryByLabelText('Loading theme toggle')).not.toBeInTheDocument();
    });

    const systemItem = screen.getByText('System');
    fireEvent.click(systemItem);

    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });
});
