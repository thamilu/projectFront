import { Store, Users, Boxes, Megaphone, MessageSquare, BarChart3, LucideIcon } from 'lucide-react';

export interface SellerBenefit {
  id: string;
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
}

export const SELLER_BENEFITS: SellerBenefit[] = [
  {
    id: 'build-store',
    icon: Store,
    titleKey: 'Build Your Own Store',
    descriptionKey: 'Create a customized storefront to showcase your unique brand.',
  },
  {
    id: 'own-customers',
    icon: Users,
    titleKey: 'Own Your Customers',
    descriptionKey: 'Connect directly, build loyalty, and own your customer data.',
  },
  {
    id: 'inventory',
    icon: Boxes,
    titleKey: 'Inventory Management',
    descriptionKey: 'Track stock levels, set alerts, and manage products effortlessly.',
  },
  {
    id: 'marketing',
    icon: Megaphone,
    titleKey: 'Marketing Tools',
    descriptionKey: 'Run promotions, issue discount coupons, and boost store traffic.',
  },
  {
    id: 'messaging',
    icon: MessageSquare,
    titleKey: 'Customer Messaging',
    descriptionKey: 'Engage with shoppers in real-time to solve queries and close sales.',
  },
  {
    id: 'analytics',
    icon: BarChart3,
    titleKey: 'Analytics Dashboard',
    descriptionKey: 'Track sales performance, visitor insights, and grow your store.',
  },
] as const;
