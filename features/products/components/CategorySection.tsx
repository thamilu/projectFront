import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronRight,
  Laptop,
  Shirt,
  Home,
  Trophy,
  Smartphone,
  Watch,
  Car,
  Gem,
  Gamepad2,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { productApi, isBackendDown } from '@/features/products/api/product-api';
import { APP_ROUTES } from '@/constants/routes/app-routes';

/**
 * Enterprise Category Mapping
 * Maps category names (slugified) to professional Lucide icons and premium colors
 */
const CATEGORY_UI_CONFIG: Record<string, { icon: LucideIcon; color: string }> = {
  electronics: { icon: Smartphone, color: 'from-blue-600 to-indigo-600' },
  fashion: { icon: Shirt, color: 'from-pink-600 to-rose-600' },
  home: { icon: Home, color: 'from-emerald-600 to-teal-600' },
  sports: { icon: Trophy, color: 'from-orange-600 to-amber-600' },
  jewellery: { icon: Gem, color: 'from-purple-600 to-fuchsia-600' },
  gaming: { icon: Gamepad2, color: 'from-indigo-600 to-purple-600' },
  default: { icon: Watch, color: 'from-slate-600 to-slate-700' },
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-');
}

const CATEGORY_SECTION_CONFIG = {
  heading: 'Shop by Category',
  subheading: 'Curated collections featuring premium brands and exclusive enterprise deals.',
  action: {
    label: 'Explore All',
    href: APP_ROUTES.PRODUCTS,
  },
  card: {
    footerLabel: 'Showcase',
  }
};

export async function CategorySection() {
  const { heading, subheading, action, card } = CATEGORY_SECTION_CONFIG;
  let categories: any[] = [];
  try {
    categories = await productApi.getCategories();
  } catch (error: any) {
    if (isBackendDown(error)) {
      console.warn('[CategorySection] Backend unreachable. Using local fallback categories for development.');
    } else if (error?.status === 401 || String(error?.message || '').includes('401')) {
      console.warn('[CategorySection] Unauthorized (401). Using local fallback categories for guests.');
    } else {
      // Non-critical homepage section: fall back without surfacing a dev overlay error.
      console.warn('[CategorySection] Failed to fetch categories. Using local fallback.', error?.message || error);
    }
  }

  // Robustness: Fallback to high-quality demo categories if none returned
  if (!categories || categories.length === 0) {
    categories = [
      { id: '1', name: 'Electronics', description: 'Latest gadgets' },
      { id: '2', name: 'Fashion', description: 'Style trends' },
      { id: '3', name: 'Home & Living', description: 'Cozy spaces' },
      { id: '4', name: 'Sports', description: 'Active gear' },
      { id: '5', name: 'Gaming', description: 'Next-gen play' },
      { id: '6', name: 'Jewellery', description: 'Timeless luxury' },
    ];
  }

  return (
    <section className="py-20 relative overflow-hidden bg-slate-50 dark:bg-slate-950" aria-labelledby="category-section-heading">
      {/* Dynamic Background Element */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.05),transparent)] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 id="category-section-heading" className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-slate-900 dark:text-white">
              {heading}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {subheading}
            </p>
          </div>

          <Button asChild size="lg" className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 group">
            <Link href={action.href} className="flex items-center gap-2">
              {action.label}
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.slice(0, 6).map((category) => {
            const slug = slugify(category.name);
            const config = CATEGORY_UI_CONFIG[slug] || CATEGORY_UI_CONFIG.default;
            const Icon = config.icon;

            return (
              <Link
                href={`${APP_ROUTES.PRODUCTS}?categoryId=${category.id}`}
                key={category.id}
                className="group block"
              >
                <Card className="h-full border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2">
                  <CardContent className="p-8 flex flex-col items-center">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl mb-6 flex items-center justify-center text-white",
                      "bg-gradient-to-br shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500",
                      config.color
                    )}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <h3 className="font-bold text-center text-slate-900 dark:text-white mb-2 group-hover:text-blue-500 transition-colors">
                      {category.name}
                    </h3>
                    <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 group-hover:text-blue-400 transition-colors">
                      {card.footerLabel} →
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

