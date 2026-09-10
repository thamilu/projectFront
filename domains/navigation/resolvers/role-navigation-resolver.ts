import { UserRole } from '@/domains/auth/contracts/auth.types';
import { APP_ROUTES } from '@/shared/routes';
import type {
  NavigationViewModel,
  ContextualBusinessAction,
  UserIdentitySummary,
} from '../contracts/navigation.types';
import { User as UserIcon, ShoppingBag, Store, Truck } from 'lucide-react';

export interface UserSessionPayload {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  username?: string | null;
  firstName?: string;
  lastName?: string;
  phone?: string;
  id?: string | number;
  roles?: string[];
}

/**
 * Pure capability resolver that computes the structured NavigationViewModel
 * from authentication state, user identity, and active roles.
 *
 * Enforces intentional enterprise information architecture:
 * - Utility bar: persistent platform recruitment / partner hubs
 * - Main header: primary commerce navigation & quick icon actions (Wishlist, Cart)
 * - Profile menu: focused personal account actions (Profile, Orders, Settings) + active business hubs only
 */
export function resolveRoleNavigation(
  user: UserSessionPayload | null | undefined,
  roles: (UserRole | string)[] = [],
  t?: (key: string) => string
): NavigationViewModel {
  const translate = (key: string, fallback: string) => {
    if (!t) return fallback;
    const res = t(key);
    if (!res || res === key || res.startsWith('header.') || res.startsWith('HEADER.')) {
      return fallback;
    }
    return res;
  };

  const isUserAuthenticated = Boolean(user);

  if (!isUserAuthenticated || !user) {
    return {
      identity: null,
      customerSections: [],
      businessActions: [
        {
          id: 'action-sell-on-eshop',
          label: translate('header.utilityBar.sellOnEshop', 'Sell on eShop'),
          href: APP_ROUTES.SELLER.REGISTER,
          statusBadge: 'none',
          Icon: Store,
        },
        {
          id: 'action-become-delivery',
          label: translate('header.utilityBar.becomeDeliveryAgent', 'Become a Delivery Partner'),
          href: APP_ROUTES.BECOME_DELIVERY_AGENT,
          statusBadge: 'none',
          Icon: Truck,
        },
      ],
      settingsHref: APP_ROUTES.SETTINGS,
      isUserAuthenticated: false,
      isSeller: false,
      isDeliveryAgent: false,
    };
  }

  const isSeller = roles.includes(UserRole.SELLER) || roles.includes('SELLER');
  const isDeliveryAgent =
    roles.includes(UserRole.DELIVERY_AGENT) ||
    roles.includes('DELIVERY_AGENT') ||
    roles.includes('DELIVERY');

  // Compute Identity Header details with clean human-readable labels
  let roleLabel = translate('header.roles.customer', 'Customer');
  let roleBadgeVariant: UserIdentitySummary['roleBadgeVariant'] = 'default';

  if (isSeller && isDeliveryAgent) {
    roleLabel = translate('header.roles.partner', 'Partner');
    roleBadgeVariant = 'default';
  } else if (isSeller) {
    roleLabel = translate('header.roles.seller', 'Seller');
    roleBadgeVariant = 'default';
  } else if (isDeliveryAgent) {
    roleLabel = translate('header.roles.delivery', 'Delivery Partner');
    roleBadgeVariant = 'secondary';
  }

  const displayName = user.name || user.username || 'Account';
  const email = user.email || '';
  const avatarUrl = user.image || undefined;

  const identity: UserIdentitySummary = {
    displayName,
    email,
    avatarUrl,
    roleLabel,
    roleBadgeVariant,
  };

  // Compute Personal Account actions (My Profile, My Orders)
  const customerSections = [
    {
      id: 'section-account',
      items: [
        {
          id: 'item-my-profile',
          label: translate('header.aria.myProfile', 'My Profile'),
          href: APP_ROUTES.PROFILE,
          Icon: UserIcon,
        },
        {
          id: 'item-my-orders',
          label: translate('header.aria.orders', 'My Orders'),
          href: APP_ROUTES.ORDERS,
          Icon: ShoppingBag,
        },
      ],
    },
  ];

  // Compute Platform / Business Actions
  const businessActions: ContextualBusinessAction[] = [];

  if (isSeller) {
    businessActions.push({
      id: 'action-seller-center',
      label: translate('header.utilityBar.sellerPanel', 'Seller Center'),
      href: APP_ROUTES.SELLER.DASHBOARD,
      statusBadge: 'active',
      badgeLabel: 'Active',
      Icon: Store,
    });
  } else {
    businessActions.push({
      id: 'action-become-seller',
      label: translate('header.utilityBar.sellOnEshop', 'Sell on eShop'),
      href: APP_ROUTES.SELLER.REGISTER,
      statusBadge: 'none',
      Icon: Store,
    });
  }

  if (isDeliveryAgent) {
    businessActions.push({
      id: 'action-delivery-center',
      label: translate('header.utilityBar.deliveryCenter', 'Delivery Center'),
      href: APP_ROUTES.DELIVERY.DASHBOARD,
      statusBadge: 'active',
      badgeLabel: 'Active',
      Icon: Truck,
    });
  } else {
    businessActions.push({
      id: 'action-become-delivery',
      label: translate('header.utilityBar.becomeDeliveryAgent', 'Become a Delivery Partner'),
      href: APP_ROUTES.BECOME_DELIVERY_AGENT,
      statusBadge: 'none',
      Icon: Truck,
    });
  }

  return {
    identity,
    customerSections,
    businessActions,
    settingsHref: APP_ROUTES.SETTINGS,
    isUserAuthenticated: true,
    isSeller,
    isDeliveryAgent,
  };
}
