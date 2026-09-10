import React from 'react';
import {
  Laptop,
  Shirt,
  Home,
  Dumbbell,
  Sparkles,
  BookOpen,
  ShoppingBag,
  Smartphone,
  Heart,
  Car,
  Tv,
  Baby,
  type LucideIcon,
} from 'lucide-react';
import type { CategoryIconName } from '@/shared/constants';

const ICON_MAP: Record<CategoryIconName | 'Default', LucideIcon> = {
  Laptop,
  Shirt,
  Home,
  Dumbbell,
  Sparkles,
  BookOpen,
  ShoppingBag,
  Smartphone,
  Heart,
  Car,
  Tv,
  Baby,
  Default: ShoppingBag,
};

interface CategoryIconProps {
  name?: CategoryIconName | string;
  className?: string;
  'aria-label'?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  className,
  'aria-label': ariaLabel,
}) => {
  const iconKey = name && name in ICON_MAP ? (name as CategoryIconName) : 'Default';
  const Icon = ICON_MAP[iconKey];

  return (
    <Icon className={className} aria-hidden={!ariaLabel} aria-label={ariaLabel} focusable={false} />
  );
};
