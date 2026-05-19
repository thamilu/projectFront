'use client';

import Link from 'next/link';
import { cn } from '@/shared/utils';
import { useAuth } from '@/features/auth';
import { Button } from '@/shared/ui/atoms/button';
import { useCallback, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import SearchBar from './SearchBar';
import { Heart, ShoppingCart, User, Menu, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/atoms/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/shared/ui/atoms/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/atoms/avatar';
// import { useKeycloakAuth } from '@/shared/hooks/useKeycloakAuth'; // DEPRECATED
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/atoms/dialog';
import { Sheet, SheetContent, SheetTrigger } from '@/shared/ui/atoms/sheet';
import { useCartStore, selectCartItemCount } from '@/features/cart/store/cart-store';
import { useWishlistStore } from '@/features/wishlist/store/wishlist-store';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/atoms/popover';
import CartPreview from './cart-preview';
import CategoryMenu from './category-menu';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';
import { RedirectingScreen } from '@/features/auth';
import { useMounted } from '@/shared/hooks';
import { LanguageSwitcher } from '../common/language-switcher';
import { useI18n } from '@/core/i18n';
import { useFeatureFlags, featureFlags } from '@/core/feature-flags';

const DIALOG_TARGET = {
  CART: 'cart',
  WISHLIST: 'wishlist',
} as const;

type DialogTarget = (typeof DIALOG_TARGET)[keyof typeof DIALOG_TARGET];

interface NavItem {
  href: string;
  label: string;
}

interface HeaderProps {
  navItems?: NavItem[]; // server-provided allowed routes (preferred)
}

export default function Header({ navItems: providedNavItems }: HeaderProps) {
  const { t } = useI18n();
  const { isEnabled } = useFeatureFlags();
  const mounted = useMounted();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { 
    user: currentUser, 
    isAuthenticated: isUserAuthenticated, 
    isLoading: isAuthLoading,
    login,
    logout,
    isSeller
  } = useAuth();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTarget, setDialogTarget] = useState<DialogTarget | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Detect scroll for shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // NOTE: Only use these for rendering after 'mounted' is true to avoid hydration mismatch

  // Default public navigation
  const navItems: NavItem[] = providedNavItems ?? [
    { href: APP_ROUTES.PRODUCTS, label: 'Products' },
    { href: '#deals', label: 'Deals' },
  ];

  // Keycloak external URLs should be provided via NEXT_PUBLIC_* env vars
  const KEYCLOAK_LOGIN_URL = process.env.NEXT_PUBLIC_KEYCLOAK_LOGIN_URL || '/auth/login';

  const handleProtectedNavigate = useCallback(
    (href: string, target: DialogTarget) => {
      if (!isUserAuthenticated) {
        setDialogTarget(target);
        setDialogOpen(true);
        return;
      }
      router.push(href);
    },
    [isUserAuthenticated, router]
  );

  const handleLogin = useCallback(async () => {
    setIsPending(true);
    setDialogOpen(false);
    try {
      // Correctly await the login process
      await login(window.location.pathname + window.location.search);
    } catch (_error) {
      toast.error('Failed to sign in. Please try again.');
      const fallbackUrl = `${KEYCLOAK_LOGIN_URL}${KEYCLOAK_LOGIN_URL.includes('?') ? '&' : '?'}redirect=${encodeURIComponent(window.location.href)}`;
      window.location.href = fallbackUrl;
    } finally {
      setIsPending(false);
    }
  }, [login, KEYCLOAK_LOGIN_URL]);

  const handleLogout = useCallback(async () => {
    setIsPending(true);
    try {
      queryClient.clear();
      await logout();
      toast.success('Successfully signed out');
    } catch (_error) {
      toast.error('Sign out failed. Redirecting to login.');
      queryClient.clear();
      router.push(APP_ROUTES.AUTH_LOGIN);
    } finally {
      setIsPending(false);
    }
  }, [logout, queryClient, router]);

  return (
    <>
      {isPending && <RedirectingScreen />}
      <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300 glass-premium',
        scrolled ? 'shadow-[0_8px_32px_rgba(0,0,0,0.12)]' : 'shadow-none'
      )}
    >
      {/* Top Utility Bar - Hidden on mobile and dashboard routes */}
      {!pathname?.startsWith(APP_ROUTES.SELLER.BASE) && !pathname?.startsWith(APP_ROUTES.DELIVERY.DASHBOARD) && (
        <div className="bg-muted/30 hidden border-b border-white/5 lg:block">
          <div className="text-muted-foreground container mx-auto flex h-9 items-center justify-between px-4 text-xs font-medium md:px-6">
            <div className="flex items-center gap-6">
              <Link href="/help" className="hover:text-foreground transition-colors">
                Help & Support
              </Link>
              <Link href="/orders/track" className="hover:text-foreground transition-colors">
                Track Order
              </Link>
            </div>
            <div className="flex items-center gap-6">
              {mounted && isSeller ? (
                <Link
                  href={APP_ROUTES.SELLER.DASHBOARD}
                  className="font-semibold text-purple-600 transition-colors hover:text-purple-700 dark:text-purple-400"
                >
                  Seller Panel
                </Link>
              ) : (
                <Link
                    href={isSeller ? APP_ROUTES.SELLER.DASHBOARD : APP_ROUTES.SELLER.REGISTER}
                  onClick={(e) => {
                    if (mounted && !isUserAuthenticated) {
                      e.preventDefault();
                      setDialogTarget(null);
                      setDialogOpen(true);
                    }
                  }}
                  className="font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400"
                >
                  Sell on eShop
                </Link>
              )}
              <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                <span className="cursor-default">EN / INR</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <a
        href="#main-content"
        className="focus:bg-primary focus:text-primary-foreground focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:ring-2 focus:ring-offset-2 focus:outline-none"
      >
        Skip to main content
      </a>

      <div className="container mx-auto flex h-16 items-center px-4 pr-12 md:px-6">
        {/* Left: Mobile Menu + Logo */}
        <div className="mr-4 flex shrink-0 items-center gap-2">
          {/* Mobile Hamburger Menu — deferred to avoid Radix aria-controls hydration mismatch */}
          {mounted ? (
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-70 sm:w-80">
              <nav
                className="mt-8 flex flex-col gap-4"
                role="navigation"
                aria-label="Mobile navigation"
              >
                {navItems.map((item) => {
                  const isActive =
                    item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'rounded-md px-3 py-2 text-lg font-medium transition-colors',
                        isActive ? 'text-foreground bg-accent' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                <div className="my-2 border-t pt-4">
                  <Link
                    href="/orders/track"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-muted-foreground hover:text-foreground hover:bg-accent block rounded-md px-3 py-2 text-lg font-medium transition-colors"
                  >
                    Track Order
                  </Link>
                  <Link
                    href="/help"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-muted-foreground hover:text-foreground hover:bg-accent block rounded-md px-3 py-2 text-lg font-medium transition-colors"
                  >
                    Help & Support
                  </Link>
                  {mounted && isSeller ? (
                    <Link
                      href={APP_ROUTES.SELLER.DASHBOARD}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-md px-3 py-2 text-lg font-semibold text-purple-600 transition-colors hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/10"
                    >
                      Seller Panel
                    </Link>
                  ) : (
                    <Link
                        href={isSeller ? APP_ROUTES.SELLER.DASHBOARD : APP_ROUTES.SELLER.REGISTER}
                        onClick={(e) => {
                        if (mounted && !isUserAuthenticated) {
                          setMobileMenuOpen(false);
                          e.preventDefault();
                          setDialogTarget(null);
                          setDialogOpen(true);
                        } else {
                          setMobileMenuOpen(false);
                        }
                      }}
                      className="block rounded-md px-3 py-2 text-lg font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/10"
                    >
                      Sell on eShop
                    </Link>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
          ) : (
            /* SSR placeholder — identical visuals, no Radix ID generation */
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Link
            href="/"
            aria-label="eShop home"
            className="gradient-emerald-text text-2xl font-extrabold transition-all hover:opacity-80"
          >
            eShop
          </Link>
        </div>

        {/* Center: Search (flex-grow, centered) - Hide on dashboard routes */}
        <div className="flex flex-1 justify-center">
          {!pathname?.startsWith(APP_ROUTES.SELLER.BASE) && !pathname?.startsWith(APP_ROUTES.DELIVERY.DASHBOARD) && (
            <div className="w-full max-w-180">
              <SearchBar />
            </div>
          )}
        </div>

        {/* Right: Nav + Auth */}
        <div className="ml-2 flex shrink-0 items-center gap-2">
          {/* Category Menu */}
          <div className="hidden lg:block">
            <CategoryMenu />
          </div>

          <nav
            className="hidden items-center gap-2 lg:flex"
            role="navigation"
            aria-label="Main navigation"
          >
            {/* Show consumer nav only on non-dashboard routes */}
            {!pathname?.startsWith(APP_ROUTES.SELLER.BASE) && !pathname?.startsWith(APP_ROUTES.DELIVERY.DASHBOARD) && (
              <>
                {navItems
                  .filter((item) => {
                    const label = item.label.toLowerCase().trim();
                    return label !== 'wishlist' && label !== 'cart';
                  })
                  .map((item) => {
                    const isActive =
                      item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'rounded px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all',
                          isActive ? 'text-foreground bg-accent' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
              </>
            )}

            {/* Show "Back to Shop" link when on dashboard routes */}
            {(pathname?.startsWith(APP_ROUTES.SELLER.BASE) || pathname?.startsWith('/delivery')) && (
              <Link
                href="/"
                className="text-muted-foreground hover:text-foreground hover:bg-accent rounded px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all"
              >
                Back to Shop
              </Link>
            )}
          </nav>

          <TooltipProvider>
            <div className="flex items-center gap-4">
              {/* Hide Wishlist/Cart on dashboard routes */}
              {!pathname?.startsWith(APP_ROUTES.SELLER.BASE) && !pathname?.startsWith(APP_ROUTES.DELIVERY.DASHBOARD) && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        onClick={() => handleProtectedNavigate('/wishlist', DIALOG_TARGET.WISHLIST)}
                        aria-label="Wishlist"
                        className="relative flex items-center gap-2 rounded-full px-3"
                      >
                        <span className="flex items-center gap-2">
                          <Heart className="h-5 w-5" />
                          <WishlistBadge />
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Wishlist</TooltipContent>
                  </Tooltip>

                  {mounted && isUserAuthenticated ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          aria-label="Cart"
                          className="relative flex items-center gap-2 rounded-full px-3"
                        >
                          <span className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            <CartBadge />
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" align="end">
                        <CartPreview />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          onClick={() => handleProtectedNavigate(APP_ROUTES.CART, DIALOG_TARGET.CART)}
                          aria-label="Cart"
                          className="relative flex items-center gap-2 rounded-full px-3"
                        >
                          <span className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            <CartBadge />
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Cart</TooltipContent>
                    </Tooltip>
                  )}
                </>
              )}

              {isEnabled('HINDI_ENABLED') && <LanguageSwitcher />}

              {mounted && isUserAuthenticated && currentUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mr-2 rounded-full ring-2 ring-emerald-500/20 transition-all hover:ring-emerald-500/40"
                      aria-label="Profile"
                    >
                      <Avatar className="h-8 w-8">
                        {currentUser?.name ? (
                          <>
                            <AvatarImage
                              src={(currentUser?.image as string) || ''}
                              alt={`${currentUser?.name}'s avatar`}
                            />
                            <AvatarFallback>
                              {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </>
                        ) : (
                          <AvatarFallback>
                            <User className="text-muted-foreground h-5 w-5" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-56 border-white/10 bg-background/80 backdrop-blur-xl">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">
                          {currentUser?.name ??
                            ('username' in currentUser ? (currentUser.username as string) : 'Account')}
                        </p>
                        {currentUser?.email && (
                          <p className="text-muted-foreground text-xs">{currentUser.email}</p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href={APP_ROUTES.PROFILE}
                        className="cursor-pointer"
                      >
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    {isSeller && (
                      <DropdownMenuItem asChild>
                        <Link
                          href={APP_ROUTES.SELLER.PROFILE}
                          className="cursor-pointer"
                        >
                          Seller Profile
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="cursor-pointer">
                        Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled={isPending}>
                      <button
                        onClick={handleLogout}
                        disabled={isPending}
                        className="flex w-full items-center gap-2 text-left"
                      >
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isPending ? t('common.loading') : t('common.signOut')}
                      </button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  onClick={handleLogin}
                  disabled={isPending}
                  className={cn(
                    "relative overflow-hidden rounded-full px-6 py-2 transition-all duration-300",
                    "border border-white/10 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white dark:text-emerald-400 dark:hover:bg-emerald-600",
                    isPending && "cursor-wait opacity-80"
                  )}
                  aria-label="Sign In"
                >
                  <div className="flex items-center gap-2">
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <span className="font-semibold">
                      {isPending ? t('common.loading') : t('common.signIn')}
                    </span>
                  </div>
                </Button>
              )}
            </div>
          </TooltipProvider>
        </div>
      </div>

      {/* Dialog for unauthenticated wishlist/cart actions */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-white/10 bg-background/80 p-6 backdrop-blur-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {dialogTarget === DIALOG_TARGET.CART
                ? 'Your eShop Cart is empty'
                : dialogTarget === DIALOG_TARGET.WISHLIST
                  ? 'Your wishlist is empty'
                  : 'Account required'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {dialogTarget === DIALOG_TARGET.CART
                ? "Shop today's deals or sign in to access your cart."
                : dialogTarget === DIALOG_TARGET.WISHLIST
                  ? 'Save items you love â€” sign in to access your wishlist.'
                  : 'Sign in to continue.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Button
              onClick={() => {
                setDialogOpen(false);
                router.push(`${APP_ROUTES.PRODUCTS}?filter=deals`);
              }}
              className="h-12 w-full bg-emerald-500 font-bold text-white hover:bg-emerald-600"
            >
              Shop today's deals
            </Button>

            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={handleLogin}
                disabled={isPending}
                className="h-12 w-full border-emerald-500/20 bg-emerald-500/5 font-bold text-emerald-600 hover:bg-emerald-500 hover:text-white"
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <User className="mr-2 h-4 w-4" />}
                {isPending ? 'Redirecting...' : 'Sign in with Keycloak'}
              </Button>

              <p className="text-muted-foreground text-center text-xs">
                New user? Click above to sign in, then select "Register" on Keycloak's login page.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
    </>
  );
}

function CartBadge() {
  const count = useCartStore(selectCartItemCount);
  if (!count) return null;
  return (
    <span className="text-destructive-foreground bg-destructive absolute -top-1 -right-1 inline-flex min-w-4.5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function WishlistBadge() {
  const wishlistState = useWishlistStore();
  const count = wishlistState.wishlists.reduce(
    (total, wishlist) => total + wishlist.items.length,
    0
  );
  if (!count) return null;
  return (
    <span className="text-destructive-foreground bg-destructive absolute -top-1 -right-1 inline-flex min-w-4.5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold">
      {count > 99 ? '99+' : count}
    </span>
  );
}


