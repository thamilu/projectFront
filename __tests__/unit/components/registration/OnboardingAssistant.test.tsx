import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingAssistant, OnboardingAssistantErrorFallback } from '@/features/seller/components/registration/OnboardingAssistant';

// Mock STEPS constants to be dynamic and initialized inside the hoisted factory to avoid TDZ errors
jest.mock('@/features/seller/constants/seller-form-steps', () => {
  const original = jest.requireActual('@/features/seller/constants/seller-form-steps');
  (global as any).__MOCK_STEPS__ = [
    { id: 'personal-info', title: 'Personal', description: 'Contact details' },
    { id: 'permanent-address', title: 'Address', description: 'Residential info', requiresDocumentChecklist: true },
    { id: 'identity', title: 'Identity', description: 'Business type', requiresDocumentChecklist: true },
    { id: 'kyc', title: 'Legal', description: 'KYC Verification', requiresDocumentChecklist: true },
    { id: 'store', title: 'Store', description: 'Shop setup' },
    { id: 'terms', title: 'Terms', description: 'Agreement' },
  ];
  return {
    ...original,
    get STEPS() {
      return (global as any).__MOCK_STEPS__;
    },
  };
});

// Mock i18n translation hook
jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'sellerOnboarding.assistant.ariaLabel': 'Seller onboarding progress',
        'sellerOnboarding.assistant.currentStep': 'Current Step',
        'sellerOnboarding.assistant.progress': 'Progress',
        'sellerOnboarding.assistant.timeLeft': 'Time Left',
        'sellerOnboarding.assistant.timeLeftValue': `${params?.minutes} mins`,
        'sellerOnboarding.assistant.security': 'Security',
        'sellerOnboarding.assistant.securityValue': '256-Bit SSL',
        'sellerOnboarding.assistant.nextRequired': 'Next Required',
        'sellerOnboarding.assistant.finalStep': 'Final Step: Review & Finish',
        'sellerOnboarding.assistant.requiredDocuments': 'Required Documents',
        'sellerOnboarding.assistant.approvalTimeline': 'Approval Timeline',
        'sellerOnboarding.assistant.needAssistance': 'Need Assistance?',
        'sellerOnboarding.assistant.chatSupport': 'Chat with Support',
        'sellerOnboarding.assistant.emailSupport': 'Email Support',
        'sellerOnboarding.assistant.emailSupportLabel': 'Email Support (opens email client)',
        'sellerOnboarding.assistant.stepCounter': `Step ${params?.current} of ${params?.total}`,
        'sellerOnboarding.assistant.progressLabel': `Step ${params?.step} of ${params?.total}. ${params?.percent}% complete.`,
        'sellerOnboarding.assistant.completeEmoji': 'sparkles',
        'sellerOnboarding.assistant.saveErrorShort': 'Failed to save',
        'sellerOnboarding.assistant.openingChat': 'Opening Chat...',
        'sellerOnboarding.assistant.saveError': 'Failed to save progress. Please check connection.',
        'sellerOnboarding.assistant.timeline.ariaLabel': 'Approval stages',
        'sellerOnboarding.assistant.timeline.register': 'Register',
        'sellerOnboarding.assistant.timeline.verify': 'Verify',
        'sellerOnboarding.assistant.timeline.launch': 'Launch',
        'sellerOnboarding.assistant.timeline.notice': 'Verification typically completes within 24 hours.',
        'sellerOnboarding.assistant.docs.pan': 'PAN Card',
        'sellerOnboarding.assistant.docs.panHint': 'Individual/Business',
        'sellerOnboarding.assistant.docs.aadhar': 'Aadhaar Card',
        'sellerOnboarding.assistant.docs.aadharHint': 'Verification',
        'sellerOnboarding.assistant.docs.gstin': 'GSTIN',
        'sellerOnboarding.assistant.docs.gstinHint': 'Optional',
        'sellerOnboarding.assistant.docs.bank': 'Active Bank Account Details',
        'sellerOnboarding.assistant.docs.ssn': 'SSN or EIN',
        'sellerOnboarding.assistant.docs.govId': 'Government ID',
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
        'sellerOnboarding.assistant.errorFallback': 'Onboarding assistant unavailable. Please refresh.',
        'sellerOnboarding.assistant.saving': 'Auto-saving...',
        'sellerOnboarding.assistant.savedAt': `Saved ${params?.time}`,
        'sellerOnboarding.assistant.unknownStep': 'Unknown Step',
        'sellerOnboarding.assistant.skipToForm': 'Skip to onboarding form',
        'common.save': 'Saved',
      };
      return translations[key] || key;
    },
    locale: 'en',
  }),
}));

