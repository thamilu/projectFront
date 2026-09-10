'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import type { SectionPriority } from '@/types/home';

interface SectionRevealProps {
  children: ReactNode;
  index: number;
  priority?: SectionPriority | 'immediate';
}

/**
 * Enterprise Section Reveal Animation
 *
 * Provides a staggered, professional entrance animation for home page sections.
 * Uses native CSS animations + IntersectionObserver instead of framer-motion
 * to eliminate the ~30-50KB client bundle cost.
 */
export function SectionReveal({ children, index, priority = 'normal' }: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const delay = priority === 'immediate' || priority === 'critical' ? 0 : index * 0.1;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.style.transitionDelay = `${delay}s`;
          el.classList.add('section-revealed');
          observer.unobserve(el);
        }
      },
      { rootMargin: '-100px', threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className="section-reveal"
      style={{
        opacity: 0,
        transform: 'translateY(30px)',
        transition:
          'opacity 0.8s cubic-bezier(0.21, 0.45, 0.32, 0.9), transform 0.8s cubic-bezier(0.21, 0.45, 0.32, 0.9)',
      }}
    >
      {children}
    </div>
  );
}
