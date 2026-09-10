import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/shared/ui/atoms/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { APP_ROUTES } from '@/shared/routes';

/**
 * Enterprise Promotional Content Configuration
 * Centralized content for easier internationalization and CMS integration
 */
const PROMO_CONTENT = {
  badge: {
    icon: Sparkles,
    text: 'Limited Time Offer',
  },
  heading: {
    main: 'The Future',
    highlight: 'Starts Here.',
  },
  description:
    'Elevate your enterprise workflow with our exclusive 50% seasonal discount. Uncompromising performance, delivered.',
  primaryAction: {
    label: 'Claim Your Offer',
    href: APP_ROUTES.PRODUCTS,
  },
  secondaryAction: {
    label: 'Learn More',
    href: '#learn-more',
  },
  image: {
    src: '/images/promo/flagship.svg',
    alt: 'Flagship Promotion',
  },
};

export function PromoBannerSection() {
  const { badge, heading, description, primaryAction, secondaryAction, image } = PROMO_CONTENT;
  const BadgeIcon = badge.icon;

  return (
    <section className="relative overflow-hidden py-24" aria-labelledby="promo-banner-heading">
      <div className="container mx-auto">
        {/* Flagship Cinematic Banner */}
        <div className="group relative flex min-h-[400px] items-center overflow-hidden rounded-[2.5rem] bg-slate-950 shadow-2xl">
          {/* Layered Backgrounds */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.15),transparent_50%)]" />
          <div className="absolute inset-0 z-10 bg-linear-to-r from-slate-950 via-slate-950/80 to-transparent" />

          {/* Animated Glow Elements */}
          <div className="absolute -top-24 -right-24 h-96 w-96 animate-pulse rounded-full bg-blue-500/10 blur-[120px]" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px]" />

          <div className="relative z-20 grid w-full items-center gap-12 p-8 md:grid-cols-2 md:p-16">
            <div className="max-w-xl space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-bold tracking-widest text-blue-400 uppercase">
                <BadgeIcon className="h-3.5 w-3.5" />
                {badge.text}
              </div>

              <h2
                id="promo-banner-heading"
                className="text-4xl leading-[1.1] font-black tracking-tighter text-white md:text-6xl"
              >
                {heading.main} <br />
                <span className="text-blue-500">{heading.highlight}</span>
              </h2>

              <p className="text-lg leading-relaxed text-slate-400 md:text-xl">{description}</p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button
                  asChild
                  size="xl"
                  className="group h-14 rounded-full bg-blue-600 px-8 font-black text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500"
                >
                  <Link href={primaryAction.href} className="flex items-center gap-2">
                    {primaryAction.label}
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="xl"
                  // The `outline` variant's base style sets `bg-background`
                  // (the theme's light surface color) with no text-color of
                  // its own. On this dark banner, overriding only
                  // `hover:bg-white/5` left `bg-background` unchallenged at
                  // rest — white text on a near-white background, i.e. an
                  // invisible label until hovered. `bg-transparent` fixes
                  // the base state; hover keeps a subtle light tint.
                  className="h-14 rounded-full border-slate-800 bg-transparent px-8 text-white hover:bg-white/5"
                  asChild
                >
                  <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                </Button>
              </div>
            </div>

            <div className="relative hidden h-full items-center justify-center md:flex">
              {/* Floating Decorative Elements */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="h-64 w-64 animate-ping rounded-full border border-blue-500/20"
                  style={{ animationDuration: '3s' }}
                />
                <div className="absolute h-48 w-48 rounded-full border border-white/5" />
              </div>

              <Image
                src={image.src}
                alt={image.alt}
                width={500}
                height={500}
                className="relative z-10 w-full max-w-[400px] drop-shadow-[0_0_50px_rgba(59,130,246,0.3)] transition-transform duration-700 group-hover:scale-110 group-hover:rotate-3"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
