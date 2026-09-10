/**
 * @fileoverview Product Category Domain Constants
 *
 * Defines the static product category taxonomy for the storefront.
 * Provides: display metadata, routing slugs, icon references, SEO data,
 * and parent-child hierarchy navigation mapping.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  ARCHITECTURE RULES                                              │
 * │  ✅ Static UI/routing configuration only                         │
 * │  ✅ productCount = approximate display value (not authoritative) │
 * │  ❌ No live data — fetch product counts from API                 │
 * │  ❌ No business logic — use category utility functions           │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * Adding a new category — checklist:
 *   [ ] Add ID to CATEGORY_IDS constant
 *   [ ] Add category object to CATEGORIES array
 *   [ ] Add gradient CSS class to utilities.css if a new gradient is needed
 *   [ ] Add icon mapping in CategoryIcon component if a new icon is needed
 *   [ ] Update CONSTANTS_SCHEMA_VERSION
 *   [ ] Notify backend team (DB seed update required)
 *   [ ] Add SEO metadata to seo field
 *
 * @module shared/constants/domain/categories
 * @version 2.2.0
 */

// ─── Category ID Registry ─────────────────────────────────────────────────────

/**
 * Canonical category identifiers.
 * These MUST match backend category slugs.
 * Used as URL segments: /categories/{id}
 */
export const CATEGORY_IDS = {
  // Top-Level Categories
  ELECTRONICS: 'electronics',
  MOBILES: 'mobiles-accessories',
  FASHION: 'fashion',
  HOME_LIVING: 'home-living',
  BEAUTY: 'beauty-personal-care',
  BOOKS: 'books-stationery',
  SPORTS: 'sports-fitness',
  GROCERY: 'grocery',
  HEALTH: 'health-wellness',
  BABY_KIDS: 'baby-kids',
  AUTOMOTIVE: 'automotive',
  APPLIANCES: 'appliances',

  // Subcategories - Electronics
  SMARTPHONES: 'smartphones',
  LAPTOPS: 'laptops',
  CAMERAS: 'cameras',

  // Subcategories - Fashion
  MEN_WEAR: 'men-wear',
  WOMEN_WEAR: 'women-wear',
  FOOTWEAR: 'footwear',
} as const satisfies Record<string, string>;

export type CategoryId = (typeof CATEGORY_IDS)[keyof typeof CATEGORY_IDS];

/** Type guard for runtime CategoryId validation */
export const isCategoryId = (value: string): value is CategoryId =>
  Object.values(CATEGORY_IDS).includes(value as CategoryId);

// ─── Icon Registry ────────────────────────────────────────────────────────────

/**
 * Available icon names for categories.
 * Resolved to LucideIcon components in CategoryIcon component.
 */
export type CategoryIconName =
  | 'Laptop'
  | 'Shirt'
  | 'Home'
  | 'Dumbbell'
  | 'Sparkles'
  | 'BookOpen'
  | 'ShoppingBag'
  | 'Smartphone'
  | 'Heart'
  | 'Car'
  | 'Tv'
  | 'Baby';

// ─── Category Interface ───────────────────────────────────────────────────────

export interface CategorySeo {
  /** HTML <title> for category page */
  readonly title: string;
  /** HTML <meta name="description"> */
  readonly description: string;
  /** Open Graph image URL */
  readonly ogImage?: string;
}

export interface ProductCategory {
  /**
   * Unique semantic ID. Doubles as URL slug.
   * Must match backend category slug exactly.
   */
  readonly id: CategoryId;

  /** Human-readable display name */
  readonly name: string;

  /**
   * URL-safe routing slug.
   * Uses hyphens, no special characters.
   * Example: 'home-living' for 'Home & Living'
   */
  readonly slug: string;

  /**
   * Parent category ID, or null if this is a top-level category node.
   */
  readonly parentId: CategoryId | null;

  /**
   * Hierarchy nesting level (0 = top-level, 1 = subcategory, 2 = sub-subcategory)
   */
  readonly level: number;

  /**
   * Lucide icon name for this category.
   * Resolved to SVG component at render time.
   */
  readonly iconName: CategoryIconName;

