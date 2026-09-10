import { Box, ShoppingCart, MessageSquare, Megaphone, Search, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface PlanFeature {
  /** The i18n translation key for the feature description. */
  textKey: string;
  /** Whether the feature is included in the plan. */
  included: boolean;
}

export interface PlanItem {
  /** Uniquely identifies the plan for checkout or redirection routing. */
  planId: string;
  /** The i18n translation key for the plan name. */
  nameKey: string;
  /** Numeric monthly price value. */
  priceMonthly: number;
  /** Three-character ISO 4217 currency code. */
  currency: string;
  /** The i18n translation key for the plan description. */
  descKey: string;
  /** The i18n translation key for the button call-to-action text. */
  ctaTextKey: string;
  /** True if this is the highlighted 'popular' plan card. */
  popular?: boolean;
  /** Collection of specific features associated with this plan. */
  features: PlanFeature[];
}

export interface PlatformFeatureItem {
  /** Lucide icon component. */
  icon: LucideIcon;
  /** The i18n translation key for the feature title. */
  titleKey: string;
  /** The i18n translation key for the feature description. */
  descKey: string;
}

export interface ValuePropositionItem {
  /** The i18n translation key for the value prop title. */
  titleKey: string;
  /** The i18n translation key for the value prop sub-text description. */
  descKey: string;
}

export const VALUE_PROPOSITIONS: ValuePropositionItem[] = [
  {
    titleKey: 'subscriptionPlans.valueProp.keepSales.title',
    descKey: 'subscriptionPlans.valueProp.keepSales.desc',
  },
  {
    titleKey: 'subscriptionPlans.valueProp.listings.title',
    descKey: 'subscriptionPlans.valueProp.listings.desc',
  },
  {
    titleKey: 'subscriptionPlans.valueProp.relations.title',
    descKey: 'subscriptionPlans.valueProp.relations.desc',
  },
];

export const FREE_PLAN_BENEFITS = [
  'subscriptionPlans.freePlan.registration',
  'subscriptionPlans.freePlan.threeProducts',
  'subscriptionPlans.freePlan.firstMonth',
  'subscriptionPlans.freePlan.noCommission',
  'subscriptionPlans.freePlan.upgradeNeeded',
];

export const PLANS: PlanItem[] = [
  {
    planId: 'starter',
    nameKey: 'subscriptionPlans.pricing.starter.name',
    priceMonthly: 499,
    currency: 'INR',
    descKey: 'subscriptionPlans.pricing.starter.desc',
    ctaTextKey: 'subscriptionPlans.pricing.starter.cta',
    features: [
      { textKey: 'subscriptionPlans.features.keepSales', included: true },
      { textKey: 'subscriptionPlans.features.listings100', included: true },
      { textKey: 'subscriptionPlans.features.orderManagement', included: true },
      { textKey: 'subscriptionPlans.features.paymentProcessing', included: true },
      { textKey: 'subscriptionPlans.features.marketingTools', included: false },
      { textKey: 'subscriptionPlans.features.supportRep', included: false },
    ],
  },
  {
    planId: 'growth',
    nameKey: 'subscriptionPlans.pricing.growth.name',
    priceMonthly: 999,
    currency: 'INR',
    descKey: 'subscriptionPlans.pricing.growth.desc',
    popular: true,
    ctaTextKey: 'subscriptionPlans.pricing.growth.cta',
    features: [
      { textKey: 'subscriptionPlans.features.keepSales', included: true },
      { textKey: 'subscriptionPlans.features.listingsUnlimited', included: true },
      { textKey: 'subscriptionPlans.features.analyticsDashboard', included: true },
      { textKey: 'subscriptionPlans.features.storefrontConfig', included: true },
      { textKey: 'subscriptionPlans.features.seoTools', included: true },
      { textKey: 'subscriptionPlans.features.supportRep', included: false },
    ],
  },
  {
    planId: 'professional',
    nameKey: 'subscriptionPlans.pricing.professional.name',
    priceMonthly: 1999,
    currency: 'INR',
    descKey: 'subscriptionPlans.pricing.professional.desc',
    ctaTextKey: 'subscriptionPlans.pricing.professional.cta',
    features: [
      { textKey: 'subscriptionPlans.features.keepSales', included: true },
      { textKey: 'subscriptionPlans.features.listingsUnlimited', included: true },
      { textKey: 'subscriptionPlans.features.everythingInGrowth', included: true },
      { textKey: 'subscriptionPlans.features.domainIntegration', included: true },
      { textKey: 'subscriptionPlans.features.apiIntegration', included: true },
      { textKey: 'subscriptionPlans.features.supportRep', included: true },
    ],
  },
];

export const PLATFORM_FEATURES: PlatformFeatureItem[] = [
  {
    icon: Box,
    titleKey: 'subscriptionPlans.platform.inventory.title',
    descKey: 'subscriptionPlans.platform.inventory.desc',
  },
  {
    icon: ShoppingCart,
    titleKey: 'subscriptionPlans.platform.order.title',
    descKey: 'subscriptionPlans.platform.order.desc',
  },
  {
    icon: MessageSquare,
    titleKey: 'subscriptionPlans.platform.message.title',
    descKey: 'subscriptionPlans.platform.message.desc',
  },
  {
    icon: Megaphone,
    titleKey: 'subscriptionPlans.platform.marketing.title',
    descKey: 'subscriptionPlans.platform.marketing.desc',
  },
  {
    icon: Search,
    titleKey: 'subscriptionPlans.platform.seo.title',
    descKey: 'subscriptionPlans.platform.seo.desc',
  },
  {
    icon: BarChart3,
    titleKey: 'subscriptionPlans.platform.analytics.title',
    descKey: 'subscriptionPlans.platform.analytics.desc',
  },
];
