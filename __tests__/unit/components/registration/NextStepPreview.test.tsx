import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { NextStepPreview } from '@/features/seller/components/registration/NextStepPreview';

expect.extend(toHaveNoViolations);

// Mock i18n translation hook
jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'sellerOnboarding.assistant.nextRequired': 'Next Required',
        'sellerOnboarding.assistant.finalStep': 'Final Step: Review & Finish',
        'sellerOnboarding.assistant.timeline.notice': 'Verification typically completes within 24 hours.',
        'sellerOnboarding.progress.stepText': `Step ${params?.current} of ${params?.total}`,
        'sellerOnboarding.assistant.preview.loadingAria': 'Next step preview loading',
        'sellerOnboarding.assistant.preview.nextCardAria': 'Next step preview card',
        'sellerOnboarding.assistant.preview.finalBannerAria': 'Final step information banner',
        'sellerOnboarding.assistant.preview.errorBannerAria': 'Error loading next step preview',
        'sellerOnboarding.assistant.preview.loadingAnnouncement': 'Loading next step preview.',
        'sellerOnboarding.assistant.preview.nextAnnouncement': `Next required step: Step ${params?.current} of ${params?.total}: ${params?.title}.`,
        'sellerOnboarding.assistant.preview.finalAnnouncement': 'Onboarding complete: final review and finish.',
        'sellerOnboarding.assistant.preview.errorAnnouncement': 'Error: Invalid step information.',
        'sellerOnboarding.assistant.preview.errorTitle': 'Error Loading Next Step',
        'sellerOnboarding.assistant.preview.invalidStepDesc': 'The onboarding assistant received invalid step data.',
        'sellerOnboarding.assistant.preview.retry': 'Retry',
      };
      return translations[key] || key;
    },
    locale: 'en',
  }),
}));

