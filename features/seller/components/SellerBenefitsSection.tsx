import React from 'react';
import { SELLER_BENEFITS } from '../constants/seller-benefits';
import { SellerBenefitCard } from './SellerBenefitCard';

export function SellerBenefitsSection(): React.JSX.Element {
  return (
    <section aria-labelledby="benefits-heading" className="mx-auto mt-12 max-w-4xl">
      <h2 id="benefits-heading" className="text-slate-900 dark:text-white mb-6 text-center text-2xl font-bold tracking-tight">
        Everything You Need To Grow Your Business
      </h2>
      <div className="grid gap-6 md:grid-cols-3" role="list" aria-label="Seller benefits">
        {SELLER_BENEFITS.map((benefit) => (
          <SellerBenefitCard key={benefit.id} benefit={benefit} headingLevel="h3" />
        ))}
      </div>
    </section>
  );
}
