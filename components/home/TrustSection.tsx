const TRUST_ITEMS = [
  { title: 'Fast Delivery', subtitle: 'Same-day & next-day options' },
  { title: 'Secure Payments', subtitle: 'PCI DSS compliant' },
  { title: 'Easy Returns', subtitle: '30-day hassle-free returns' },
  { title: '24/7 Support', subtitle: 'Live chat & phone' },
];

export default function TrustSection() {
  return (
    <section aria-labelledby="trust-heading" className="py-6 md:py-8 bg-background dark:bg-muted">
      <div className="container mx-auto px-4 md:px-6">
        <h3 id="trust-heading" className="sr-only">
          Why customers trust us
        </h3>

        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center" role="list">
          {TRUST_ITEMS.map((it) => (
            <li
              key={it.title}
              className="p-4 transition-transform duration-150 motion-reduce:transform-none hover:scale-[1.02] focus-within:scale-[1.02]"
            >
              <span
                aria-hidden="true"
                className="h-12 w-12 mx-auto rounded-full bg-muted/10 dark:bg-muted/20 shadow flex items-center justify-center mb-2 pointer-events-none"
              >
                <svg
                  className="h-5 w-5 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>

              <div className="font-semibold text-base md:text-lg">{it.title}</div>
              <div className="text-sm text-muted-foreground">{it.subtitle}</div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
