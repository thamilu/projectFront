import Link from 'next/link';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { APP_ROUTES } from '@/shared/routes';
import { productApi } from '@/features/products/api/product-api';
import { fetchHomepageSectionData } from '@/features/products/utils/fetch-with-fallback';
import { PlaceholderAwareLink } from './PlaceholderAwareLink';
import { PreviewBadge } from '@/features/products/components/PreviewBadge';
import { cn } from '@/shared/utils';
import { generateSlug } from '@/domains/catalog/contracts/product-form.schema';
import {
  ChevronRight,
  Gamepad2,
  Gem,
  Home,
  LucideIcon,
  Shirt,
  Smartphone,
  Trophy,
  Watch,
} from 'lucide-react';

const CATEGORY_UI_CONFIG: Record<string, { icon: LucideIcon; color: string }> = {
  electronics: { icon: Smartphone, color: 'from-blue-600 to-indigo-600' },
  fashion: { icon: Shirt, color: 'from-pink-600 to-rose-600' },
  home: { icon: Home, color: 'from-emerald-600 to-teal-600' },
  // "Home & Living" is the real category name used elsewhere in the app
  // (see SEARCH_CATEGORY_OPTIONS) and slugifies to "home-living", not "home".
  'home-living': { icon: Home, color: 'from-emerald-600 to-teal-600' },
  sports: { icon: Trophy, color: 'from-orange-600 to-amber-600' },
  jewellery: { icon: Gem, color: 'from-purple-600 to-fuchsia-600' },
  gaming: { icon: Gamepad2, color: 'from-indigo-600 to-purple-600' },
  default: { icon: Watch, color: 'from-slate-600 to-slate-700' },
};

const CATEGORY_SECTION_CONFIG = {
  heading: 'Shop by Category',
  subheading: 'Curated collections featuring premium brands and exclusive enterprise deals.',
  action: {
    label: 'Explore All',
    href: APP_ROUTES.PRODUCTS,
  },
  card: {
    footerLabel: 'Showcase',
  },
};

/** Minimal shape actually rendered by this section — deliberately narrower
 * than the full CategoryDTO so the static fallback list below (which has no
 * `active`/`createdAt`) satisfies the same type as a real API response. */
interface CategoryDisplayItem {
  id: number | string;
  name: string;
  description?: string;
  isDemo?: boolean;
}

const FALLBACK_CATEGORIES: CategoryDisplayItem[] = [
  { id: '1', name: 'Electronics', description: 'Latest gadgets', isDemo: true },
  { id: '2', name: 'Fashion', description: 'Style trends', isDemo: true },
  { id: '3', name: 'Home & Living', description: 'Cozy spaces', isDemo: true },
  { id: '4', name: 'Sports', description: 'Active gear', isDemo: true },
  { id: '5', name: 'Gaming', description: 'Next-gen play', isDemo: true },
  { id: '6', name: 'Jewellery', description: 'Timeless luxury', isDemo: true },
];

export async function CategorySection() {
  const { heading, subheading, action, card } = CATEGORY_SECTION_CONFIG;

  const fetched = await fetchHomepageSectionData<CategoryDisplayItem>('CategorySection', () =>
    productApi.getCategories()
  );
  // Whole-list swap (not a partial pad, unlike Featured/FlashDeals) — a
  // handful of real categories is never mixed with demo ones, since partial
  // real category data is still fully usable on its own.
  const categories = fetched.length > 0 ? fetched : FALLBACK_CATEGORIES;

  return (
    <section className="bg-muted/30 py-12 sm:py-16" aria-labelledby="category-section-heading">
      <div className="container mx-auto">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2
              id="category-section-heading"
              className="text-foreground mb-3 text-2xl font-semibold tracking-normal sm:text-3xl"
            >
              {heading}
            </h2>
            <p className="text-muted-foreground max-w-xl text-sm leading-6 sm:text-base">
              {subheading}
            </p>
          </div>

          <Button asChild size="lg" className="group w-full sm:w-auto">
            <Link href={action.href} className="flex items-center gap-2">
              {action.label}
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {categories.slice(0, 6).map((category) => {
            const slug = generateSlug(category.name);
            const config = CATEGORY_UI_CONFIG[slug] || CATEGORY_UI_CONFIG.default;
            const Icon = config.icon;

            return (
              <PlaceholderAwareLink
                isPlaceholder={category.isDemo}
                href={`${APP_ROUTES.PRODUCTS}?categoryId=${category.id}`}
                key={category.id}
                className="group block h-full"
              >
                <Card className="border-border/80 bg-card hover:border-primary/40 relative h-full transition-colors duration-200 hover:shadow-md">
                  {category.isDemo && (
                    <PreviewBadge className="absolute top-2 right-2 z-10" />
                  )}
                  <CardContent className="flex min-h-40 flex-col items-center justify-center p-4 text-center sm:p-5">
                    <div
                      className={cn(
                        'mb-4 flex h-12 w-12 items-center justify-center rounded-lg text-white sm:h-14 sm:w-14',
                        'bg-gradient-to-br shadow-sm transition-transform duration-200 group-hover:scale-[1.03]',
                        config.color
                      )}
                    >
                      <Icon className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
                    </div>
                    <h3 className="text-card-foreground group-hover:text-primary mb-2 line-clamp-2 min-h-10 text-sm leading-5 font-semibold transition-colors sm:text-base">
                      {category.name}
                    </h3>
                    <div className="text-muted-foreground group-hover:text-primary text-[10px] font-bold tracking-widest uppercase transition-colors">
                      {card.footerLabel} &rarr;
                    </div>
                  </CardContent>
                </Card>
              </PlaceholderAwareLink>
            );
          })}
        </div>
      </div>
    </section>
  );
}
