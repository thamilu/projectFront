// ============================================================
// __tests__/unit/components/auth/ModernAuthUI.test.tsx
// Covers the bugs found and fixed in this audit pass: the repeat-error
// toast silently dropping on an identical consecutive failure, the
// isRedirecting flag getting stuck across a logout->login cycle on a
// persisted instance, the unsanitized "Continue to App" redirect target,
// and the no-flash mount-already-authenticated render.
// ============================================================

import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ModernAuthUI } from '@/features/auth/components/ui/ModernAuthUI';
import { useAuth } from '@/features/auth';
import { AuthErrorCode } from '@/domains/auth/services/auth-result.types';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/features/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockPush = jest.fn();
const mockLogin = jest.fn();
const mockLogout = jest.fn();

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  (useAuth as jest.Mock).mockReturnValue({
    user: { name: 'Jane Doe', email: 'jane@example.com' },
    isAuthenticated: false,
    isLoading: false,
    login: mockLogin,
    logout: mockLogout,
    error: null,
    loginError: null,
    isLoggingIn: false,
    isLoggingOut: false,
    ...overrides,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('ModernAuthUI — error toast', () => {
  it('fires a toast for a login error', () => {
    mockAuth({ error: 'Authentication failed. Please try again.' });
    render(<ModernAuthUI />);

    expect(toast.error).toHaveBeenCalledWith('Authentication Failed', {
      description: 'Authentication failed. Please try again.',
    });
  });

  it('fires the toast again on a second, textually-identical failure (regression: was silently dropped)', () => {
    mockAuth({});
    const { rerender } = render(<ModernAuthUI />);
    expect(toast.error).not.toHaveBeenCalled();

    const firstError = {
      code: AuthErrorCode.LOGIN_FAILED,
      message: 'Authentication failed. Please try again.',
    };
    mockAuth({ error: firstError.message, loginError: firstError });
    rerender(<ModernAuthUI />);
    expect(toast.error).toHaveBeenCalledTimes(1);

    // A fresh object with identical .message text, as AR.fail() produces
    // on every independent failed attempt.
    const secondError = {
      code: AuthErrorCode.LOGIN_FAILED,
      message: 'Authentication failed. Please try again.',
    };
    mockAuth({ error: secondError.message, loginError: secondError });
    rerender(<ModernAuthUI />);

    expect(toast.error).toHaveBeenCalledTimes(2);
  });
});

describe('ModernAuthUI — redirect lifecycle', () => {
  it('shows real, clickable Continue to App / Sign Out buttons alongside the redirect notice (regression: used to be unreachable behind a spinner-only branch)', () => {
    mockAuth({ isAuthenticated: true });
    render(<ModernAuthUI />);

    expect(screen.getByText('Redirecting shortly…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue to App' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeEnabled();
  });

  it('sanitizes redirectTo before navigating via the Continue to App button', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockAuth({ isAuthenticated: true });
    render(<ModernAuthUI redirectTo="//evil.com" />);

    await user.click(screen.getByRole('button', { name: 'Continue to App' }));

    expect(mockPush).toHaveBeenCalledWith('/');
    expect(mockPush).not.toHaveBeenCalledWith('//evil.com');
  });

  it('navigates to the sanitized destination after the delay', () => {
    mockAuth({ isAuthenticated: true });
    render(<ModernAuthUI redirectTo="/dashboard" />);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('runs the redirect flow again after a logout->login cycle on a persisted instance', () => {
    mockAuth({ isAuthenticated: true });
    const { rerender } = render(<ModernAuthUI redirectTo="/dashboard" />);
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(mockPush).toHaveBeenCalledTimes(1);

    // Logout — isRedirecting must reset, not stay stuck true.
    mockAuth({ isAuthenticated: false });
    rerender(<ModernAuthUI redirectTo="/dashboard" />);

    // Logs back in.
    mockAuth({ isAuthenticated: true });
    rerender(<ModernAuthUI redirectTo="/dashboard" />);
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockPush).toHaveBeenCalledTimes(2);
  });
});

describe('ModernAuthUI — login button', () => {
  it('calls login() with the configured redirectTo', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockAuth({ isAuthenticated: false });
    render(<ModernAuthUI redirectTo="/checkout" />);

    await user.click(screen.getByRole('button', { name: /sign in with keycloak/i }));

    expect(mockLogin).toHaveBeenCalledWith('/checkout');
  });
});
