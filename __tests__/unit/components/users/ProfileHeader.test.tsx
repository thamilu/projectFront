import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import {
  ProfileHeader,
  ProfileHeaderSkeleton,
  deriveProfileDisplayData,
} from '@/features/users/components/ProfileHeader';
import type { Session } from 'next-auth';
import type { ProfileValues } from '@/shared/schemas/user.schema';

function FormWrapper({
  children,
  defaultValues,
}: {
  children: React.ReactNode;
  defaultValues?: Partial<ProfileValues>;
}) {
  const methods = useForm<ProfileValues>({
    defaultValues: defaultValues as ProfileValues,
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('ProfileHeader Component & Helpers', () => {
  const mockSession: Session = {
    user: {
      id: 'user-123',
      roles: ['USER'],
      firstName: 'Jane',
      lastName: 'Doe',
      name: 'Jane Doe',
      email: 'jane@example.com',
      image: 'https://example.com/avatar.jpg',
    },
    expires: '2026-12-31T23:59:59.999Z',
    backendRoleError: undefined,
  };

  describe('deriveProfileDisplayData', () => {
    it('derives correctly for seller role', () => {
      const derived = deriveProfileDisplayData(mockSession, true);
      expect(derived.userName).toBe('Jane Doe');
      expect(derived.userEmail).toBe('jane@example.com');
      expect(derived.avatarUrl).toBe('https://example.com/avatar.jpg');
      expect(derived.initial).toBe('J');
      expect(derived.roleLabel).toBe('Seller');
    });

    it('derives correctly for customer role', () => {
      const derived = deriveProfileDisplayData(mockSession, false);
      expect(derived.roleLabel).toBe('Customer');
    });

    it('falls back to "User" when name is null/undefined', () => {
      const session = {
        ...mockSession,
        user: { ...mockSession.user, name: undefined },
      } as Session;
      const result = deriveProfileDisplayData(session, false);
      expect(result.userName).toBe('User');
      expect(result.initial).toBe('U');
    });

    it('falls back to "User" when name is an empty string', () => {
      const session = {
        ...mockSession,
        user: { ...mockSession.user, name: '' },
      } as Session;
      const result = deriveProfileDisplayData(session, false);
      expect(result.userName).toBe('User');
      expect(result.initial).toBe('U');
    });

    it('falls back to DEFAULT_INITIAL when name is whitespace-only', () => {
      const session = {
        ...mockSession,
        user: { ...mockSession.user, name: '   ' },
      } as Session;
      const result = deriveProfileDisplayData(session, false);
      expect(result.initial).toBe('U');
    });

    it('returns undefined userEmail when email is empty string or missing', () => {
      const emptyEmailSession = {
        ...mockSession,
        user: { ...mockSession.user, email: '' },
      } as Session;
      const result = deriveProfileDisplayData(emptyEmailSession, false);
      expect(result.userEmail).toBeUndefined();
    });

    it('converts null image to undefined', () => {
      const nullImageSession = {
        ...mockSession,
        user: { ...mockSession.user, image: null },
      } as unknown as Session;
      const result = deriveProfileDisplayData(nullImageSession, false);
      expect(result.avatarUrl).toBeUndefined();
    });

    it('handles completely missing fields gracefully', () => {
      const emptySession = {
        user: {
          id: 'user-123',
          roles: [],
          firstName: '',
          lastName: '',
        },
        expires: '',
        backendRoleError: undefined,
      } as Session;
      const derived = deriveProfileDisplayData(emptySession, false);
      expect(derived.userName).toBe('User');
      expect(derived.userEmail).toBeUndefined();
      expect(derived.avatarUrl).toBeUndefined();
      expect(derived.initial).toBe('U');
    });
  });

  describe('ProfileHeader Rendering', () => {
    it('renders avatar, name, and email correctly', () => {
      render(<ProfileHeader session={mockSession} hasSellerProfile={true} />);

      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('Seller')).toBeInTheDocument();
    });

    it('uses specified headingLevel tag', () => {
      const { container } = render(
        <ProfileHeader session={mockSession} hasSellerProfile={true} headingLevel="h3" />
      );
      const heading = container.querySelector('h3');
      expect(heading).toBeInTheDocument();
      expect(heading?.textContent).toContain('Jane Doe');
    });

    it('conditionally renders upload photo button', () => {
      const { rerender } = render(<ProfileHeader session={mockSession} hasSellerProfile={false} />);
      expect(
        screen.queryByRole('button', { name: /change profile photo/i })
      ).not.toBeInTheDocument();

      const onUploadPhotoMock = jest.fn();
      rerender(
        <ProfileHeader
          session={mockSession}
          hasSellerProfile={false}
          onUploadPhoto={onUploadPhotoMock}
        />
      );
      const btn = screen.getByRole('button', { name: /change profile photo/i });
      expect(btn).toBeInTheDocument();
      btn.click();
      expect(onUploadPhotoMock).toHaveBeenCalledTimes(1);
    });

    it('shows loading spinner and disables button when uploading photo', () => {
      const onUploadPhotoMock = jest.fn();
      render(
        <ProfileHeader
          session={mockSession}
          hasSellerProfile={false}
          onUploadPhoto={onUploadPhotoMock}
          isUploadingPhoto={true}
        />
      );

      const btn = screen.getByRole('button', { name: /uploading photo\.\.\./i });
      expect(btn).toBeDisabled();
      expect(btn.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('ProfileHeader — account metadata', () => {
    it('never renders a fabricated "Last Active" row or "online" presence dot', () => {
      render(
        <ProfileHeader
          session={mockSession}
          hasSellerProfile={false}
          accountMeta={{ createdAt: '2024-03-15T00:00:00Z', emailVerified: true }}
        />
      );

      expect(screen.queryByText(/last active/i)).not.toBeInTheDocument();
      expect(screen.queryByTitle('Online Status')).not.toBeInTheDocument();
    });

    it('shows "Checking…" for Verification while accountMeta has not resolved yet', () => {
      render(<ProfileHeader session={mockSession} hasSellerProfile={false} accountMeta={null} />);

      expect(screen.getByText('Checking…')).toBeInTheDocument();
      expect(screen.queryByText('Verified')).not.toBeInTheDocument();
    });

    it('shows the real Verified state and checkmark when emailVerified is true', () => {
      render(
        <ProfileHeader
          session={mockSession}
          hasSellerProfile={false}
          accountMeta={{ emailVerified: true }}
        />
      );

      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByLabelText('Verified account')).toBeInTheDocument();
    });

    it('shows "Not Verified" and no checkmark when emailVerified is false', () => {
      render(
        <ProfileHeader
          session={mockSession}
          hasSellerProfile={false}
          accountMeta={{ emailVerified: false }}
        />
      );

      expect(screen.getByText('Not Verified')).toBeInTheDocument();
      expect(screen.queryByLabelText('Verified account')).not.toBeInTheDocument();
    });

    it('shows the real Member Since date from accountMeta.createdAt', () => {
      render(
        <ProfileHeader
          session={mockSession}
          hasSellerProfile={false}
          accountMeta={{ createdAt: '2024-03-15T00:00:00Z' }}
        />
      );

      expect(screen.getByText('March 2024')).toBeInTheDocument();
    });

    it('does not display KYC status row when user is not a seller', () => {
      render(<ProfileHeader session={mockSession} hasSellerProfile={false} accountMeta={null} />);
      expect(screen.queryByText('KYC Status')).not.toBeInTheDocument();
    });

    it('shows KYC Status row when user is a seller', () => {
      render(
        <ProfileHeader
          session={mockSession}
          hasSellerProfile={true}
          accountMeta={{ sellerStatus: 'ACTIVE' }}
        />
      );

      expect(screen.getByText('KYC Status')).toBeInTheDocument();
      expect(screen.getByText('KYC Verified')).toBeInTheDocument();
    });
  });

  describe('ProfileHeader — completion tracker', () => {
    it('shows 100% complete when all 4 core fields are filled', () => {
      render(
        <FormWrapper
          defaultValues={{
            firstName: 'Jane',
            lastName: 'Doe',
            phone: '+919876543210',
            dateOfBirth: '1990-01-01',
          }}
        >
          <ProfileHeader session={mockSession} hasSellerProfile={false} />
        </FormWrapper>
      );

      expect(screen.getByText('Profile 100% complete')).toBeInTheDocument();
    });

    it('shows remaining details when fields are missing', () => {
      render(
        <FormWrapper
          defaultValues={{
            firstName: 'Jane',
            lastName: 'Doe',
            phone: '',
            dateOfBirth: '',
          }}
        >
          <ProfileHeader session={mockSession} hasSellerProfile={false} />
        </FormWrapper>
      );

      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('2 details remaining')).toBeInTheDocument();
    });

    it('calls onEdit when "Complete profile" is clicked', async () => {
      const user = userEvent.setup();
      const onEdit = jest.fn();

      render(
        <FormWrapper defaultValues={{ firstName: 'Jane', lastName: '', phone: '', dateOfBirth: '' }}>
          <ProfileHeader session={mockSession} hasSellerProfile={false} onEdit={onEdit} />
        </FormWrapper>
      );

      await user.click(screen.getByRole('button', { name: /complete profile/i }));
      expect(onEdit).toHaveBeenCalledTimes(1);
    });
  });

  describe('ProfileHeaderSkeleton', () => {
    it('renders skeleton items successfully with correct accessible attributes', () => {
      render(<ProfileHeaderSkeleton />);
      const skeleton = screen.getByLabelText('Loading profile header');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });
  });
});
