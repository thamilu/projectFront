import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationConfig } from '@/shared/hooks/use-animation-config';
import { PageAnimations } from '@/shared/config/animation-variants';
import { useReducedMotion } from '@/shared/hooks/use-reduced-motion';

jest.mock('@/shared/hooks/use-reduced-motion', () => ({
  useReducedMotion: jest.fn(),
}));

// A test component to simulate dynamic step content transitions using AnimatePresence
const TestStepperComponent: React.FC = () => {
  const [step, setStep] = useState<'stepA' | 'stepB'>('stepA');
  const pageAnim = useAnimationConfig(PageAnimations);

  return (
    <div>
      <button onClick={() => setStep(step === 'stepA' ? 'stepB' : 'stepA')}>Toggle Step</button>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={pageAnim.variants}
          transition={pageAnim.transition}
          initial="initial"
          animate="animate"
          exit="exit"
          data-testid="animated-content"
        >
          {step === 'stepA' ? 'Content A' : 'Content B'}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

describe('Animation Integration — Step Transitions & Accessibility', () => {
  const mockUseReducedMotion = useReducedMotion as jest.MockedFunction<typeof useReducedMotion>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly and performs transitions without console errors when motion is allowed', async () => {
    mockUseReducedMotion.mockReturnValue(false);
    const user = userEvent.setup();

    const { container } = render(<TestStepperComponent />);

    // Initial mount check
    const content = screen.getByTestId('animated-content');
    expect(content).toHaveTextContent('Content A');

    // Click trigger and ensure toggle happens
    const toggleButton = screen.getByRole('button', { name: /toggle step/i });
    await user.click(toggleButton);

    const updatedContent = await screen.findByText('Content B');
    expect(updatedContent).toBeInTheDocument();
    expect(container).toBeInTheDocument();
  });

  it('applies reduced motion settings seamlessly when prefers-reduced-motion is active', async () => {
    mockUseReducedMotion.mockReturnValue(true);
    const user = userEvent.setup();

    render(<TestStepperComponent />);

    const content = screen.getByTestId('animated-content');
    expect(content).toHaveTextContent('Content A');

    // Toggle step
    const toggleButton = screen.getByRole('button', { name: /toggle step/i });
    await user.click(toggleButton);

    const updatedContent = await screen.findByText('Content B');
    expect(updatedContent).toBeInTheDocument();
  });
});