  /**
   * Accessible label for the category icon.
   * Used as aria-label when icon is the only visual.
   */
  readonly iconAriaLabel: string;

  /**
   * CSS class for category gradient background.
   * Defined in utilities.css to prevent Tailwind CSS purging.
   */
  readonly gradientClass: string;

  /**
   * Display order in category lists (1-based, ascending).
   * Lower values appear first.
   */
  readonly sortOrder: number;

  /**
   * Approximate product count for UI display only.
   * NOT authoritative — refreshed from API via useCategories hook.
   */
  readonly approximateProductCount: number;

  /** Short description for tooltips and accessibility */
  readonly description: string;

  /** Whether this category is currently shown to users */
  readonly isActive: boolean;

  /** SEO metadata for category pages */
  readonly seo: CategorySeo;
}

// ─── Category Data ────────────────────────────────────────────────────────────

export const CATEGORIES = [
  // ==========================================
  // TOP-LEVEL CATEGORIES (Level 0)
  // ==========================================
  {
    id: CATEGORY_IDS.ELECTRONICS,
    name: 'Electronics',
    slug: 'electronics',
    parentId: null,
    level: 0,
    iconName: 'Laptop' as const satisfies CategoryIconName,
    iconAriaLabel: 'Electronics',
    gradientClass: 'category-electronics',
    sortOrder: 1,
    approximateProductCount: 5200,
    description: 'Laptops, smartphones, cameras and cutting-edge gadgets',
    isActive: true,
    seo: {
      title: 'Electronics — Shop Laptops, Phones & More',
      description:
        'Discover the latest electronics: laptops, smartphones, cameras, and gadgets at unbeatable prices.',
    },
  },
  {
    id: CATEGORY_IDS.MOBILES,
    name: 'Mobiles & Accessories',
    slug: 'mobiles-accessories',
    parentId: null,
    level: 0,
    iconName: 'Smartphone' as const satisfies CategoryIconName,
    iconAriaLabel: 'Mobiles and Accessories',
    gradientClass: 'category-electronics', // Reuses premium blue gradient
    sortOrder: 2,
    approximateProductCount: 9400,
    description: 'Smartphones, tablets, smartwatches, chargers and cases',
    isActive: true,
    seo: {
      title: 'Mobiles & Accessories — Smartphones & Smartwatches',
      description:
        'Shop smartphones, tablets, premium accessories, smartwatches, powerbanks and cases.',
    },
  },
  {
    id: CATEGORY_IDS.FASHION,
    name: 'Fashion',
    slug: 'fashion',
    parentId: null,
    level: 0,
    iconName: 'Shirt' as const satisfies CategoryIconName,
    iconAriaLabel: 'Fashion',
    gradientClass: 'category-fashion',
    sortOrder: 3,
    approximateProductCount: 8100,
    description: 'Clothing, shoes, and accessories for every style',
    isActive: true,
    seo: {
      title: 'Fashion — Clothing, Shoes & Accessories',
      description:
        'Shop the latest fashion trends: clothing, shoes, bags and accessories from top brands.',
    },
  },
  {
    id: CATEGORY_IDS.HOME_LIVING,
    name: 'Home & Living',
    slug: 'home-living',
    parentId: null,
    level: 0,
    iconName: 'Home' as const satisfies CategoryIconName,
    iconAriaLabel: 'Home and Living',
    gradientClass: 'category-home-living',
    sortOrder: 4,
    approximateProductCount: 3500,
    description: 'Furniture, décor, and everything to make your home beautiful',
    isActive: true,
    seo: {
      title: 'Home & Living — Furniture, Décor & More',
      description:
        'Transform your home with our curated collection of furniture, décor, kitchenware and more.',
    },
  },
  {
    id: CATEGORY_IDS.BEAUTY,
    name: 'Beauty & Personal Care',
    slug: 'beauty-personal-care',
    parentId: null,
    level: 0,
    iconName: 'Sparkles' as const satisfies CategoryIconName,
    iconAriaLabel: 'Beauty and Personal Care',
    gradientClass: 'category-beauty',
    sortOrder: 5,
    approximateProductCount: 4700,
    description: 'Skincare, makeup, and personal care essentials',
    isActive: true,
    seo: {
      title: 'Beauty & Personal Care — Skincare & Makeup',
      description:
        'Discover beauty essentials: skincare, makeup, haircare, and fragrance from premium brands.',
    },
  },
  {
    id: CATEGORY_IDS.BOOKS,
    name: 'Books & Stationery',
    slug: 'books-stationery',
    parentId: null,
    level: 0,
    iconName: 'BookOpen' as const satisfies CategoryIconName,
    iconAriaLabel: 'Books and Stationery',
    gradientClass: 'category-books',
    sortOrder: 6,
    approximateProductCount: 1900,
    description: 'Fiction, non-fiction, textbooks and premium stationery',
    isActive: true,
    seo: {
      title: 'Books & Stationery — Bestsellers & School Supplies',
      description:
        'Explore our vast book collection: bestsellers, classics, textbooks, journals, and stationery.',
    },
  },
  {
    id: CATEGORY_IDS.SPORTS,
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    parentId: null,
    level: 0,
    iconName: 'Dumbbell' as const satisfies CategoryIconName,
    iconAriaLabel: 'Sports and Fitness',
    gradientClass: 'category-sports',
    sortOrder: 7,
    approximateProductCount: 2300,
    description: 'Sports equipment, fitness gear, and activewear',
    isActive: true,
    seo: {
      title: 'Sports & Fitness — Equipment & Activewear',
      description:
        'Shop sports equipment, fitness gear, and activewear for every sport and fitness level.',
    },
  },
  {
    id: CATEGORY_IDS.GROCERY,
    name: 'Grocery & Gourmet',
    slug: 'grocery',
    parentId: null,
    level: 0,
    iconName: 'ShoppingBag' as const satisfies CategoryIconName,
    iconAriaLabel: 'Grocery and Gourmet Foods',
    gradientClass: 'category-home-living', // Reuses emerald gradient
    sortOrder: 8,
    approximateProductCount: 6200,
    description: 'Daily essentials, snacks, beverages, and gourmet food products',
    isActive: true,
    seo: {
      title: 'Grocery & Gourmet — Daily Essentials & Organic Foods',
      description:
        'Buy groceries online: daily staples, organic snacks, beverages, and imported gourmet items.',
    },
  },
  {
    id: CATEGORY_IDS.HEALTH,
    name: 'Health & Wellness',
    slug: 'health-wellness',
    parentId: null,
    level: 0,
    iconName: 'Heart' as const satisfies CategoryIconName,
    iconAriaLabel: 'Health and Wellness',
    gradientClass: 'category-beauty', // Reuses purple gradient
    sortOrder: 9,
    approximateProductCount: 3100,
    description: 'Vitamins, wellness supplements, and personal health monitors',
    isActive: true,
    seo: {
      title: 'Health & Wellness — Vitamins, Supplements & Fitness Tech',
      description:
        'Shop premium health products: supplements, vitamins, protein powders, and wellness aids.',
    },
  },
  {
    id: CATEGORY_IDS.BABY_KIDS,
    name: 'Baby & Kids',
    slug: 'baby-kids',
    parentId: null,
    level: 0,
    iconName: 'Baby' as const satisfies CategoryIconName,
    iconAriaLabel: 'Baby and Kids Care',
    gradientClass: 'category-fashion', // Reuses pink gradient
    sortOrder: 10,
    approximateProductCount: 2900,
    description: 'Baby clothing, toys, safety gear and kids essentials',
    isActive: true,
    seo: {
      title: 'Baby & Kids — Toys, Diapering & Kids Apparel',
      description:
        'Discover baby products: diapering, baby apparel, organic baby food, safety gates, and toys.',
    },
  },
  {
    id: CATEGORY_IDS.AUTOMOTIVE,
    name: 'Automotive',
    slug: 'automotive',
    parentId: null,
    level: 0,
    iconName: 'Car' as const satisfies CategoryIconName,
    iconAriaLabel: 'Automotive Parts and Accessories',
    gradientClass: 'category-sports', // Reuses orange gradient
    sortOrder: 11,
    approximateProductCount: 1500,
    description: 'Car care accessories, cleaning kits and automotive tools',
    isActive: true,
    seo: {
      title: 'Automotive — Car Polish, Accessories & Tools',
      description:
        'Upgrade your ride: car care accessories, detailing polishes, helmets, and vehicle tools.',
    },
  },
  {
    id: CATEGORY_IDS.APPLIANCES,
    name: 'Appliances',
    slug: 'appliances',
    parentId: null,
    level: 0,
    iconName: 'Tv' as const satisfies CategoryIconName,
    iconAriaLabel: 'Home and Kitchen Appliances',
    gradientClass: 'category-home-living', // Reuses emerald gradient
    sortOrder: 12,
    approximateProductCount: 4200,
    description: 'Smart televisions, refrigerators, air conditioners and kitchen gadgets',
    isActive: true,
    seo: {
      title: 'Home Appliances — Televisions, ACs & Kitchen Tech',
      description:
        'Upgrade your home with televisions, microwave ovens, refrigerators, washing machines and more.',
    },
  },

  // ==========================================
  // SUBCATEGORIES (Level 1)
  // ==========================================
  {
    id: CATEGORY_IDS.SMARTPHONES,
    name: 'Smartphones',
    slug: 'smartphones',
    parentId: CATEGORY_IDS.ELECTRONICS,
    level: 1,
    iconName: 'Smartphone' as const satisfies CategoryIconName,
    iconAriaLabel: 'Smartphones',
    gradientClass: 'category-electronics',
    sortOrder: 101,
    approximateProductCount: 2200,
    description: 'Browse the latest Android phones and iPhones',
    isActive: true,
    seo: {
      title: 'Smartphones — Shop Android Phones & iPhones',
      description:
        'Discover the latest smartphones from Apple, Samsung, OnePlus, and more at the best prices.',
    },
  },
  {
    id: CATEGORY_IDS.LAPTOPS,
    name: 'Laptops',
    slug: 'laptops',
    parentId: CATEGORY_IDS.ELECTRONICS,
    level: 1,
    iconName: 'Laptop' as const satisfies CategoryIconName,
    iconAriaLabel: 'Laptops',
    gradientClass: 'category-electronics',
    sortOrder: 102,
    approximateProductCount: 1800,
    description: 'Work, gaming, and ultra-portable laptop computers',
    isActive: true,
    seo: {
      title: 'Laptops — Work, Student & Gaming Laptops',
      description:
        'Find your perfect laptop: ultrabooks, student laptops, and high-performance gaming rigs.',
    },
  },
  {
    id: CATEGORY_IDS.CAMERAS,
    name: 'Cameras',
    slug: 'cameras',
    parentId: CATEGORY_IDS.ELECTRONICS,
    level: 1,
    iconName: 'Laptop' as const satisfies CategoryIconName, // Fallback icon key
    iconAriaLabel: 'Cameras and Detailing Tools',
    gradientClass: 'category-electronics',
    sortOrder: 103,
    approximateProductCount: 1200,
    description: 'Mirrorless cameras, DSLRs, action cams, and camera accessories',
    isActive: true,
    seo: {
      title: 'Cameras — Mirrorless, DSLRs & GoPros',
      description:
        'Capture life: buy mirrorless cameras, DSLR video cameras, tripods, lenses, and bags.',
    },
  },
  {
    id: CATEGORY_IDS.MEN_WEAR,
    name: "Men's Wear",
    slug: 'men-wear',
    parentId: CATEGORY_IDS.FASHION,
    level: 1,
    iconName: 'Shirt' as const satisfies CategoryIconName,
    iconAriaLabel: "Men's Clothing",
    gradientClass: 'category-fashion',
    sortOrder: 201,
    approximateProductCount: 3100,
    description: 'Shirts, t-shirts, jeans, trousers and formal wear for men',
    isActive: true,
    seo: {
      title: "Men's Clothing — Shirts, Jeans & Formals",
      description:
        "Upgrade your wardrobe: men's formal shirts, casual t-shirts, slim jeans, and jackets.",
    },
  },
  {
    id: CATEGORY_IDS.WOMEN_WEAR,
    name: "Women's Wear",
    slug: 'women-wear',
    parentId: CATEGORY_IDS.FASHION,
    level: 1,
    iconName: 'Shirt' as const satisfies CategoryIconName, // Fallback key
    iconAriaLabel: "Women's Clothing",
    gradientClass: 'category-fashion',
    sortOrder: 202,
    approximateProductCount: 3900,
    description: 'Dresses, tops, kurtis, sarees and Western wear for women',
    isActive: true,
    seo: {
      title: "Women's Fashion — Dresses, Kurtis & Sarees",
      description:
        'Explore elegant apparel: designer kurtis, casual tops, wedding sarees, and Western wear.',
    },
  },
  {
    id: CATEGORY_IDS.FOOTWEAR,
    name: 'Footwear',
    slug: 'footwear',
    parentId: CATEGORY_IDS.FASHION,
    level: 1,
    iconName: 'Shirt' as const satisfies CategoryIconName,
    iconAriaLabel: 'Footwear',
    gradientClass: 'category-fashion',
    sortOrder: 203,
    approximateProductCount: 1100,
    description: 'Sports sneakers, formal shoes, flats, and heels',
    isActive: true,
    seo: {
      title: 'Footwear — Running Shoes, Formals & Sandals',
      description:
        'Step out in style: athletic running shoes, premium men formal shoes, and women heels.',
    },
  },
] as const satisfies readonly ProductCategory[];

