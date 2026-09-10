import {
  SellerIdentityType,
  SellerBusinessType,
} from '@/domains/seller/contracts/seller.types';
import {
  User,
  Building2,
  Tractor,
  Warehouse,
  ShoppingBag,
  Briefcase,
  LucideIcon,
} from 'lucide-react';

export interface IdentityTypeOption {
  type: SellerIdentityType;
  titleKey: string;
  defaultTitle: string;
  descKey: string;
  defaultDesc: string;
  icon: LucideIcon;
  colorClass: string;
}

export const IDENTITY_TYPE_OPTIONS: IdentityTypeOption[] = [
  {
    type: SellerIdentityType.INDIVIDUAL,
    titleKey: 'sellerOnboarding.identity.individual.title',
    defaultTitle: 'Individual',
    descKey: 'sellerOnboarding.identity.individual.desc',
    defaultDesc: 'Perfect for sole traders, freelancers, or home-based businesses.',
    icon: User,
    colorClass: 'from-blue-500/20 to-indigo-500/20',
  },
  {
    type: SellerIdentityType.BUSINESS,
    titleKey: 'sellerOnboarding.identity.business.title',
    defaultTitle: 'Business',
    descKey: 'sellerOnboarding.identity.business.desc',
    defaultDesc: 'Ideal for registered companies, enterprises, or large brands.',
    icon: Building2,
    colorClass: 'from-purple-500/20 to-pink-500/20',
  },
];

export const BUSINESS_TYPE_ICONS: Record<SellerBusinessType, LucideIcon> = {
  [SellerBusinessType.FARMER]: Tractor,
  [SellerBusinessType.WHOLESALER]: Warehouse,
  [SellerBusinessType.RETAILER]: ShoppingBag,
};

export const DEFAULT_BUSINESS_TYPE_ICON = Briefcase;
