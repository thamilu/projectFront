import { Truck, ShieldCheck, RotateCcw, Headphones } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface TrustItem {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  gradient: string;
  iconColor: string;
}

const TRUST_ITEMS: TrustItem[] = [
  {
    title: 'Fast Delivery',
    subtitle: 'Same-day & next-day options',
    icon: Truck,
    gradient: 'from-emerald-500/20 to-green-500/10',
    iconColor: 'text-emerald-500',
  },
  {
    title: 'Secure Payments',
    subtitle: 'PCI DSS compliant',
    icon: ShieldCheck,
    gradient: 'from-blue-500/20 to-indigo-500/10',
    iconColor: 'text-blue-500',
  },
  {
    title: 'Easy Returns',
    subtitle: '30-day hassle-free returns',
    icon: RotateCcw,
    gradient: 'from-amber-500/20 to-orange-500/10',
    iconColor: 'text-amber-500',
  },
  {
    title: '24/7 Support',
    subtitle: 'Live chat & phone',
    icon: Headphones,
    gradient: 'from-purple-500/20 to-violet-500/10',
    iconColor: 'text-purple-500',
  },
];

export default function TrustSection() {
  return (
    <section aria-labelledby="trust-heading" className="py-10 md:py-14 bg-background dark:bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <h3 id="trust-heading" className="sr-only">
          Why customers trust us
        </h3>

        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6" role="list">
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.title}
                className="group relative p-6 rounded-2xl border border-white/5 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-center"
              >
                {/* Gradient glow behind icon */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <span
                  aria-hidden="true"
                  className={`relative z-10 h-14 w-14 mx-auto rounded-xl bg-gradient-to-br ${item.gradient} shadow-md flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className={`h-6 w-6 ${item.iconColor}`} strokeWidth={2} />
                </span>

                <div className="relative z-10 font-bold text-base md:text-lg text-foreground">{item.title}</div>
                <div className="relative z-10 text-sm text-muted-foreground mt-1">{item.subtitle}</div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
