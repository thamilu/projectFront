/**
 * Regression test for the platform/design-system review finding: the
 * RuntimeTelemetryPanel (an internal diagnostics HUD exposing live
 * circuit-breaker state and API metrics) was rendered unconditionally by
 * HydrationTracker, which is mounted in every page via app/layout.tsx —
 * meaning every production visitor could open it. It must never render
 * when NODE_ENV is 'production'.
 */
import { render, screen, waitFor } from '@testing-library/react';
import HydrationTracker from '@/core/providers/hydration-tracker';

jest.mock('@/platform/observability/RuntimeTelemetryPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="telemetry-panel" />,
}));

jest.mock('@/platform/observability', () => ({
  observability: { trackHydrationTime: jest.fn() },
}));

describe('HydrationTracker', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    (process.env as { NODE_ENV: string }).NODE_ENV = originalNodeEnv as string;
  });

  it('never renders the telemetry panel in production', async () => {
    (process.env as { NODE_ENV: string }).NODE_ENV = 'production';
    render(<HydrationTracker />);

    // Give any (incorrect) async dynamic-import resolution a chance to run
    // before asserting absence, so this test would actually fail if the
    // panel were rendered asynchronously rather than synchronously gated.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByTestId('telemetry-panel')).not.toBeInTheDocument();
  });

  it('renders the telemetry panel outside production', async () => {
    (process.env as { NODE_ENV: string }).NODE_ENV = 'development';
    render(<HydrationTracker />);

    await waitFor(() => {
      expect(screen.getByTestId('telemetry-panel')).toBeInTheDocument();
    });
  });
});
