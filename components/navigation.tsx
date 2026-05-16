'use client';

import Link from 'next/link';
import { ShoppingCart, User, LogOut, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { signOut } from 'next-auth/react';
import { useCart } from '@/features/cart/hooks/use-cart';
import { APP_ROUTES } from '@/constants/routes/app-routes';

export function Navigation() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const handleLogout = () => logout();

  const cartItemsCount = cart?.items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0) || 0;

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold">
            E-Commerce
          </Link>
          <Link href="/products" className="text-sm font-medium hover:underline">
            Products
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/cart">
                <Button variant="ghost" size="sm" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {cartItemsCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link href="/orders">
                <Button variant="ghost" size="sm">
                  <Package className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Link href={APP_ROUTES.AUTH_LOGIN}>
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href={APP_ROUTES.AUTH_REGISTER}>
                <Button size="sm">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
