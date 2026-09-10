import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountSummary } from '@/app/(customer)/settings/components/AccountSummary';
import { NotificationsSection } from '@/app/(customer)/settings/components/NotificationsSection';
import { SecuritySection } from '@/app/(customer)/settings/components/SecuritySection';
import { RegionalSection } from '@/app/(customer)/settings/components/RegionalSection';
import { PrivacySection } from '@/app/(customer)/settings/components/PrivacySection';
import { DangerZoneSection } from '@/app/(customer)/settings/components/DangerZoneSection';
import { ChangePasswordModal } from '@/app/(customer)/settings/components/modals/ChangePasswordModal';
import { MfaEnrollmentModal } from '@/app/(customer)/settings/components/modals/MfaEnrollmentModal';
import { DeleteAccountModal } from '@/app/(customer)/settings/components/modals/DeleteAccountModal';
import { SettingsSection, SettingsRow } from '@/shared/ui/settings';
import { Bell, Lock } from 'lucide-react';
import { APP_ROUTES } from '@/shared/routes';
import { apiClient } from '@/core/client';

jest.mock('@/core/client', () => ({
  apiClient: { put: jest.fn() },
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockPut = apiClient.put as jest.Mock;

describe('Ultra-Enterprise Settings Suite', () => {
  describe('Settings Primitives', () => {
    it('renders SettingsSection with title, icon, and description', () => {
      render(
        <SettingsSection id="test-section" title="Test Section" description="Test description" icon={Bell}>
          <div data-testid="child-content">Child content</div>
        </SettingsSection>
      );

      expect(screen.getByText('Test Section')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('renders SettingsRow with title, description, and interactive control', () => {
      render(
        <SettingsRow
          title="Row Title"
          description="Row description"
          icon={Lock}
          control={<button data-testid="row-button">Action</button>}
        />
      );

      expect(screen.getByText('Row Title')).toBeInTheDocument();
      expect(screen.getByText('Row description')).toBeInTheDocument();
      expect(screen.getByTestId('row-button')).toBeInTheDocument();
    });
  });

  describe('AccountSummary Component', () => {
    it('renders user details, email verified badge, and Manage Profile link to /account/profile', () => {
      const mockUser = {
        id: 'u-123',
        name: 'Thamilu selvan N',
        email: 'thamilu163@gmail.com',
        username: 'thamilu',
        role: 'Customer',
        isEmailVerified: true,
        memberSince: '2024',
      };

      render(<AccountSummary user={mockUser} />);

      expect(screen.getByText('Thamilu selvan N')).toBeInTheDocument();
      expect(screen.getByText(/thamilu163@gmail.com/i)).toBeInTheDocument();
      expect(screen.getByText('Customer')).toBeInTheDocument();
      expect(screen.getByText(/Member since 2024/i)).toBeInTheDocument();

      const profileLink = screen.getByRole('link', { name: /manage profile/i });
      expect(profileLink).toHaveAttribute('href', APP_ROUTES.ACCOUNT.PROFILE);
    });
  });

  describe('NotificationsSection Component', () => {
    it('renders all notification switches and responds to toggle events', async () => {
      const handleSave = jest.fn().mockResolvedValue(undefined);
      render(<NotificationsSection onSave={handleSave} />);

      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(screen.getByText('Order & Shipment Tracking')).toBeInTheDocument();
      expect(screen.getByText('SMS Text Notifications')).toBeInTheDocument();
      expect(screen.getByText('Marketing & Exclusive Deals')).toBeInTheDocument();

      const emailSwitch = screen.getByRole('switch', { name: /toggle email notifications/i });
      expect(emailSwitch).toHaveAttribute('aria-checked', 'true');

      fireEvent.click(emailSwitch);
      expect(emailSwitch).toHaveAttribute('aria-checked', 'false');
    });

    it('performs automatic rollback when server persistence fails', async () => {
      const handleSave = jest.fn().mockRejectedValue(new Error('Network failure'));
      render(<NotificationsSection onSave={handleSave} />);

      const emailSwitch = screen.getByRole('switch', { name: /toggle email notifications/i });
      expect(emailSwitch).toHaveAttribute('aria-checked', 'true');

      fireEvent.click(emailSwitch);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(emailSwitch).toHaveAttribute('aria-checked', 'true');
      });
    });
  });

  describe('SecuritySection Component', () => {
    it('renders password management, MFA, and active sessions list', () => {
      render(<SecuritySection />);

      expect(screen.getByText('Password Management')).toBeInTheDocument();
      expect(screen.getByText('Two-Factor Authentication (MFA)')).toBeInTheDocument();
      expect(screen.getByText('Active Connected Sessions')).toBeInTheDocument();
      expect(screen.getByText(/Recent Authentication Events/i)).toBeInTheDocument();
    });

    it('links to the real Keycloak Account Console instead of showing fabricated session/device data', () => {
      // Regression guard: this component used to either hardcode two
      // specific-looking (but entirely fake) sessions with real-seeming IPs
      // and cities ("103.145.72.18", "Chennai, India"), or later, a
      // permanently-disabled "Revoke"/"Sign Out Other Devices" pair behind a
      // ComingSoonNotice driven by an initialSessions prop no caller ever
      // supplied — both misleading to someone checking this page because
      // they suspect their account was compromised. It now links to
      // Keycloak's own Account Console, which really does list and revoke
      // this realm's active sessions.
      render(<SecuritySection />);

      expect(screen.queryByText(/Chennai/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /revoke/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/remote session management/i)).not.toBeInTheDocument();

      const manageSessionsLink = screen.getByRole('link', { name: /manage sessions/i });
      expect(manageSessionsLink).toHaveAttribute(
        'href',
        expect.stringContaining('/account/#/account-security/signing-in')
      );
      expect(manageSessionsLink).toHaveAttribute('target', '_blank');
      expect(manageSessionsLink).toHaveAttribute('rel', expect.stringContaining('noopener'));
    });

    it('still shows an honest empty state for login activity history, which Keycloak does not cover here', () => {
      render(<SecuritySection />);
      expect(screen.getByText(/login activity history isn't available yet/i)).toBeInTheDocument();
    });
  });

  describe('ChangePasswordModal Component', () => {
    afterEach(() => {
      mockPut.mockReset();
    });

    it('validates against the real ChangePasswordSchema and submits to the real backend endpoint', async () => {
      // This used to be entirely fake: submission was a no-op behind a
      // permanently-disabled button and a ComingSoonNotice. USERS.CHANGE_PASSWORD
      // is a real, documented Spring Boot contract endpoint that simply had
      // no caller — it's now wired up for real, validated by the same
      // ChangePasswordSchema the auth domain already defines.
      mockPut.mockResolvedValue({ data: {} });
      const handleOpenChange = jest.fn();
      render(<ChangePasswordModal open={true} onOpenChange={handleOpenChange} />);

      expect(screen.getByRole('heading', { name: 'Change Password' })).toBeInTheDocument();
      const submitButton = screen.getByRole('button', { name: /update password/i });
      expect(submitButton).not.toBeDisabled();

      fireEvent.change(screen.getByLabelText(/current password/i), {
        target: { value: 'OldPass123!' },
      });
      fireEvent.change(screen.getByLabelText(/^new password/i), {
        target: { value: 'NewSecurePass@2026' },
      });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), {
        target: { value: 'NewSecurePass@2026' },
      });

      expect(screen.getByText('✓ Passwords match')).toBeInTheDocument();

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPut).toHaveBeenCalledTimes(1);
      });
      const [endpoint, payload, config] = mockPut.mock.calls[0];
      expect(endpoint).toMatch(/password/i);
      expect(payload).toEqual({
        currentPassword: 'OldPass123!',
        newPassword: 'NewSecurePass@2026',
      });
      expect(config?.headers?.['X-Bypass-Toast']).toBe('true');

      await waitFor(() => expect(handleOpenChange).toHaveBeenCalledWith(false));
    });

    it('rejects submission when the new password fails the shared policy schema', async () => {
      render(<ChangePasswordModal open={true} onOpenChange={jest.fn()} />);

      fireEvent.change(screen.getByLabelText(/current password/i), {
        target: { value: 'OldPass123!' },
      });
      fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: 'weak' } });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), {
        target: { value: 'weak' },
      });

      fireEvent.click(screen.getByRole('button', { name: /update password/i }));

      expect(await screen.findByRole('alert')).toBeInTheDocument();
      expect(mockPut).not.toHaveBeenCalled();
    });

    it('surfaces a specific "incorrect password" message on a 401/400 response instead of a generic failure', async () => {
      mockPut.mockRejectedValue({ response: { status: 401, data: {} } });
      render(<ChangePasswordModal open={true} onOpenChange={jest.fn()} />);

      fireEvent.change(screen.getByLabelText(/current password/i), {
        target: { value: 'WrongPass123!' },
      });
      fireEvent.change(screen.getByLabelText(/^new password/i), {
        target: { value: 'NewSecurePass@2026' },
      });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), {
        target: { value: 'NewSecurePass@2026' },
      });

      fireEvent.click(screen.getByRole('button', { name: /update password/i }));

      await waitFor(() => expect(mockPut).toHaveBeenCalledTimes(1));
    });
  });

  describe('MfaEnrollmentModal Component', () => {
    it('renders wizard steps as a preview, but never actually activates MFA', () => {
      // Regression guard: step 3 used to "verify" any code except the
      // literal '000000' and then show step 4 with a hardcoded set of
      // recovery codes IDENTICAL for every user (MOCK_RECOVERY_CODES,
      // removed) — a real credential-sharing hazard, not just a fake
      // success message. Step 4 no longer exists; verification is disabled.
      render(<MfaEnrollmentModal open={true} onOpenChange={jest.fn()} />);

      expect(screen.getByText(/two-factor authentication.*isn't connected/i)).toBeInTheDocument();
      expect(screen.getByText(/Select an MFA method/i)).toBeInTheDocument();
      const continueBtn = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueBtn);

      expect(screen.getByText(/Scan this QR code/i)).toBeInTheDocument();
      expect(screen.getByText('HX5D-9K2Q-M8LP-4R7T')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /next: verify code/i }));
      expect(screen.getByRole('button', { name: /verify & activate/i })).toBeDisabled();
    });
  });

  describe('DeleteAccountModal Component', () => {
    it('never enables account deletion — there is no backend to delete anything from yet', () => {
      // Regression guard: this used to enable "Permanently Delete Account"
      // once the DELETE phrase + a mere 6+ character password were typed
      // (the password was never actually verified), wait 1.2s, and call
      // onSuccess() — the account was never touched server-side while the
      // user was told it had been permanently erased.
      render(<DeleteAccountModal open={true} onOpenChange={jest.fn()} username="thamilu" />);

      expect(screen.getByText(/account deletion.*isn't connected/i)).toBeInTheDocument();
      const deleteBtn = screen.getByRole('button', { name: /permanently delete account/i });
      expect(deleteBtn).toBeDisabled();

      const checkbox = screen.getByRole('checkbox');
      const phraseInput = screen.getByLabelText(/type delete to confirm/i);
      const passwordInput = screen.getByLabelText(/confirm your current password/i);

      fireEvent.click(checkbox);
      fireEvent.change(phraseInput, { target: { value: 'DELETE' } });
      fireEvent.change(passwordInput, { target: { value: 'validpassword123' } });

      expect(deleteBtn).toBeDisabled();
    });
  });

  describe('Regional & Privacy Sections', () => {
    it('renders RegionalSection controls without errors', () => {
      render(<RegionalSection />);
      expect(screen.getByText('Display Language')).toBeInTheDocument();
      expect(screen.getByText('Preferred Currency')).toBeInTheDocument();
    });

    it('renders PrivacySection controls without errors', () => {
      render(<PrivacySection />);
      expect(screen.getByText('Profile Visibility')).toBeInTheDocument();
      expect(screen.getByText('Activity Status')).toBeInTheDocument();
      expect(screen.getByText('Data Access & Export Request')).toBeInTheDocument();
    });

    it('renders DangerZoneSection with deactivation and deletion controls, both disabled pending backend integration', () => {
      render(<DangerZoneSection />);
      expect(screen.getByText('Temporarily Deactivate Account')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^deactivate$/i })).toBeDisabled();
      expect(screen.getByText('Permanently Delete Account')).toBeInTheDocument();
      expect(screen.getByText(/account deactivation and deletion.*isn't connected/i)).toBeInTheDocument();
    });
  });
});
