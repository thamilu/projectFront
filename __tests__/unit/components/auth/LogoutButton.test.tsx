// ============================================================
// __tests__/unit/components/auth/LogoutButton.test.tsx
// Priority: logout() never throws and useAuth() owns isLoggingOut's
// reset (see use-auth.tsx's finally block) — this component must
// delegate to that rather than reimplementing local state that could
// get stuck on failure.
// ============================================================

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogoutButton } from '@/features/auth/components/ui/LogoutButton';
import { useAuth } from '@/domains/auth/hooks/use-auth';
import { AuthErrorCode } from '@/domains/auth/services/auth-result.types';

jest.mock('@/domains/auth/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

const mockLogout = jest.fn();
const mockClearLogoutError = jest.fn();

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  (useAuth as jest.Mock).mockReturnValue({
    logout: mockLogout,
    isLoggingOut: false,
    logoutError: null,
    clearLogoutError: mockClearLogoutError,
    ...overrides,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LogoutButton — delegates to useAuth, no local state to get stuck', () => {
  it('reflects useAuth().isLoggingOut for its loading/disabled state', () => {
    mockAuth({ isLoggingOut: true });
    render(<LogoutButton />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleName('Signing out...');
  });

  it('is enabled and shows "Sign Out" when useAuth() reports a previously-failed logout is no longer in flight', () => {
    // Simulates the exact scenario the old local-state version got stuck
    // on: a logout that already failed. isLoggingOut is false again
    // (use-auth.tsx's finally always resets it), so the button must be
    // usable, not permanently stuck disabled.
    mockAuth({
      isLoggingOut: false,
      logoutError: { code: AuthErrorCode.LOGOUT_FAILED, message: 'Sign-out failed.' },
    });
    render(<LogoutButton />);

    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeEnabled();
  });

  it('clears any prior error and calls logout() on click', async () => {
    const user = userEvent.setup();
    mockAuth();
    render(<LogoutButton />);

    await user.click(screen.getByRole('button', { name: 'Sign Out' }));

    expect(mockClearLogoutError).toHaveBeenCalled();
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('does not call logout() again while already in flight', async () => {
    const user = userEvent.setup();
    mockAuth({ isLoggingOut: true });
    render(<LogoutButton />);

    await user.click(screen.getByRole('button'));

    expect(mockLogout).not.toHaveBeenCalled();
  });
});

describe('LogoutButton — error display', () => {
  it('shows a persistent, accessible error message when logoutError is set', () => {
    mockAuth({
      logoutError: { code: AuthErrorCode.LOGOUT_FAILED, message: 'Sign-out failed.' },
    });
    render(<LogoutButton />);

    expect(screen.getByRole('alert')).toHaveTextContent('Sign-out failed.');
  });

  it('links the button to its error message via aria-describedby', () => {
    mockAuth({
      logoutError: { code: AuthErrorCode.LOGOUT_FAILED, message: 'Sign-out failed.' },
    });
    render(<LogoutButton />);

    const button = screen.getByRole('button', { name: 'Sign Out' });
    const describedBy = button.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)).toHaveTextContent('Sign-out failed.');
  });

  it('renders the same wrapper element whether or not an error is present (no layout shift)', () => {
    mockAuth();
    const { container, rerender } = render(<LogoutButton />);
    const withoutError = container.firstElementChild;

    mockAuth({
      logoutError: { code: AuthErrorCode.LOGOUT_FAILED, message: 'Sign-out failed.' },
    });
    rerender(<LogoutButton />);
    const withError = container.firstElementChild;

    expect(withError?.tagName).toBe(withoutError?.tagName);
    expect(withError?.className).toBe(withoutError?.className);
  });
});

describe('LogoutButton — accessible name', () => {
  it('has no stale aria-label mismatch when custom children are passed', () => {
    mockAuth();
    render(<LogoutButton>End Session</LogoutButton>);

    // Accessible name must come from the visible text itself (WCAG 2.5.3
    // Label in Name), not a hardcoded "Sign Out" aria-label that would
    // mismatch custom children.
    expect(screen.getByRole('button', { name: 'End Session' })).toBeInTheDocument();
  });
});
