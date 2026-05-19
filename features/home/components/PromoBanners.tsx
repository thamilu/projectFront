import Link from 'next/link';
import { Zap, PartyPopper, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface PromoBanner {
  id: string;
  href: string;
  title: string;
  subtitle: string;
  gradient: string;
  icon: LucideIcon;
  decorativeGlow: string;
  badge: string;
}

const PROMO_BANNERS: PromoBanner[] = [
  {
    id: 'flash-sale',
    href: '/products?filter=flash',
    title: 'Flash Sale',
    subtitle: 'Up to 70% Off',
    gradient: 'from-amber-600 via-orange-500 to-red-500 dark:from-amber-500 dark:via-orange-400 dark:to-red-400',
    icon: Zap,
    decorativeGlow: 'bg-yellow-400/20',
    badge: 'LIMITED TIME',
  },
  {
    id: 'festival',
    href: '/products?filter=festival',
    title: 'Festival Offers',
    subtitle: 'Extra Savings',
    gradient: 'from-indigo-600 via-purple-500 to-fuchsia-500 dark:from-indigo-500 dark:via-purple-400 dark:to-fuchsia-400',
    icon: PartyPopper,
    decorativeGlow: 'bg-purple-400/20',
    badge: 'SEASONAL',
  },
] as const;

function PromoBanners() {
  return (
    <section className="py-8 md:py-12" aria-labelledby="promo-banners-heading">
      <h2 id="promo-banners-heading" className="sr-only">
        Current promotions
      </h2>
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {PROMO_BANNERS.map((banner) => {
            const Icon = banner.icon;
            return (
              <Link
                key={banner.id}
                href={banner.href}
                className="group block rounded-2xl overflow-hidden shadow-lg transition-all duration-300
                  hover:scale-[1.02] hover:shadow-2xl
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                  active:scale-[0.98]"
              >
                <div
                  className={`relative h-48 md:h-60 flex items-center text-white px-6 md:px-10
                    bg-gradient-to-r ${banner.gradient}`}
                >
                  {/* Decorative elements */}
                  <div className={`absolute -top-16 -right-16 w-64 h-64 rounded-full ${banner.decorativeGlow} blur-3xl`} />
                  <div className={`absolute -bottom-20 -left-10 w-48 h-48 rounded-full ${banner.decorativeGlow} blur-2xl opacity-60`} />
                  
                  {/* Geometric pattern overlay */}
                  <div className="absolute inset-0 opacity-[0.04]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                    backgroundSize: '24px 24px',
                  }} />

                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                  
                  {/* Content */}
                  <div className="relative z-10 flex items-center justify-between w-full">
                    <div className="space-y-2">
                      <span className="inline-block text-[10px] font-black tracking-[0.2em] bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                        {banner.badge}
                      </span>
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight">
                        {banner.title}
                      </h3>
                      <p className="text-sm md:text-base font-medium text-white/80">
                        {banner.subtitle}
                      </p>
                      <div className="flex items-center gap-2 text-xs font-bold text-white/70 group-hover:text-white transition-colors pt-1">
                        Shop Now <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                    
                    {/* Large decorative icon */}
                    <div className="hidden sm:flex items-center justify-center">
                      <Icon className="h-20 w-20 md:h-28 md:w-28 text-white/10 group-hover:text-white/20 transition-colors duration-500 group-hover:rotate-12 transform" strokeWidth={1} />
                    </div>
                  </div>
                  
                  {/* Bottom dark overlay for depth */}
                  <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default PromoBanners;
