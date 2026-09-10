import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ProgressTracker } from '@/features/seller/components/registration/ProgressTracker';

expect.extend(toHaveNoViolations);

// Mock i18n translation hook
jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'sellerOnboarding.assistant.currentStep': 'Current Step',
        'sellerOnboarding.assistant.progress': 'Progress',
        'sellerOnboarding.assistant.saving': 'Auto-saving...',
        'sellerOnboarding.assistant.savedAt': `Saved ${params?.time}`,
        'sellerOnboarding.assistant.unknownStep': 'Unknown Step',
        'sellerOnboarding.assistant.saveErrorShort': 'Failed to save',
        'sellerOnboarding.assistant.completeEmoji': 'sparkles',
        'sellerOnboarding.assistant.stepCounter': `Step ${params?.current} of ${params?.total}`,
        'sellerOnboarding.assistant.progressLabel': `Step ${params?.step} of ${params?.total}. ${params?.percent}% complete.`,
      };
      return translations[key] || key;
    },
    locale: 'en',
  }),
}));

describe('ProgressTracker Component', () => {
  const defaultProps = {
    currentStep: 0,
    totalSteps: 5,
    stepTitle: 'Business Details',
    percentComplete: 20,
  };

  it('renders correctly with default props', () => {
    render(<ProgressTracker {...defaultProps} />);

    expect(screen.getByTestId('progress-tracker')).toBeInTheDocument();
    expect(screen.getByTestId('progress-tracker-step-title')).toHaveTextContent('1. Business Details');
    expect(screen.getByTestId('progress-tracker-step-counter')).toHaveTextContent('Step 1 of 5');
    expect(screen.getByTestId('progress-tracker-percentage')).toHaveTextContent('20%');
  });

  it('exposes correct ARIA progressbar semantics', () => {
    render(<ProgressTracker {...defaultProps} />);

    const progressBar = screen.getByTestId('progress-tracker-bar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('role', 'progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '20');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    expect(progressBar).toHaveAttribute(
      'aria-label',
      'Step 1 of 5. 20% complete.'
    );

    // Visual fill indicator must be hidden from screen readers
    const progressFill = screen.getByTestId('progress-tracker-fill');
    expect(progressFill).toHaveAttribute('aria-hidden', 'true');
    expect(progressFill).toHaveStyle({ width: '20%' });
  });

  it('clamps percentComplete values below 0 to 0', () => {
    render(<ProgressTracker {...defaultProps} percentComplete={-15} />);

    const progressBar = screen.getByTestId('progress-tracker-bar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByTestId('progress-tracker-percentage')).toHaveTextContent('0%');
    expect(screen.getByTestId('progress-tracker-fill')).toHaveStyle({ width: '0%' });
  });

  it('clamps percentComplete values above 100 to 100', () => {
    render(<ProgressTracker {...defaultProps} percentComplete={120} />);

    const progressBar = screen.getByTestId('progress-tracker-bar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByTestId('progress-tracker-percentage')).toHaveTextContent('100%');
    expect(screen.getByTestId('progress-tracker-fill')).toHaveStyle({ width: '100%' });
  });

  it('handles non-finite percentComplete values safely', () => {
    render(<ProgressTracker {...defaultProps} percentComplete={NaN} />);

    const progressBar = screen.getByTestId('progress-tracker-bar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByTestId('progress-tracker-percentage')).toHaveTextContent('0%');
    expect(screen.getByTestId('progress-tracker-fill')).toHaveStyle({ width: '0%' });
  });

  it('clamps currentStep to 1 if negative or NaN is passed', () => {
    const { rerender } = render(<ProgressTracker {...defaultProps} currentStep={-5} />);
    expect(screen.getByTestId('progress-tracker-step-title')).toHaveTextContent('1. Business Details');

    rerender(<ProgressTracker {...defaultProps} currentStep={NaN} />);
    expect(screen.getByTestId('progress-tracker-step-title')).toHaveTextContent('1. Business Details');
  });

  it('falls back gracefully on empty stepTitle', () => {
    render(<ProgressTracker {...defaultProps} stepTitle="" />);
    expect(screen.getByTestId('progress-tracker-step-title')).toHaveTextContent('1. Unknown Step');
  });

  it('displays saving spinner when isSaving is true', () => {
    render(<ProgressTracker {...defaultProps} isSaving={true} />);

    expect(screen.getByTestId('progress-tracker-saving')).toBeInTheDocument();
    expect(screen.getByText('Auto-saving...')).toBeInTheDocument();
    expect(screen.queryByTestId('progress-tracker-saved')).not.toBeInTheDocument();
    expect(screen.queryByTestId('progress-tracker-error')).not.toBeInTheDocument();
  });

  it('displays lastSaved time when provided and not saving', () => {
    render(<ProgressTracker {...defaultProps} lastSaved="12:45 PM" />);

    expect(screen.getByTestId('progress-tracker-saved')).toBeInTheDocument();
    expect(screen.getByText('Saved 12:45 PM')).toBeInTheDocument();
    expect(screen.queryByTestId('progress-tracker-saving')).not.toBeInTheDocument();
    expect(screen.queryByTestId('progress-tracker-error')).not.toBeInTheDocument();
  });

  it('displays saveError state prioritizing over saving and saved states', () => {
    render(
      <ProgressTracker
        {...defaultProps}
        isSaving={true}
        lastSaved="12:45 PM"
        saveError={true}
      />
    );

    expect(screen.getByTestId('progress-tracker-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to save')).toBeInTheDocument();
    expect(screen.queryByTestId('progress-tracker-saving')).not.toBeInTheDocument();
    expect(screen.queryByTestId('progress-tracker-saved')).not.toBeInTheDocument();
  });

  it('displays sparkles emoji when isComplete is true', () => {
    render(<ProgressTracker {...defaultProps} isComplete={true} />);

    const sparkles = screen.getByText('✨');
    expect(sparkles).toBeInTheDocument();
    expect(sparkles).toHaveAttribute('aria-label', 'sparkles');
  });

  it('is wrapped in React.memo for rendering optimization', () => {
    expect((ProgressTracker as any).$$typeof).toBe(Symbol.for('react.memo'));
    expect(ProgressTracker.displayName).toBe('ProgressTracker');
  });

  it('should pass accessibility compliance scan', async () => {
    const { container } = render(<ProgressTracker {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
