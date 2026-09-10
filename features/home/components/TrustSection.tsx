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
    <section
      aria-labelledby="trust-heading"
      className="bg-background dark:bg-muted/30 py-10 md:py-14"
    >
      <div className="container mx-auto">
        <h3 id="trust-heading" className="sr-only">
          Why customers trust us
        </h3>

        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-6" role="list">
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.title}
                className="group relative rounded-2xl border border-white/5 bg-white/50 p-6 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-white/5"
              >
                {/* Gradient glow behind icon */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                />

                <span
                  aria-hidden="true"
                  className={`relative z-10 mx-auto h-14 w-14 rounded-xl bg-gradient-to-br ${item.gradient} mb-3 flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className={`h-6 w-6 ${item.iconColor}`} strokeWidth={2} />
                </span>

                <div className="text-foreground relative z-10 text-base font-bold md:text-lg">
                  {item.title}
                </div>
                <div className="text-muted-foreground relative z-10 mt-1 text-sm">
                  {item.subtitle}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
