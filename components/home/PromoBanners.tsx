import Link from 'next/link';

const PROMO_BANNERS = [
  {
    id: 'flash-sale',
    href: '/products?filter=flash',
    title: 'Flash Sale — Up to 70% Off',
    // semantic-ish tokens with dark-mode variants for better contrast
    gradient: 'from-amber-600 to-orange-600 dark:from-amber-500 dark:to-orange-500',
  },
  {
    id: 'festival',
    href: '/products?filter=festival',
    title: 'Festival Offers — Extra Savings',
    gradient: 'from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500',
  },
] as const;

function PromoBanners() {
  return (
    <section className="py-8" aria-labelledby="promo-banners-heading">
      <h2 id="promo-banners-heading" className="sr-only">
        Current promotions
      </h2>
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {PROMO_BANNERS.map((banner) => (
            <Link
              key={banner.id}
              href={banner.href}
              className={`block rounded-xl overflow-hidden shadow-lg transition-transform duration-200
                hover:scale-[1.02] hover:shadow-xl
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                active:scale-[0.98]
              `}
            >
              <div
                className={`relative h-44 md:h-56 flex items-center justify-center text-white font-bold px-4
                  bg-gradient-to-r ${banner.gradient} drop-shadow-sm
                `}
              >
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl text-center">
                  {banner.title}
                </h3>
                {/* decorative overlay for improved contrast on light gradients */}
                <span aria-hidden="true" className="absolute inset-0 bg-black/6 dark:bg-black/10" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PromoBanners;
