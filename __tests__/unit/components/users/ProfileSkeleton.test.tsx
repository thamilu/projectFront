import { render, screen } from '@testing-library/react';
import { ProfileSkeleton } from '@/features/users/components/ProfileSkeleton';
import { SKELETON_DIMS } from '@/features/users/components/ProfileSkeleton/profileSkeleton.constants';
import { AVATAR_SIZE } from '@/features/users/components/ProfileHeader/profileHeader.constants';

describe('ProfileSkeleton', () => {
  // Regression/drift guard: SKELETON_DIMS.avatarFull is kept in sync with
  // ProfileHeader's AVATAR_SIZE by hand (see profileSkeleton.constants.ts's
  // doc comment for why it isn't imported directly). Without this test, a
  // future change to AVATAR_SIZE could silently drift from what the
  // skeleton renders, reintroducing the avatar-size CLS bug fixed earlier —
  // this makes that drift a failing test instead of a silent regression.
  it('keeps SKELETON_DIMS.avatarFull in sync with ProfileHeader.AVATAR_SIZE', () => {
    expect(SKELETON_DIMS.avatarFull).toBe(AVATAR_SIZE);
  });
  describe('variant="full" (default)', () => {
    it('renders with correct ARIA attributes', () => {
      render(<ProfileSkeleton />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-busy', 'true');
      expect(status).toHaveAttribute('aria-live', 'polite');
      expect(status).toHaveAttribute('aria-atomic', 'true');
      expect(status).toHaveAttribute('aria-label', 'Loading your profile');
    });

    it('renders full skeleton structure', () => {
      const { container } = render(<ProfileSkeleton />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('variant="compact"', () => {
    it('renders compact ARIA label', () => {
      render(<ProfileSkeleton variant="compact" />);

      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading section data');
    });

    it('has complete ARIA accessibility attributes', () => {
      render(<ProfileSkeleton variant="compact" />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
      expect(status).toHaveAttribute('aria-busy', 'true');
      expect(status).toHaveAttribute('aria-atomic', 'true');
    });

    it('renders compact skeleton structure', () => {
      const { container } = render(<ProfileSkeleton variant="compact" />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('className merging', () => {
    it('applies custom className to container', () => {
      const { container } = render(<ProfileSkeleton className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('merges custom className with full variant container classes', () => {
      const { container } = render(<ProfileSkeleton className="custom-test-class" />);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('custom-test-class');
      expect(element).toHaveClass('mx-auto');
    });

    it('merges custom className with compact variant container classes', () => {
      const { container } = render(
        <ProfileSkeleton variant="compact" className="custom-compact" />
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('custom-compact');
      expect(element).toHaveClass('w-full');
    });
  });
});
