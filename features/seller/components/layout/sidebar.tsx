'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Settings,
  Store,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { Button } from '@/shared/ui/atoms/button';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/seller/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Products',
    href: '/seller/products',
    icon: Package,
  },
  {
    title: 'Inventory',
    href: '/seller/inventory',
    icon: Boxes,
  },
  {
    title: 'Orders',
    href: '/seller/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Store Profile',
    href: '/seller/store',
    icon: Store,
  },
];

const bottomNavItems: NavItem[] = [
  {
    title: 'My Profile',
    href: '/seller/profile',
    icon: User,
  },
  {
    title: 'Settings',
    href: '/seller/settings',
    icon: Settings,
  },
  {
    title: 'Back to Shop',
    href: '/customer/dashboard',
    icon: ShoppingCart,
  },
];

export function SellerSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname() || '';

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] border-r bg-background transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Collapse Toggle */}
        <div className="flex justify-end p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 overflow-y-auto">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                isCollapsed={isCollapsed}
              />
            ))}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="border-t p-3 space-y-1">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              isCollapsed={isCollapsed}
            />
          ))}

          <div className="text-xs text-center text-muted-foreground opacity-50 pb-2 mt-2">
            Seller Panel
          </div>
        </div>
      </div>
    </aside>
  );
}

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
}

function NavLink({ item, isActive, isCollapsed }: NavLinkProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        isCollapsed && 'justify-center px-2'
      )}
      title={isCollapsed ? item.title : undefined}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {!isCollapsed && (
        <>
          <span className="flex-1">{item.title}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-xs text-primary">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}
