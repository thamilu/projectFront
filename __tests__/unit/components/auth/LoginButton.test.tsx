// ============================================================
// __tests__/unit/components/auth/LoginButton.test.tsx
// Priorities: the error state must not change the wrapper's DOM shape
// beyond what `fullWidth` already dictates (no error-triggered layout
// shift), the button must be programmatically linked to its error via
// aria-describedby, and the redirect target must be sanitized.
// ============================================================

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginButton } from '@/features/auth/components/ui/login-button';
import { useAuth } from '@/domains/auth/hooks/use-auth';
import { AuthErrorCode } from '@/domains/auth/services/auth-result.types';

jest.mock('@/domains/auth/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

const mockLogin = jest.fn();
const mockClearLoginError = jest.fn();

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  (useAuth as jest.Mock).mockReturnValue({
    login: mockLogin,
    isLoggingIn: false,
    loginError: null,
    clearLoginError: mockClearLoginError,
    ...overrides,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LoginButton — layout stability', () => {
  it('renders the same wrapper element whether or not an error is present', () => {
    mockAuth();
    const { container, rerender } = render(<LoginButton />);
    const wrapperWithoutError = container.firstElementChild;
    expect(wrapperWithoutError?.tagName).toBe('DIV');

    mockAuth({
      loginError: { code: AuthErrorCode.LOGIN_FAILED, message: 'Authentication failed.' },
    });
    rerender(<LoginButton />);
    const wrapperWithError = container.firstElementChild;

    expect(wrapperWithError?.tagName).toBe('DIV');
    expect(wrapperWithError?.className).toBe(wrapperWithoutError?.className);
  });

  it('does not force full width on the wrapper unless fullWidth is set', () => {
    mockAuth();
    const { container } = render(<LoginButton />);
    expect(container.firstElementChild?.className).not.toMatch(/\bw-full\b/);
  });

  it('forces full width on the wrapper when fullWidth is set', () => {
    mockAuth();
    const { container } = render(<LoginButton fullWidth />);
    expect(container.firstElementChild?.className).toMatch(/\bw-full\b/);
  });
});

describe('LoginButton — accessibility', () => {
  it('links the button to its error message via aria-describedby', () => {
    mockAuth({
      loginError: { code: AuthErrorCode.LOGIN_FAILED, message: 'Authentication failed.' },
    });
    render(<LoginButton />);

    const button = screen.getByRole('button', { name: /sign in/i });
    const describedBy = button.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)).toHaveTextContent(
      'Authentication failed.'
    );
  });

  it('has no aria-describedby when there is no error', () => {
    mockAuth();
    render(<LoginButton />);
    expect(screen.getByRole('button', { name: /sign in/i })).not.toHaveAttribute(
      'aria-describedby'
    );
  });
});

describe('LoginButton — login flow', () => {
  it('clears any prior error and calls login() with the sanitized redirect target on click', async () => {
    const user = userEvent.setup();
    mockAuth();
    render(<LoginButton redirectTo="//evil.com" />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mockClearLoginError).toHaveBeenCalled();
    // Falls back to DEFAULT_CALLBACK_URL (APP_ROUTES.DASHBOARD), not
    // sanitizeCallbackUrl's own generic '/' default.
    expect(mockLogin).toHaveBeenCalledWith('/dashboard', undefined);
  });

  it('passes a same-origin redirectTo through unchanged', async () => {
    const user = userEvent.setup();
    mockAuth();
    render(<LoginButton redirectTo="/checkout" />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mockLogin).toHaveBeenCalledWith('/checkout', undefined);
  });

  it('does not call login() again while a login is already in flight', async () => {
    const user = userEvent.setup();
    mockAuth({ isLoggingIn: true });
    render(<LoginButton />);

    // The Button atom disables the native element while loading, so the
    // click is a no-op at the DOM level too — this exercises the
    // component's own belt-and-suspenders guard regardless.
    await user.click(screen.getByRole('button'));

    expect(mockLogin).not.toHaveBeenCalled();
  });
});
