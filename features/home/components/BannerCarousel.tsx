'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Pause, Play } from 'lucide-react';
import { cn } from '@/shared/utils';

export const HERO_BANNERS = [
  {
    id: 'promo-1',
    src: '/images/promo/hero-banner-1.svg',
    alt: 'Phone Launching Soon - Built Different',
    href: '/products?category=electronics',
    bgColor: 'bg-slate-100 dark:bg-slate-800/50',
  },
  {
    id: 'promo-2',
    src: '/images/promo/hero-banner-2.svg',
    alt: 'AI Powered Freshness - Refrigerators',
    href: '/products?category=home',
    bgColor: 'bg-stone-100 dark:bg-stone-800/50',
  },
  {
    id: 'promo-3',
    src: '/images/promo/hero-banner-3.svg',
    alt: 'Galaxy S26 Ultra Pre-order Now',
    href: '/products?category=electronics',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/30',
  },
];

const AUTOPLAY_INTERVAL_MS = 4000;

export function BannerCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Auto-advance is opt-out, not opt-in — WCAG 2.2 SC 2.2.2 (Pause, Stop,
  // Hide) requires a mechanism to pause any auto-advancing content that
  // moves on its own for more than 5 seconds. Previously this carousel had
  // no pause control, no keyboard-accessible prev/next, and kept scrolling
  // even for prefers-reduced-motion users and while the tab was hidden.
  const [isPlaying, setIsPlaying] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);
    // Respect a live OS-level preference change too, not just the value at mount.
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  const scrollToNext = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    if (scrollLeft + clientWidth >= scrollWidth - 50) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      const itemWidth = el.children[0]?.clientWidth || clientWidth;
      el.scrollBy({ left: itemWidth + 16, behavior: 'smooth' });
    }
  }, []);

  const scrollToPrev = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const itemWidth = el.children[0]?.clientWidth || el.clientWidth;
    el.scrollBy({ left: -(itemWidth + 16), behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!isPlaying || prefersReducedMotion) return;

    const interval = setInterval(() => {
      // Don't advance a carousel the user can't currently see — both wasted
      // work and a jarring jump-cut when they return to the tab.
      if (document.hidden) return;
      scrollToNext();
    }, AUTOPLAY_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isPlaying, prefersReducedMotion, scrollToNext]);

  return (
    <div
      className="relative container mx-auto w-full overflow-hidden"
      role="region"
      aria-roledescription="carousel"
      aria-label="Promotional offers"
      // Pausing on hover/focus is a secondary courtesy on top of the
      // explicit pause button below — a mouse user shouldn't have to find
      // and press the button just to read a banner they're already looking at.
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
      onFocus={() => setIsPlaying(false)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsPlaying(true);
      }}
    >
      {/* Scroll Container */}
      <div
        ref={scrollRef}
        className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4"
      >
        {HERO_BANNERS.map((banner, index) => (
          <Link
            key={banner.id}
            href={banner.href}
            className={cn(
              'group relative aspect-[21/9] w-[90vw] flex-none snap-start overflow-hidden rounded-2xl md:aspect-[24/9] md:w-[70vw] lg:w-[48%]',
              banner.bgColor
            )}
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${HERO_BANNERS.length}`}
          >
            {/* Fallback pattern if image is missing */}
            <div
              className="absolute inset-0 opacity-10 dark:opacity-20"
              style={{
                backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            <Image
              src={banner.src}
              alt={banner.alt}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 90vw, (max-width: 1024px) 70vw, 48vw"
              priority={index === 0}
              unoptimized
            />

            {/* Overlay gradient for readability if needed */}
            <div className="absolute inset-0 bg-black/5 transition-colors duration-300 group-hover:bg-transparent" />
          </Link>
        ))}
      </div>

      {!prefersReducedMotion && (
        <div className="absolute right-3 bottom-6 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={scrollToPrev}
            className="focus-visible:ring-ring flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            aria-label="Previous banner"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            onClick={() => setIsPlaying((prev) => !prev)}
            className="focus-visible:ring-ring flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            aria-label={isPlaying ? 'Pause banner rotation' : 'Resume banner rotation'}
            aria-pressed={!isPlaying}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={scrollToNext}
            className="focus-visible:ring-ring flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            aria-label="Next banner"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      )}
    </div>
  );
}
