import { resolveRoleNavigation } from '@/domains/navigation/resolvers/role-navigation-resolver';
import { UserRole } from '@/domains/auth/contracts/auth.types';
import { APP_ROUTES } from '@/shared/routes';

describe('RoleNavigationResolver Unit Tests', () => {
  it('resolves unauthenticated guest with clean public actions', () => {
    const navModel = resolveRoleNavigation(null, []);

    expect(navModel.isUserAuthenticated).toBe(false);
    expect(navModel.identity).toBeNull();
    expect(navModel.customerSections).toHaveLength(0);
    expect(navModel.businessActions).toHaveLength(2);
    expect(navModel.businessActions[0].href).toBe(APP_ROUTES.SELLER.REGISTER);
    expect(navModel.businessActions[1].href).toBe(APP_ROUTES.BECOME_DELIVERY_AGENT);
    expect(navModel.settingsHref).toBe(APP_ROUTES.SETTINGS);
  });

  it('resolves customer role with Customer badge and Become Seller / Delivery Partner actions', () => {
    const user = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    const navModel = resolveRoleNavigation(user, [UserRole.CUSTOMER]);

    expect(navModel.isUserAuthenticated).toBe(true);
    expect(navModel.identity?.displayName).toBe('John Doe');
    expect(navModel.identity?.email).toBe('john@example.com');
    expect(navModel.identity?.roleLabel).toBe('Customer');
    expect(navModel.identity?.roleBadgeVariant).toBe('default');

    // Customer Hub (My Profile, My Orders)
    expect(navModel.customerSections[0].items).toHaveLength(2);

    // Business Actions
    const sellerAction = navModel.businessActions.find((a) => a.id === 'action-become-seller');
    const deliveryAction = navModel.businessActions.find((a) => a.id === 'action-become-delivery');

    expect(sellerAction).toBeDefined();
    expect(sellerAction?.href).toBe(APP_ROUTES.SELLER.REGISTER);
    expect(deliveryAction).toBeDefined();
    expect(deliveryAction?.href).toBe(APP_ROUTES.BECOME_DELIVERY_AGENT);
  });

  it('resolves verified seller with Seller Center link', () => {
    const user = {
      name: 'Seller Partner',
      email: 'seller@example.com',
    };

    const navModel = resolveRoleNavigation(user, [UserRole.SELLER]);

    expect(navModel.isUserAuthenticated).toBe(true);
    expect(navModel.isSeller).toBe(true);
    expect(navModel.identity?.roleLabel).toBe('Seller');
    expect(navModel.identity?.roleBadgeVariant).toBe('default');

    const sellerAction = navModel.businessActions.find((a) => a.id === 'action-seller-center');
    expect(sellerAction).toBeDefined();
    expect(sellerAction?.href).toBe(APP_ROUTES.SELLER.DASHBOARD);
    expect(sellerAction?.statusBadge).toBe('active');
  });

  it('resolves delivery partner with Delivery Center link', () => {
    const user = {
      name: 'Rider Dave',
      email: 'rider@example.com',
    };

    const navModel = resolveRoleNavigation(user, [UserRole.DELIVERY_AGENT]);

    expect(navModel.isUserAuthenticated).toBe(true);
    expect(navModel.isDeliveryAgent).toBe(true);
    expect(navModel.identity?.roleLabel).toBe('Delivery Partner');
    expect(navModel.identity?.roleBadgeVariant).toBe('secondary');

    const deliveryAction = navModel.businessActions.find((a) => a.id === 'action-delivery-center');
    expect(deliveryAction).toBeDefined();
    expect(deliveryAction?.href).toBe(APP_ROUTES.DELIVERY.DASHBOARD);
    expect(deliveryAction?.statusBadge).toBe('active');
  });

  it('resolves combined Seller and Delivery Agent role with dual center hubs', () => {
    const user = {
      name: 'Super Partner',
      email: 'partner@example.com',
    };

    const navModel = resolveRoleNavigation(user, [UserRole.SELLER, UserRole.DELIVERY_AGENT]);

    expect(navModel.identity?.roleLabel).toBe('Partner');
    expect(navModel.identity?.roleBadgeVariant).toBe('default');

    const sellerAction = navModel.businessActions.find((a) => a.id === 'action-seller-center');
    const deliveryAction = navModel.businessActions.find((a) => a.id === 'action-delivery-center');

    expect(sellerAction?.href).toBe(APP_ROUTES.SELLER.DASHBOARD);
    expect(deliveryAction?.href).toBe(APP_ROUTES.DELIVERY.DASHBOARD);
  });
});