// ─── Derived Types ────────────────────────────────────────────────────────────

export type CategoryTreeNode = ProductCategory & {
  readonly children: readonly CategoryTreeNode[];
};

// ─── Utility Functions ────────────────────────────────────────────────────────

/**
 * Returns categories sorted by sortOrder (ascending).
 */
export const sortCategories = (
  categories: readonly ProductCategory[]
): readonly ProductCategory[] => [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

/**
 * Returns only active categories visible to users.
 */
export const getActiveCategories = (
  categories: readonly ProductCategory[] = CATEGORIES
): readonly ProductCategory[] => categories.filter((cat) => cat.isActive);

/**
 * Finds a category by its ID with type safety.
 * Returns undefined if not found — never throws.
 */
export const findCategoryById = (
  id: string,
  categories: readonly ProductCategory[] = CATEGORIES
): ProductCategory | undefined => categories.find((cat) => cat.id === id);

/**
 * Finds a category by its URL slug.
 * Used in routing: /categories/[slug]
 */
export const findCategoryBySlug = (
  slug: string,
  categories: readonly ProductCategory[] = CATEGORIES
): ProductCategory | undefined => categories.find((cat) => cat.slug === slug);

/**
 * Formats category product count for display.
 * Returns human-readable string: 5200 → '5.2K'
 */
export const formatCategoryCount = (count: number): string => {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
};

/**
 * Returns categories that have the given parent ID.
 */
export const getCategoryChildren = (
  parentId: CategoryId,
  categories: readonly ProductCategory[] = CATEGORIES
): readonly ProductCategory[] => categories.filter((c) => c.parentId === parentId);

/**
 * Returns parent ancestors from top-level down to the category.
 */
export const getCategoryAncestors = (
  categoryId: CategoryId,
  categories: readonly ProductCategory[] = CATEGORIES
): readonly ProductCategory[] => {
  const ancestors: ProductCategory[] = [];
  let current = categories.find((c) => c.id === categoryId);

  while (current?.parentId) {
    const parent = categories.find((c) => c.id === current!.parentId);
    if (parent) {
      ancestors.unshift(parent);
      current = parent;
    } else {
      break;
    }
  }
  return ancestors;
};

/**
 * Builds a nested tree structure of all categories.
 */
export const buildCategoryTree = (
  categories: readonly ProductCategory[] = CATEGORIES
): readonly CategoryTreeNode[] => {
  const topLevel = categories.filter((c) => c.parentId === null);

  const buildNode = (cat: ProductCategory): CategoryTreeNode => ({
    ...cat,
    children: categories.filter((c) => c.parentId === cat.id).map(buildNode),
  });

  return topLevel.map(buildNode);
};
