import { useEffect, useState } from 'react';

/**
 * Returns true when the scroll position is past the threshold.
 * Uses a passive scroll event listener and throttles state updates with requestAnimationFrame.
 *
 * @param threshold scroll vertical offset in pixels (defaults to 10)
 */
export function useScrollShadow(threshold = 10): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let rafId: number;

    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setScrolled(window.scrollY > threshold);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [threshold]);

  return scrolled;
}
