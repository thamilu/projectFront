import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { TabContent } from '@/features/users/components/TabContent';
import { PROFILE_TABS } from '@/features/users/utils/profile.constants';

jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => false,
    motion: new Proxy(
      {},
      {
        get:
          (_target, tag: string) =>
          ({
            variants: _variants,
            initial: _initial,
            animate: _animate,
            exit: _exit,
            transition: _transition,
            ...rest
          }: Record<string, unknown>) =>
            React.createElement(tag, rest),
      }
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

const mockSharedActions = {
  onSubmit: jest.fn(),
  onBack: jest.fn(),
} as any;

let shouldThrowError = false;
let shouldSuspend = false;

// Mock lazy components
jest.mock('@/features/users/components/tabs/PersonalTab', () => ({
  PersonalTab: () => {
    if (shouldSuspend) {
      throw new Promise(() => {}); // Throw a promise to trigger Suspense fallback
    }
    if (shouldThrowError) {
      throw new Error('Chunk load failed');
    }
    return <div data-testid="personal-tab">Mock Personal Tab Content</div>;
  },
}));
jest.mock('@/features/users/components/tabs/AddressTab', () => ({
  AddressTab: () => <div data-testid="address-tab">Mock Address Tab Content</div>,
}));

describe('TabContent', () => {
  beforeAll(async () => {
    await import('@/features/users/components/tabs/PersonalTab');
    await import('@/features/users/components/tabs/AddressTab');
  });

  beforeEach(() => {
    shouldThrowError = false;
    shouldSuspend = false;
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders personal tab correctly', async () => {
      render(<TabContent activeTab={PROFILE_TABS.PERSONAL} sharedActions={mockSharedActions} />);

      await waitFor(() => {
        expect(screen.getByText('Personal Information')).toBeInTheDocument();
        expect(screen.getByTestId('personal-tab')).toBeInTheDocument();
      });
    });

    it('renders address tab correctly', async () => {
      render(<TabContent activeTab={PROFILE_TABS.ADDRESS} sharedActions={mockSharedActions} />);

      await waitFor(() => {
        expect(screen.getByText('Addresses')).toBeInTheDocument();
      });
    });

    it('returns null for unknown tab', () => {
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const { container } = render(
        <TabContent activeTab={'unknown' as any} sharedActions={mockSharedActions} />
      );
      expect(container.firstChild).toBeNull();
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('TabContent: No config found for tab "unknown"')
      );
      consoleWarn.mockRestore();
    });
  });

  describe('loading states', () => {
    it('shows full skeleton on initial load', () => {
      shouldSuspend = true;
      render(
        <TabContent
          activeTab={PROFILE_TABS.PERSONAL}
          sharedActions={mockSharedActions}
          isInitialLoad
        />
      );
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading your profile');
    });

    it('shows compact skeleton on tab switch', () => {
      shouldSuspend = true;
      render(
        <TabContent
          activeTab={PROFILE_TABS.PERSONAL}
          sharedActions={mockSharedActions}
          isInitialLoad={false}
        />
      );
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading personal details');
    });
  });

  describe('accessibility', () => {
    it('renders tabpanel with correct ARIA attributes', async () => {
      render(<TabContent activeTab={PROFILE_TABS.PERSONAL} sharedActions={mockSharedActions} />);

      await waitFor(() => {
        const panel = screen.getByRole('tabpanel');
        expect(panel).toHaveAttribute('id', 'tabpanel-personal');
        expect(panel).toHaveAttribute('aria-labelledby', 'tab-personal');
        expect(panel).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('error handling', () => {
    it('renders error fallback when tab chunk fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      shouldThrowError = true;

      render(<TabContent activeTab={PROFILE_TABS.PERSONAL} sharedActions={mockSharedActions} />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load this section/i)).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });
  });

  describe('snapshots', () => {
    it('matches snapshot', async () => {
      const { container } = render(
        <TabContent activeTab={PROFILE_TABS.PERSONAL} sharedActions={mockSharedActions} />
      );
      await waitFor(() => {
        expect(screen.getByText('Mock Personal Tab Content')).toBeInTheDocument();
      });
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