describe('OnboardingAssistant Component', () => {
  beforeEach(() => {
    // Reset mock steps
    (global as any).__MOCK_STEPS__ = [
      { id: 'personal-info', title: 'Personal', description: 'Contact details' },
      { id: 'permanent-address', title: 'Address', description: 'Residential info', requiresDocumentChecklist: true },
      { id: 'identity', title: 'Identity', description: 'Business type', requiresDocumentChecklist: true },
      { id: 'kyc', title: 'Legal', description: 'KYC Verification', requiresDocumentChecklist: true },
      { id: 'store', title: 'Store', description: 'Shop setup' },
      { id: 'terms', title: 'Terms', description: 'Agreement' },
    ];
  });

  it('correctly calculates progress percentages (off-by-one index fix)', () => {
    // Step 1 (index 0) of 6 should be Math.round((1/6) * 100) = 17%
    const { rerender } = render(<OnboardingAssistant currentStep={0} />);
    expect(screen.getByText('17%')).toBeInTheDocument();

    // Step 6 (index 5) of 6 should be 100%
    rerender(<OnboardingAssistant currentStep={5} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('handles step bounds overflow safely', () => {
    // Index -5 should be clamped to Step 1 (17%)
    const { rerender } = render(<OnboardingAssistant currentStep={-5} />);
    expect(screen.getByText('17%')).toBeInTheDocument();

    // Index 10 should be clamped to Step 6 (100%)
    rerender(<OnboardingAssistant currentStep={10} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('handles NaN currentStep input safely without crashing', () => {
    // NaN input should fallback safely to Step 1 (17%)
    render(<OnboardingAssistant currentStep={NaN} />);
    expect(screen.getByText('17%')).toBeInTheDocument();
  });

  it('renders required document checks per active step config and market config', () => {
    // Steps with requiresDocumentChecklist = true should show Document Checklist (e.g. index 2)
    const { rerender } = render(<OnboardingAssistant currentStep={2} market="IN" />);
    expect(screen.getByRole('heading', { name: /Required Documents/i, level: 4 })).toBeInTheDocument();
    expect(screen.getByText(/PAN Card/i)).toBeInTheDocument();
    expect(screen.getByText(/Aadhaar Card/i)).toBeInTheDocument();

    // US market document checks
    rerender(<OnboardingAssistant currentStep={2} market="US" />);
    expect(screen.getByText(/SSN or EIN/i)).toBeInTheDocument();
    expect(screen.queryByText(/PAN Card/i)).not.toBeInTheDocument();

    // Step 0 does not require documents checklist
    rerender(<OnboardingAssistant currentStep={0} market="IN" />);
    expect(screen.queryByRole('heading', { name: /Required Documents/i, level: 4 })).not.toBeInTheDocument();
  });

  it('renders status indicators (isSaving, saveError, and lastSaved)', () => {
    const { rerender } = render(
      <OnboardingAssistant currentStep={0} isSaving={true} />
    );
    expect(screen.getAllByText('Auto-saving...')[0]).toBeInTheDocument();

    rerender(<OnboardingAssistant currentStep={0} lastSaved=" 22:15:33 " />);
    expect(screen.getAllByText(/Saved 22:15:33/i)[0]).toBeInTheDocument();

    // Save error banner must be rendered
    rerender(<OnboardingAssistant currentStep={0} saveError={true} />);
    expect(screen.getByTestId('onboarding-assistant-save-error')).toHaveTextContent(/Failed to save progress/i);
  });

  it('fires support callback click when chat is configured', () => {
    const onSupportClick = jest.fn();
    render(<OnboardingAssistant currentStep={0} onSupportClick={onSupportClick} />);

    // Support section renders a real button when onSupportClick is present
    const supportBtn = screen.getByRole('button', { name: /Chat with Support/i });
    fireEvent.click(supportBtn);

    expect(onSupportClick).toHaveBeenCalledTimes(1);
  });

  it('falls back to email client mailto link when no support callback is present', () => {
    render(<OnboardingAssistant currentStep={0} />);

    // Support section renders an anchor link when onSupportClick is undefined
    const emailLink = screen.getByRole('link', { name: /Email Support/i });
    expect(emailLink).toHaveAttribute('href');
    expect(emailLink.getAttribute('href')).toContain('mailto:');
  });

  it('ensures correct WCAG A11y attributes are present', () => {
    render(<OnboardingAssistant currentStep={2} />);

    // Accessible aside landmark landmark
    const asideLandmark = screen.getByRole('complementary', { name: /Seller onboarding progress/i });
    expect(asideLandmark).toBeInTheDocument();

    // Screen reader polite announcement live region
    const liveRegion = screen.getAllByRole('status').find(
      (el) => el.getAttribute('aria-live') === 'polite'
    );
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');

    // Semantic ordered list for approval stages
    const timelineList = screen.getByRole('list', { name: /Approval stages/i });
    expect(timelineList.tagName.toLowerCase()).toBe('ol');
  });

  it('throws an error during module load when STEPS configuration is empty', () => {
    (global as any).__MOCK_STEPS__ = [];
    expect(() => {
      jest.isolateModules(() => {
        require('@/features/seller/components/registration/OnboardingAssistant');
      });
    }).toThrow(/STEPS configuration array is empty/);
  });

  it('renders fallback UI when ErrorFallback is directly rendered', () => {
    render(<OnboardingAssistantErrorFallback />);
    expect(screen.getByRole('alert')).toHaveTextContent(/Onboarding assistant unavailable/i);
  });

  describe('ApprovalTimeline Integration', () => {
    it('sets aria-current="step" on the active stage', () => {
      const { rerender } = render(<OnboardingAssistant currentStep={0} currentStage="register" />);
      
      const registerStep = screen.getByText('Register').closest('li');
      expect(registerStep).toHaveAttribute('aria-current', 'step');
      
      const verifyStep = screen.getByText('Verify').closest('li');
      expect(verifyStep).not.toHaveAttribute('aria-current');

      // Change stage to verify
      rerender(<OnboardingAssistant currentStep={0} currentStage="verify" />);
      expect(screen.getByText('Verify').closest('li')).toHaveAttribute('aria-current', 'step');
      expect(screen.getByText('Register').closest('li')).not.toHaveAttribute('aria-current');
    });

    it('renders a checkmark icon for completed stages', () => {
      render(<OnboardingAssistant currentStep={0} currentStage="verify" />);
      
      const registerStep = screen.getByText('Register').closest('li')!;
      const checkIcon = registerStep.querySelector('svg');
      expect(checkIcon).toBeInTheDocument();
      expect(checkIcon).toHaveClass('h-3.5 w-3.5');
    });

    it('ensures arrows use role="presentation" to prevent screen reader list counting issues', () => {
      render(<OnboardingAssistant currentStep={0} />);
      
      // Should find exactly 3 list items because role="presentation" on the arrow <li> removes them from screen readers list count
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBe(3);
    });

    it('applies RTL mirror CSS classes on arrow icons', () => {
      render(<OnboardingAssistant currentStep={0} />);
      
      const timelineList = screen.getByRole('list', { name: /Approval stages/i });
      const arrowIcon = timelineList.querySelector('svg.rtl\\:rotate-180');
      expect(arrowIcon).toBeInTheDocument();
    });
  });

  describe('NextStepPreview Integration', () => {
    it('renders NextStepPreview skeleton when isLoading is passed as true', () => {
      render(<OnboardingAssistant currentStep={0} isLoading={true} />);
      expect(screen.getByTestId('next-step-preview-skeleton')).toBeInTheDocument();
    });

    it('updates next step preview content when step advances', async () => {
      const { rerender } = render(<OnboardingAssistant currentStep={0} />);
      // Next step of 0 (Step 1) is Step 2 ("Address")
      expect(await screen.findByText('2. Address')).toBeInTheDocument();

      rerender(<OnboardingAssistant currentStep={1} />);
      // Next step of 1 (Step 2) is Step 3 ("Identity")
      expect(await screen.findByText('3. Identity')).toBeInTheDocument();
    });

    it('renders final step banner when current step is the last step', () => {
      render(<OnboardingAssistant currentStep={5} />);
      expect(screen.getByTestId('next-step-preview-final')).toBeInTheDocument();
    });

    it('fires callbacks on NextStepPreview actions when clicked', () => {
      const onNextStepClick = jest.fn();
      render(
        <OnboardingAssistant
          currentStep={0}
          onNextStepClick={onNextStepClick}
          nextStepActionLabel="Go"
        />
      );
      const btn = screen.getByTestId('next-step-preview-action');
      fireEvent.click(btn);
      expect(onNextStepClick).toHaveBeenCalledTimes(1);
    });
  });
});
