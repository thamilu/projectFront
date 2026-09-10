import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SettingsPage from '@/app/(customer)/settings/page';
import { useTheme } from 'next-themes';
import { useAuth } from '@/features/auth';

jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}));

jest.mock('@/features/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/settings',
}));

jest.mock('@/shared/ui/layout/header', () => () => <header data-testid="mock-header" />);

describe('SettingsPage - Appearance Component', () => {
  const mockSetTheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: { email: 'user@example.com', name: 'Test User' },
      isAuthenticated: true,
      isLoading: false,
    });
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      themes: ['light', 'dark', 'system'],
    });
  });

  it('renders the Appearance card with radio group and all three theme options', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /theme preference/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /light/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /dark/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /system/i })).toBeInTheDocument();
  });

  it('correctly sets aria-checked on the active theme option', () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      themes: ['light', 'dark', 'system'],
    });

    render(<SettingsPage />);
    const lightRadio = screen.getByRole('radio', { name: /light/i });
    const darkRadio = screen.getByRole('radio', { name: /dark/i });

    expect(lightRadio).toBeChecked();
    expect(darkRadio).not.toBeChecked();
  });

  it('calls setTheme with "dark" when Dark card is selected', () => {
    render(<SettingsPage />);

    const darkRadio = screen.getByRole('radio', { name: /dark/i });
    fireEvent.click(darkRadio);

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('calls setTheme with "system" when System card is selected', () => {
    render(<SettingsPage />);

    const systemRadio = screen.getByRole('radio', { name: /system/i });
    fireEvent.click(systemRadio);

    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });

  it('displays the keyboard shortcut hint badge in the card header', () => {
    render(<SettingsPage />);

    expect(screen.getByText(/Shortcut:/i)).toBeInTheDocument();
    expect(screen.getByText('Ctrl + Shift + L')).toBeInTheDocument();
  });
});
