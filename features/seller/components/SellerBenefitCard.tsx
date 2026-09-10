import React from 'react';
import type { SellerBenefit } from '../constants/seller-benefits';

interface SellerBenefitCardProps {
  benefit: SellerBenefit;
  headingLevel?: 'h2' | 'h3' | 'h4';
}

export function SellerBenefitCard({
  benefit,
  headingLevel: Heading = 'h3',
}: SellerBenefitCardProps): React.JSX.Element {
  const Icon = benefit.icon;

  return (
    <article
      role="listitem"
      className="focus-within:ring-primary rounded-2xl border border-slate-100/80 dark:border-slate-800/40 bg-white p-6 text-center transition-all duration-300 focus-within:ring-2 hover:shadow-md hover:-translate-y-0.5 dark:bg-slate-900 flex flex-col"
    >
      {/*
        Decorative, not an image with a name. The icon previously carried
        `role="img"` labelled with the same text as the heading immediately
        below it, so a screen-reader user heard each benefit's title twice.

        The `text-indigo-600 dark:text-indigo-400` override is also gone: the
        wrapper already sets `text-primary`, which the icon now inherits. Indigo
        is not this app's brand colour (`--color-primary` resolves to blue-600),
        so these six icons rendered a visibly different blue from the primary
        CTA on the same screen.
      */}
      <div className="text-primary mb-3 flex justify-center" aria-hidden="true">
        <Icon className="h-8 w-8" />
      </div>
      <Heading className="text-foreground mb-2 font-semibold">{benefit.titleKey}</Heading>
      <p className="text-muted-foreground text-sm">{benefit.descriptionKey}</p>
    </article>
  );
}
