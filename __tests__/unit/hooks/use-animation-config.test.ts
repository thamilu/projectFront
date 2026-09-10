import { renderHook } from '@testing-library/react';
import { useAnimationConfig } from '@/shared/hooks/use-animation-config';
import { PageAnimations, ReducedMotionAnimations } from '@/shared/config/animation-variants';
import { useReducedMotion } from '@/shared/hooks/use-reduced-motion';

jest.mock('@/shared/hooks/use-reduced-motion', () => ({
  useReducedMotion: jest.fn(),
}));

describe('useAnimationConfig', () => {
  const mockUseReducedMotion = useReducedMotion as jest.MockedFunction<typeof useReducedMotion>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the standard animation configuration when prefers-reduced-motion is false', () => {
    mockUseReducedMotion.mockReturnValue(false);

    const { result } = renderHook(() => useAnimationConfig(PageAnimations));
    expect(result.current).toEqual(PageAnimations);
  });

  it('should return ReducedMotionAnimations when prefers-reduced-motion is true', () => {
    mockUseReducedMotion.mockReturnValue(true);

    const { result } = renderHook(() => useAnimationConfig(PageAnimations));
    expect(result.current).toEqual(ReducedMotionAnimations);
  });
});
