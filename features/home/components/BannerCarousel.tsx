'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

export function BannerCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

        // Check if we've reached the end
        // Check if we've reached the end (give a generous 50px buffer)
        if (scrollLeft + clientWidth >= scrollWidth - 50) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // Find the exact width of distance to next slide start
          // gap is 16px (gap-4), so itemWidth + gap
          const itemWidth = scrollRef.current.children[0]?.clientWidth || clientWidth;
          const scrollAmount = itemWidth + 16;

          scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }
    }, 4000); // 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full container mx-auto overflow-hidden">
      {/* Scroll Container */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 pb-4 scroll-smooth"
      >
        {HERO_BANNERS.map((banner) => (
          <Link
            key={banner.id}
            href={banner.href}
            className={cn(
              "relative flex-none w-[90vw] md:w-[70vw] lg:w-[48%] snap-start aspect-[21/9] md:aspect-[24/9] rounded-2xl overflow-hidden group",
              banner.bgColor
            )}
          >
            {/* Fallback pattern if image is missing */}
            <div className="absolute inset-0 opacity-10 dark:opacity-20" style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            <Image
              src={banner.src}
              alt={banner.alt}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority
              unoptimized
            />

            {/* Overlay gradient for readability if needed */}
            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300" />
          </Link>
        ))}
      </div>
    </div>
  );
}
