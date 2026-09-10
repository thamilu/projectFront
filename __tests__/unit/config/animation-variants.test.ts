import {
  DURATIONS,
  EASINGS,
  OFFSETS,
  createSlideVariants,
  createFadeVariants,
  createTransition,
  createScaleVariants,
  PageAnimations,
  StepAnimations,
  ModalAnimations,
  ReducedMotionAnimations,
  AnimationConfig,
} from '@/shared/config/animation-variants';

describe('Animation Variants & Design Tokens', () => {
  describe('Design Tokens SSoT', () => {
    it('defines correct duration keys and values', () => {
      expect(DURATIONS.fast).toBe(0.15);
      expect(DURATIONS.normal).toBe(0.2);
      expect(DURATIONS.slow).toBe(0.35);
    });

    it('defines correct ease curves', () => {
      expect(EASINGS.easeInOut).toBe('easeInOut');
      expect(EASINGS.easeOut).toBe('easeOut');
      expect(EASINGS.easeIn).toBe('easeIn');
      expect(EASINGS.spring).toEqual([0.43, 0.13, 0.23, 0.96]);
    });

    it('defines correct animation spatial offsets', () => {
      expect(OFFSETS.sm).toBe(10);
      expect(OFFSETS.md).toBe(20);
      expect(OFFSETS.lg).toBe(40);
    });
  });

  describe('Factory Functions', () => {
    it('creates correct slide variants along axis x', () => {
      const xVariants = createSlideVariants('x', 25);
      expect(xVariants.initial).toEqual({ opacity: 0, x: 25 });
      expect(xVariants.animate).toEqual({ opacity: 1, x: 0 });
      expect(xVariants.exit).toEqual({ opacity: 0, x: -25 });
    });

    it('creates correct slide variants along axis y', () => {
      const yVariants = createSlideVariants('y', 15);
      expect(yVariants.initial).toEqual({ opacity: 0, y: 15 });
      expect(yVariants.animate).toEqual({ opacity: 1, y: 0 });
      expect(yVariants.exit).toEqual({ opacity: 0, y: -15 });
    });

    it('creates correct fade-only variants', () => {
      const fadeVariants = createFadeVariants();
      expect(fadeVariants.initial).toEqual({ opacity: 0 });
      expect(fadeVariants.animate).toEqual({ opacity: 1 });
      expect(fadeVariants.exit).toEqual({ opacity: 0 });
    });

    it('creates correct transition profiles from tokens', () => {
      const transition = createTransition('fast', 'easeOut');
      expect(transition).toEqual({
        duration: 0.15,
        ease: 'easeOut',
      });
    });

    it('creates correct scale variants', () => {
      const scaleVariants = createScaleVariants(0.9, 15);
      expect(scaleVariants.initial).toEqual({ opacity: 0, scale: 0.9, y: 15 });
      expect(scaleVariants.animate).toEqual({ opacity: 1, scale: 1, y: 0 });
      expect(scaleVariants.exit).toEqual({ opacity: 0, scale: 0.9, y: 15 });
    });
  });

  describe('Namespace Configurations', () => {
    it('matches exact specifications for PageAnimations', () => {
      expect(PageAnimations.variants.initial).toEqual({ opacity: 0, x: 20 });
      expect(PageAnimations.transition).toEqual({ duration: 0.2, ease: 'easeInOut' });
    });

    it('matches exact specifications for StepAnimations', () => {
      expect(StepAnimations.variants.initial).toEqual({ opacity: 0, y: 10 });
      expect(StepAnimations.transition).toEqual({ duration: 0.2, ease: 'easeOut' });
    });

    it('matches exact specifications for ModalAnimations', () => {
      expect(ModalAnimations.variants.initial).toEqual({ opacity: 0, scale: 0.96, y: 10 });
      expect(ModalAnimations.transition).toEqual({ duration: 0.15, ease: 'easeOut' });
    });

    it('matches exact specifications for ReducedMotionAnimations', () => {
      expect(ReducedMotionAnimations.variants.initial).toEqual({ opacity: 0 });
      expect(ReducedMotionAnimations.transition).toEqual({ duration: 0.15, ease: 'easeInOut' });
    });
  });

  describe('TypeScript Compilation & Exports Verification', () => {
    it('exports required types for consumer usage', () => {
      const mockConfig: AnimationConfig = {
        variants: PageAnimations.variants,
        transition: PageAnimations.transition,
      };
      expect(mockConfig).toBeDefined();
      expect(mockConfig.variants).toBe(PageAnimations.variants);
      expect(mockConfig.transition).toBe(PageAnimations.transition);
    });
  });
});
