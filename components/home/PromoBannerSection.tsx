import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { APP_ROUTES } from '@/constants/routes/app-routes';

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
  description: 'Elevate your enterprise workflow with our exclusive 50% seasonal discount. Uncompromising performance, delivered.',
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
  }
};

export function PromoBannerSection() {
  const { badge, heading, description, primaryAction, secondaryAction, image } = PROMO_CONTENT;
  const BadgeIcon = badge.icon;

  return (
    <section className="py-24 relative overflow-hidden" aria-labelledby="promo-banner-heading">
      <div className="container mx-auto px-4 md:px-6">
        {/* Flagship Cinematic Banner */}
        <div className="relative min-h-[400px] rounded-[2.5rem] overflow-hidden bg-slate-950 flex items-center shadow-2xl group">

          {/* Layered Backgrounds */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-linear-to-r from-slate-950 via-slate-950/80 to-transparent z-10" />

          {/* Animated Glow Elements */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]" />

          <div className="relative z-20 w-full grid md:grid-cols-2 items-center gap-12 p-8 md:p-16">
            <div className="max-w-xl space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
                <BadgeIcon className="w-3.5 h-3.5" />
                {badge.text}
              </div>

              <h2
                id="promo-banner-heading"
                className="text-4xl md:text-6xl font-black text-white leading-[1.1] tracking-tighter"
              >
                {heading.main} <br />
                <span className="text-blue-500">{heading.highlight}</span>
              </h2>

              <p className="text-lg md:text-xl text-slate-400 leading-relaxed">
                {description}
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button 
                  asChild 
                  size="xl"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black rounded-full px-8 h-14 shadow-lg shadow-blue-500/20 group"
                >
                  <Link href={primaryAction.href} className="flex items-center gap-2">
                    {primaryAction.label}
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="xl"
                  className="border-slate-800 text-white hover:bg-white/5 rounded-full px-8 h-14"
                  asChild
                >
                  <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                </Button>
              </div>
            </div>

            <div className="hidden md:flex justify-center items-center relative h-full">
              {/* Floating Decorative Elements */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border border-blue-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute w-48 h-48 border border-white/5 rounded-full" />
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
