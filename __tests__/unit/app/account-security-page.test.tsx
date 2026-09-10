import { render, screen, fireEvent } from '@testing-library/react';
import { signIn } from 'next-auth/react';
import AccountSecurityPage from '@/app/(customer)/account/security/page';

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

jest.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }: any) => <div {...props}>{children}</div> },
}));

// Regression: this page previously hardcoded two specific-looking (but
// entirely fake) sessions — "Chrome on Windows, Bangalore, IN, Now" and
// "Safari on iPhone, Chennai, IN, 2 hours ago" — with a "Sign out" button
// that had no onClick handler at all. Someone checking this page because
// they suspected their account was compromised would have had every reason
// to trust that fabricated data. It now links to Keycloak's real Account
// Console, which actually lists and can revoke this realm's sessions.
describe('AccountSecurityPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render fabricated session/device data', () => {
    render(<AccountSecurityPage />);

    expect(screen.queryByText(/Chrome on Windows/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Safari on iPhone/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bangalore/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Chennai/i)).not.toBeInTheDocument();
  });

  it('links "Manage Active Sessions" to the real Keycloak Account Console, opened in a new tab', () => {
    render(<AccountSecurityPage />);

    const link = screen.getByRole('link', { name: /manage active sessions/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('/account/#/account-security/signing-in'));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('still triggers the real Keycloak password-change redirect', () => {
    render(<AccountSecurityPage />);

    fireEvent.click(screen.getByRole('button', { name: /change password/i }));

    expect(signIn).toHaveBeenCalledWith(
      'keycloak',
      expect.objectContaining({ callbackUrl: expect.any(String) }),
      { kc_action: 'UPDATE_PASSWORD' }
    );
  });
});
