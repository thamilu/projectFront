// ============================================================
// __tests__/unit/app/account-profile-error.test.tsx
// app/(customer)/account/profile/error.tsx
// Priority: assistive tech users must actually be informed an error
// occurred (focus moves to the heading, matching the established sibling
// pattern in app/(auth)/login/error.tsx), and "Go Home" must be a real
// client-side navigation, not a full page reload via a raw <a href>.
// ============================================================

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileError from '@/app/(customer)/account/profile/error';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/core/telemetry/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/core/telemetry/metrics', () => ({
  recordMetric: jest.fn(),
}));

function makeError(overrides: Partial<Error & { digest?: string }> = {}) {
  const error = new Error('Something broke') as Error & { digest?: string };
  Object.assign(error, overrides);
  return error;
}

const mockWriteText = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
  jest.clearAllMocks();
  // Re-applied before every test, not just once at module load: any
  // earlier test that calls userEvent.setup() installs userEvent's own
  // internal navigator.clipboard stub (for its user.copy()/paste() APIs),
  // silently overwriting this mock for the rest of the file's test run.
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: mockWriteText },
    configurable: true,
  });
});

describe('ProfileError', () => {
  it('moves focus to the heading on mount, so screen reader/keyboard users are informed', () => {
    render(<ProfileError error={makeError()} reset={jest.fn()} />);

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toHaveFocus();
  });

  it('calls reset() when "Try again" is clicked', async () => {
    const user = userEvent.setup();
    const reset = jest.fn();
    render(<ProfileError error={makeError()} reset={reset} />);

    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('navigates home via the router (client-side), not a full page reload', async () => {
    const user = userEvent.setup();
    render(<ProfileError error={makeError()} reset={jest.fn()} />);

    const goHomeButton = screen.getByRole('button', { name: /go home/i });
    expect(goHomeButton.tagName).toBe('BUTTON');

    await user.click(goHomeButton);

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('shows the error digest when present', () => {
    render(<ProfileError error={makeError({ digest: 'abc-123' })} reset={jest.fn()} />);
    expect(screen.getByText('abc-123')).toBeInTheDocument();
  });
});

describe('ProfileError — retry limiting', () => {
  it('disables the retry button and stops calling reset() after the retry cap is hit', async () => {
    const user = userEvent.setup();
    const reset = jest.fn();
    render(<ProfileError error={makeError()} reset={reset} />);

    const retryButton = () => screen.getByRole('button', { name: /try again|max retries reached/i });

    await user.click(retryButton());
    await user.click(retryButton());
    await user.click(retryButton());
    expect(reset).toHaveBeenCalledTimes(3);

    // Button is now disabled with a different label — a further click must
    // not fire reset() again (rapid clicking during a real outage was the
    // exact scenario flooding telemetry with duplicate entries).
    expect(retryButton()).toBeDisabled();
    expect(retryButton()).toHaveTextContent(/max retries reached/i);

    await user.click(retryButton());
    expect(reset).toHaveBeenCalledTimes(3);
  });

  it('does not re-log the same error occurrence just because the retry count changed', async () => {
    const { logger } = jest.requireMock('@/core/telemetry/logger');
    const user = userEvent.setup();
    render(<ProfileError error={makeError()} reset={jest.fn()} />);

    expect(logger.error).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /try again/i }));

    // reset() didn't actually cause Next.js to re-render with a new error
    // prop in this test (same `error` object throughout) — the retry-count
    // state change alone must not trigger a second log of the same error.
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it('shows a "still having trouble" message once retries are exhausted', async () => {
    const user = userEvent.setup();
    render(<ProfileError error={makeError()} reset={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: /try again/i }));
    await user.click(screen.getByRole('button', { name: /try again/i }));
    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.getByText(/still having trouble/i)).toBeInTheDocument();
  });
});

describe('ProfileError — copy error ID', () => {
  it('copies the digest to the clipboard and shows a confirmation state', async () => {
    render(<ProfileError error={makeError({ digest: 'abc-123' })} reset={jest.fn()} />);

    // Uses the static userEvent.click() API here specifically, not
    // userEvent.setup() — setup() installs its own internal navigator.
    // clipboard stub (for its user.copy()/paste() APIs), which silently
    // overrides the Object.defineProperty mock above and would make this
    // assertion fail against userEvent's stub instead of our mock.
    await userEvent.click(screen.getByRole('button', { name: /copy error id/i }));

    expect(mockWriteText).toHaveBeenCalledWith('abc-123');
    expect(screen.getByRole('button', { name: /copied error id/i })).toBeInTheDocument();
  });
});
