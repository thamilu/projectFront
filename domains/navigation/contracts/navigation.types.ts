import type { LucideIcon } from 'lucide-react';
import type { UserRole } from '@/domains/auth/contracts/auth.types';

export interface UserIdentitySummary {
  displayName: string;
  email: string;
  avatarUrl?: string;
  roleLabel: string;
  roleBadgeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
}

export interface ContextualBusinessAction {
  id: string;
  label: string;
  href: string;
  statusBadge?: 'none' | 'pending' | 'active';
  badgeLabel?: string;
  Icon?: LucideIcon;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  Icon?: LucideIcon;
  badgeCount?: number;
  requiredRoles?: UserRole[];
  isExternal?: boolean;
}

export interface NavigationSection {
  id: string;
  title?: string;
  items: NavigationItem[];
}

export interface AnnouncementCampaign {
  id: string;
  text: string;
  badge?: string;
  href?: string;
  priority: number;
  persistDismissal: boolean;
}

export interface NavigationViewModel {
  identity: UserIdentitySummary | null;
  customerSections: NavigationSection[];
  businessActions: ContextualBusinessAction[];
  settingsHref: string;
  isUserAuthenticated: boolean;
  isSeller: boolean;
  isDeliveryAgent: boolean;
}