describe('NextStepPreview Component', () => {
  it('renders skeleton loader when isLoading is true', () => {
    render(<NextStepPreview isLoading={true} />);
    expect(screen.getByTestId('next-step-preview-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('next-step-preview-card')).not.toBeInTheDocument();
  });

  it('renders final step banner when isFinalStep is true', () => {
    render(<NextStepPreview isFinalStep={true} />);
    expect(screen.getByTestId('next-step-preview-final')).toBeInTheDocument();
    expect(screen.getByText('Final Step: Review & Finish')).toBeInTheDocument();
    expect(screen.getByText('Verification typically completes within 24 hours.')).toBeInTheDocument();
  });

  it('renders next step card with correct details', () => {
    render(
      <NextStepPreview
        isFinalStep={false}
        stepNumber={2}
        totalSteps={5}
        nextStepTitle="Verify Identity"
        nextStepDescription="Provide government ID details"
      />
    );

    expect(screen.getByTestId('next-step-preview-card')).toBeInTheDocument();
    expect(screen.getByText('Next Required')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
    expect(screen.getByText('2. Verify Identity')).toBeInTheDocument();
    expect(screen.getByText('Provide government ID details')).toBeInTheDocument();
  });

  it('does not render description when it is undefined', () => {
    render(
      <NextStepPreview
        isFinalStep={false}
        stepNumber={2}
        totalSteps={5}
        nextStepTitle="Verify Identity"
      />
    );
    expect(screen.queryByTestId('next-step-preview-description')).not.toBeInTheDocument();
  });

  it('calls onStepAction when the next step CTA is clicked', () => {
    const onStepAction = jest.fn();
    render(
      <NextStepPreview
        isFinalStep={false}
        stepNumber={2}
        totalSteps={5}
        nextStepTitle="Verify Identity"
        onStepAction={onStepAction}
        stepActionLabel="Get Started"
      />
    );

    const button = screen.getByTestId('next-step-preview-action');
    expect(button).toHaveTextContent('Get Started');
    fireEvent.click(button);
    expect(onStepAction).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete when the final step CTA is clicked', () => {
    const onComplete = jest.fn();
    render(
      <NextStepPreview
        isFinalStep={true}
        onComplete={onComplete}
        completeLabel="Submit Registration"
      />
    );

    const button = screen.getByTestId('next-step-preview-action');
    expect(button).toHaveTextContent('Submit Registration');
    fireEvent.click(button);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('guards empty/whitespace nextStepTitle and falls back to error card', () => {
    render(
      <NextStepPreview
        isFinalStep={false}
        stepNumber={2}
        totalSteps={5}
        nextStepTitle="   "
      />
    );
    // Should render explicit error card instead of blank title or final step banner
    expect(screen.getByTestId('next-step-preview-error')).toBeInTheDocument();
  });

  it('guards invalid stepNumber values and falls back to error card', () => {
    const { rerender } = render(
      <NextStepPreview
        isFinalStep={false}
        stepNumber={-1}
        totalSteps={5}
        nextStepTitle="Valid Title"
      />
    );
    expect(screen.getByTestId('next-step-preview-error')).toBeInTheDocument();

    rerender(
      <NextStepPreview
        isFinalStep={false}
        stepNumber={NaN}
        totalSteps={5}
        nextStepTitle="Valid Title"
      />
    );
    expect(screen.getByTestId('next-step-preview-error')).toBeInTheDocument();
  });

  it('correctly handles single step flow (stepNumber=1, totalSteps=1)', () => {
    render(
      <NextStepPreview
        isFinalStep={false}
        stepNumber={1}
        totalSteps={1}
        nextStepTitle="Single Step"
      />
    );
    expect(screen.getByTestId('next-step-preview-card')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 1')).toBeInTheDocument();
  });

  it('renders correctly with an extremely long title (line-clamp verification)', () => {
    const longTitle = 'A'.repeat(500);
    render(
      <NextStepPreview
        isFinalStep={false}
        stepNumber={2}
        totalSteps={5}
        nextStepTitle={longTitle}
      />
    );
    const titleEl = screen.getByTestId('next-step-preview-title');
    expect(titleEl).toHaveTextContent(`2. ${longTitle}`);
    expect(titleEl).toHaveClass('line-clamp-2');
  });

  it('renders correctly with an extremely long description (line-clamp verification)', () => {
    const longDescription = 'B'.repeat(500);
    render(
      <NextStepPreview
        isFinalStep={false}
        stepNumber={2}
        totalSteps={5}
        nextStepTitle="Verify Identity"
        nextStepDescription={longDescription}
      />
    );
    const descEl = screen.getByTestId('next-step-preview-description');
    expect(descEl).toHaveTextContent(longDescription);
    expect(descEl).toHaveClass('line-clamp-3');
  });

  it('satisfies WCAG accessibility requirements using jest-axe', async () => {
    const { container: containerLoading } = render(<NextStepPreview isLoading={true} />);
    let results = await axe(containerLoading);
    expect(results).toHaveNoViolations();

    const { container: containerFinal } = render(<NextStepPreview isFinalStep={true} />);
    results = await axe(containerFinal);
    expect(results).toHaveNoViolations();

    const { container: containerCard } = render(
      <NextStepPreview
        isFinalStep={false}
        stepNumber={2}
        totalSteps={5}
        nextStepTitle="Verify Identity"
        nextStepDescription="Provide government ID details"
      />
    );
    results = await axe(containerCard);
    expect(results).toHaveNoViolations();

    const { container: containerError } = render(
      <NextStepPreview
        isError={true}
        errorMessage="Custom Error Message"
      />
    );
    results = await axe(containerError);
    expect(results).toHaveNoViolations();
  });

  it('renders explicit error card and handles retry callback', () => {
    const onRetry = jest.fn();
    render(
      <NextStepPreview
        isError={true}
        errorMessage="Test failure reason"
        onRetry={onRetry}
        retryLabel="Try Again"
      />
    );

    expect(screen.getByTestId('next-step-preview-error')).toBeInTheDocument();
    expect(screen.getByText('Error Loading Next Step')).toBeInTheDocument();
    expect(screen.getByText('Test failure reason')).toBeInTheDocument();

    const button = screen.getByTestId('next-step-preview-action');
    expect(button).toHaveTextContent('Try Again');
    fireEvent.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('uses localized ARIA landmark labels per state', () => {
    const { rerender } = render(<NextStepPreview isLoading={true} />);
    expect(screen.getByTestId('next-step-preview')).toHaveAttribute(
      'aria-label',
      'Next step preview loading'
    );

    rerender(<NextStepPreview isFinalStep={true} />);
    expect(screen.getByTestId('next-step-preview')).toHaveAttribute(
      'aria-label',
      'Final step information banner'
    );

    rerender(
      <NextStepPreview
        isFinalStep={false}
        stepNumber={2}
        totalSteps={5}
        nextStepTitle="Valid Step"
      />
    );
    expect(screen.getByTestId('next-step-preview')).toHaveAttribute(
      'aria-label',
      'Next step preview card'
    );

    rerender(<NextStepPreview isError={true} />);
    expect(screen.getByTestId('next-step-preview')).toHaveAttribute(
      'aria-label',
      'Error loading next step preview'
    );
  });

  it('restricts live-region announcements via visually hidden status region', () => {
    const { container, rerender } = render(<NextStepPreview isLoading={true} />);
    
    // Status announcer inside
    const announcer = container.querySelector('[role="status"]');
    expect(announcer).toBeInTheDocument();
    expect(announcer).toHaveClass('sr-only');
    expect(announcer).toHaveAttribute('aria-live', 'polite');
    expect(announcer).toHaveAttribute('aria-atomic', 'true');
    expect(announcer).toHaveTextContent('Loading next step preview.');

    rerender(
      <NextStepPreview
        isFinalStep={false}
        stepNumber={3}
        totalSteps={5}
        nextStepTitle="Review Details"
      />
    );
    expect(announcer).toHaveTextContent('Next required step: Step 3 of 5: Review Details.');

    rerender(<NextStepPreview isFinalStep={true} />);
    expect(announcer).toHaveTextContent('Onboarding complete: final review and finish.');

    rerender(<NextStepPreview isError={true} />);
    expect(announcer).toHaveTextContent('Error: Invalid step information.');
  });
});
