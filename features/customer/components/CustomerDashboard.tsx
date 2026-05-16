// components/customer/CustomerDashboard.tsx
'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import {
  Search,
  Package,
  ShoppingCart,
  Zap,
  Star,
  Heart,
  Truck,
  MapPin,
  ArrowRight,
  Clock,
  Store,
  Sparkles,
  Bell,
  Award,
  ChevronRight,
  Tag,
  Shield,
  RefreshCw,
  HeadphonesIcon,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { apiClient } from '@/lib/http/services';
import { AppError } from '@/lib/errors/AppError';
import { APP_ROUTES } from '@/constants/routes/app-routes';
import { API_ENDPOINTS } from '@/constants/api/endpoints';

// ============ Types ============
interface ProductSummary {
  id: number;
  name: string;
  price: number;
  discountedPrice?: number;
  images?: string[];
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  brand?: string;
  storeName?: string;
  categoryName?: string;
  description?: string;
  sku?: string;
  slug?: string;
  stockQuantity?: number;
  tags?: string[];
  attributes?: Record<string, string>;
  active?: boolean;
}

interface ActiveOrderSnapshot {
  id: number;
  orderNumber: string;
  status: string;
  estimatedDelivery?: string;
  totalAmount: number;
  items: Array<{ productName: string }>;
}

interface CustomerDashboardData {
  accountInfo: {
    customerName: string;
    email: string;
    memberSince: string;
    totalOrders: number;
  };
  trendingProducts: ProductSummary[];
  featuredProducts: ProductSummary[];
  activeOrder: ActiveOrderSnapshot | null;
  cartInfo: {
    itemCount: number;
    totalValue: number;
    items?: Array<{ productName: string; price: number; quantity: number }>;
  };
  wishlistInfo: {
    itemCount: number;
    recentlyAdded: ProductSummary[];
  };
  rewardPoints?: number;
}

interface ExtendedSession {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  accessToken?: string;
  roles?: string[];
}

// ============ Constants & Helpers ============

const ORDER_STATUS_STEPS: Record<string, number> = {
  CONFIRMED: 0,
  PACKED: 1,
  SHIPPED: 2,
  OUT_FOR_DELIVERY: 3,
  DELIVERED: 4,
} as const;

const ORDER_STEP_LABELS = ['Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'] as const;

const FEATURED_CATEGORIES = [
  { name: 'Electronics', icon: '💻', color: '#3b82f6' },
  { name: 'Fashion',     icon: '👗', color: '#ec4899' },
  { name: 'Home',        icon: '🏠', color: '#f59e0b' },
  { name: 'Beauty',      icon: '💄', color: '#a855f7' },
  { name: 'Sports',      icon: '⚽', color: '#10b981' },
  { name: 'Toys',        icon: '🧸', color: '#f97316' },
  { name: 'Books',       icon: '📚', color: '#6366f1' },
  { name: 'Garden',      icon: '🌿', color: '#22c55e' },
] as const;

const PROMO_BANNERS = [
  {
    label: 'Flash Sale',
    title: 'Up to 70% Off\nElectronics',
    cta: 'Shop Now',
    gradient: 'from-blue-600 via-indigo-600 to-violet-600',
    icon: Zap,
    tag: 'Ends in 4h 22m',
  },
  {
    label: 'New Arrivals',
    title: 'Summer\nCollection 2025',
    cta: 'Explore',
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
    icon: Sparkles,
    tag: 'Just landed',
  },
] as const;

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function resolveImageUrl(product: Pick<ProductSummary, 'imageUrl' | 'images'>): string {
  return product.imageUrl ?? product.images?.[0] ?? '/placeholder-product.jpg';
}

function calcDiscountPct(price: number, discountedPrice?: number): number | null {
  if (!discountedPrice || discountedPrice >= price) return null;
  return Math.round(((price - discountedPrice) / price) * 100);
}

function buildEmptyDashboard(name: string, email: string): CustomerDashboardData {
  return {
    accountInfo: {
      customerName: name,
      email,
      memberSince: new Date().toISOString(),
      totalOrders: 0,
    },
    trendingProducts: [],
    featuredProducts: [],
    activeOrder: null,
    cartInfo: { itemCount: 0, totalValue: 0 },
    wishlistInfo: { itemCount: 0, recentlyAdded: [] },
  };
}

// #region ─── Sub-Components ──────────────────────────────────────────────────

function DashboardHero({ user }: { user?: { name?: string | null } }) {
  const firstName = user?.name?.split(' ')[0] || 'there';
  const greeting = getTimeGreeting();

  return (
    <div className="hero-banner relative overflow-hidden rounded-2xl p-8 text-white shadow-2xl">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="noise-overlay" />

      <div className="relative z-10">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="hero-pill">
                <Sparkles className="h-3 w-3" />
                Personalized for you
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              {greeting}, {firstName}! 👋
            </h1>
            <p className="mt-1.5 text-blue-100/90">
              Discover deals crafted just for you today.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button className="hero-icon-btn">
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-blue-200" />
            <Input
              placeholder="Search products, brands, categories…"
              className="hero-search-input h-12 pl-12"
            />
          </div>
          <Button className="hero-search-btn h-12 px-6 font-bold">
            Search
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-blue-200">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-300" />
            Delivering to <span className="font-semibold text-white underline decoration-dashed decoration-blue-300">San Francisco, CA</span>
          </span>
          <span className="hidden sm:inline text-blue-300">•</span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0 text-blue-300" />
            E-Shop Promise: <span className="font-semibold text-white">Next Day Delivery</span>
          </span>
          <span className="hidden sm:inline text-blue-300">•</span>
          <span className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 shrink-0 text-blue-300" />
            <span className="font-semibold text-white">100% Secure Checkout</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function StatsRow({ data, loading }: { data: CustomerDashboardData | null; loading: boolean }) {
  const stats = [
    {
      label: 'Total Orders',
      value: data?.accountInfo?.totalOrders ?? 0,
      icon: Package,
      color: 'stat-blue',
      sub: 'lifetime',
    },
    {
      label: 'Cart Items',
      value: data?.cartInfo?.itemCount ?? 0,
      icon: ShoppingCart,
      color: 'stat-purple',
      sub: formatCurrency(data?.cartInfo?.totalValue ?? 0),
    },
    {
      label: 'Wishlist',
      value: data?.wishlistInfo?.itemCount ?? 0,
      icon: Heart,
      color: 'stat-rose',
      sub: 'saved items',
    },
    {
      label: 'Reward Points',
      value: data?.rewardPoints ?? 0,
      icon: Award,
      color: 'stat-amber',
      sub: 'redeemable',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className={`stat-card ${s.color}`}>
          <div className="stat-icon-wrap">
            <s.icon className="h-5 w-5" />
          </div>
          {loading ? (
            <>
              <Skeleton className="mt-3 h-7 w-12" />
              <Skeleton className="mt-1 h-3 w-16" />
            </>
          ) : (
            <>
              <p className="stat-value">{s.value.toLocaleString()}</p>
              <p className="stat-label">{s.label}</p>
              <p className="stat-sub">{s.sub}</p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function ActiveOrderBanner({ order }: { order: ActiveOrderSnapshot | null }) {
  if (!order) return null;
  const currentStep = ORDER_STATUS_STEPS[order.status?.toUpperCase()] ?? 0;

  return (
    <div className="active-order-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="order-truck-icon">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">
              Active Order
            </p>
            <h3 className="text-base font-bold">
              Order #{order.orderNumber} is on its way!
            </h3>
            <p className="text-sm text-muted-foreground">
              Est. delivery: <strong>{order.estimatedDelivery || 'Soon'}</strong>
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="shrink-0 bg-emerald-500 text-white hover:bg-emerald-600"
        >
          Track Order
        </Button>
      </div>

      <div className="mt-5">
        <div className="relative flex items-center justify-between">
          <div className="progress-track" />
          <div
            className="progress-fill"
            style={{ width: `${(currentStep / (ORDER_STEP_LABELS.length - 1)) * 100}%` }}
          />
          {ORDER_STEP_LABELS.map((step, idx) => (
            <div key={step} className="progress-step-wrap">
              <div className={`progress-dot ${idx <= currentStep ? 'active' : ''}`} />
              <span className={`progress-step-label ${idx === currentStep ? 'active-label' : ''}`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoryChips() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="section-title">
          <Tag className="h-4 w-4 text-blue-500" />
          Shop by Category
        </h2>
        <Button variant="ghost" size="sm" className="section-link">
          All Categories <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
      <div
        className="!scrollbar-none flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {FEATURED_CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            className="category-chip shrink-0"
            style={{ '--chip-color': cat.color } as React.CSSProperties}
          >
            <span className="category-chip-emoji">{cat.icon}</span>
            <span className="category-chip-name">{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: ProductSummary }) {
  const imageUrl = resolveImageUrl(product);
  const discount = calcDiscountPct(product.price, product.discountedPrice);

  return (
    <div className="product-card group shrink-0">
      {discount && (
        <span className="product-badge">-{discount}%</span>
      )}
      <button className="product-wishlist-btn">
        <Heart className="h-3.5 w-3.5" />
      </button>

      <div className="product-image-wrap">
        <img
          src={imageUrl}
          alt={product.name}
          className="product-image"
        />
        <div className="product-overlay">
          <Button className="product-cart-btn" size="sm">
            <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
            Add to Cart
          </Button>
        </div>
      </div>

      <div className="product-info">
        <p className="product-brand">{product.brand || product.categoryName || 'eShop'}</p>
        <h3 className="product-name">{product.name}</h3>
        {product.rating && (
          <div className="product-rating">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>{product.rating.toFixed(1)}</span>
            {product.reviewCount && (
              <span className="text-muted-foreground">({product.reviewCount})</span>
            )}
          </div>
        )}
        <div className="product-price-row">
          <span className="product-price">{formatCurrency(product.discountedPrice || product.price)}</span>
          {discount && (
            <span className="product-original-price">{formatCurrency(product.price)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductFeed({
  title,
  icon: Icon,
  products,
  loading,
  accent,
}: {
  title: string;
  icon?: LucideIcon;
  products: ProductSummary[];
  loading: boolean;
  accent?: string;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-7 w-20" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-72 w-48 shrink-0 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">
          {Icon && <Icon className="h-5 w-5" style={{ color: accent || '#3b82f6' }} />}
          {title}
        </h2>
        <Button variant="ghost" size="sm" className="section-link">
          View All <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <div
        className="!scrollbar-none flex gap-4 overflow-x-auto scroll-smooth pb-4 pt-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

function PromoBanners() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {PROMO_BANNERS.map((p) => (
        <div
          key={p.label}
          className={`promo-card bg-gradient-to-br ${p.gradient}`}
        >
          <div className="promo-inner">
            <span className="promo-tag">{p.tag}</span>
            <p className="promo-label">{p.label}</p>
            <h3 className="promo-title" style={{ whiteSpace: 'pre-line' }}>{p.title}</h3>
            <Button className="promo-btn mt-auto">
              {p.cta} <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
          <div className="promo-icon-wrap">
            <p.icon className="h-24 w-24 opacity-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityWidget({ data, loading }: { data: CustomerDashboardData | null; loading: boolean }) {
  return (
    <Card className="widget-card overflow-hidden">
      <div className="widget-header-bar" />
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-500" />
          Your Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 pb-4">
        {[
          { label: 'Orders', value: data?.accountInfo?.totalOrders ?? 0, color: 'var(--blue-500, #3b82f6)', sub: 'All time' },
          { label: 'In Cart', value: data?.cartInfo?.itemCount ?? 0, color: 'var(--purple-500, #a855f7)', sub: formatCurrency(data?.cartInfo?.totalValue ?? 0) },
          { label: 'Wishlist', value: data?.wishlistInfo?.itemCount ?? 0, color: 'var(--rose-500, #f43f5e)', sub: 'Saved' },
          { label: 'Points', value: data?.rewardPoints ?? 0, color: 'var(--amber-500, #f59e0b)', sub: 'Reward pts' },
        ].map((item) => (
          <div key={item.label} className="widget-mini-stat">
            {loading ? (
              <>
                <Skeleton className="h-6 w-10" />
                <Skeleton className="mt-1 h-3 w-12" />
              </>
            ) : (
              <>
                <p className="widget-stat-val" style={{ color: item.color }}>
                  {item.value.toLocaleString()}
                </p>
                <p className="widget-stat-label">{item.label}</p>
                <p className="widget-stat-sub">{item.sub}</p>
              </>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CartWidget({ data, loading }: { data: CustomerDashboardData | null; loading: boolean }) {
  const router = useRouter();
  return (
    <Card className="widget-card overflow-hidden">
      <div className="widget-header-bar" style={{ background: 'linear-gradient(90deg, #a855f7, #6366f1)' }} />
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-purple-500" />
          Cart
        </CardTitle>
        <Button variant="link" size="sm" className="h-auto p-0 text-xs text-purple-500 hover:text-purple-700">
          View Cart <ChevronRight className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="pb-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : data?.cartInfo?.itemCount ? (
          <div className="space-y-3">
            <div className="cart-summary-row">
              <span className="text-sm text-muted-foreground">Items</span>
              <Badge variant="secondary">{data.cartInfo.itemCount}</Badge>
            </div>
            <div className="cart-summary-row">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-sm font-semibold">{formatCurrency(data.cartInfo.totalValue)}</span>
            </div>
            <Button className="w-full bg-purple-600 text-white hover:bg-purple-700 mt-2">
              Checkout Now →
            </Button>
          </div>
        ) : (
          <div className="empty-widget-state">
            <ShoppingCart className="h-10 w-10 opacity-30" />
            <p className="text-sm text-muted-foreground mt-2">Cart is empty</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => router.push(APP_ROUTES.PRODUCTS)}
            >
              Start Shopping
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WishlistWidget({ data, loading }: { data: CustomerDashboardData | null; loading: boolean }) {
  const router = useRouter();
  return (
    <Card className="widget-card overflow-hidden">
      <div className="widget-header-bar" style={{ background: 'linear-gradient(90deg, #f43f5e, #fb923c)' }} />
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Heart className="h-4 w-4 text-rose-500" />
          Wishlist
        </CardTitle>
        <Button variant="link" size="sm" className="h-auto p-0 text-xs text-rose-500 hover:text-rose-700">
          View All <ChevronRight className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="pb-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-2">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.wishlistInfo?.recentlyAdded?.length ? (
          <ul className="space-y-3">
            {data.wishlistInfo.recentlyAdded.slice(0, 3).map((item) => (
              <li
                key={item.id}
                className="wishlist-item"
              >
                <div className="wishlist-item-img">
                  <img
                    src={item.imageUrl || item.images?.[0] || '/placeholder.jpg'}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{item.name}</p>
                  <p className="text-xs font-semibold text-rose-500">{formatCurrency(item.price)}</p>
                </div>
                <button className="wishlist-cart-btn">
                  <ShoppingCart className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-widget-state">
            <Heart className="h-10 w-10 opacity-30" />
            <p className="text-sm text-muted-foreground mt-2">No saved items</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => router.push(APP_ROUTES.PRODUCTS)}
            >
              Explore Deals
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SellerCTAWidget({ session, router }: { session: ExtendedSession | null; router: AppRouterInstance }) {
  if (session?.roles?.includes('SELLER')) return null;
  return (
    <div className="seller-cta-card">
      <div className="seller-cta-bg" />
      <div className="relative z-10 p-5">
        <div className="seller-cta-icon">
          <Store className="h-5 w-5 text-white" />
        </div>
        <h3 className="mt-3 font-bold text-white">Sell on E-Shop</h3>
        <p className="mt-1 text-xs leading-relaxed text-indigo-200">
          Reach millions of customers. 0% commission for the first month.
        </p>
        <Button
          onClick={() => router.push(APP_ROUTES.BECOME_SELLER)}
          className="mt-4 w-full bg-white font-semibold text-indigo-700 hover:bg-indigo-50"
          size="sm"
        >
          Get Started →
        </Button>
      </div>
    </div>
  );
}

function DeliveryAgentCTAWidget({ session, router }: { session: ExtendedSession | null; router: AppRouterInstance }) {
  if (session?.roles?.includes('DELIVERY_AGENT')) return null;
  return (
    <div className="delivery-cta-card">
      <div className="relative z-10 p-5">
        <div className="delivery-cta-icon">
          <Truck className="h-5 w-5 text-white" />
        </div>
        <h3 className="mt-3 font-bold text-white">Deliver with Us</h3>
        <p className="mt-1 text-xs leading-relaxed text-emerald-100">
          Flexible hours, great pay. Turn your vehicle into income.
        </p>
        <Button
          onClick={() => router.push(APP_ROUTES.BECOME_DELIVERY_AGENT)}
          className="mt-4 w-full bg-white font-semibold text-emerald-700 hover:bg-emerald-50"
          size="sm"
        >
          Join as Partner →
        </Button>
      </div>
    </div>
  );
}

function SupportWidget() {
  return (
    <Card className="widget-card overflow-hidden">
      <div className="widget-header-bar" style={{ background: 'linear-gradient(90deg, #1e293b, #334155)' }} />
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <HeadphonesIcon className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-bold">24/7 Support</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Our team is always here to help you.</p>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs"
          >
            💬 Live Chat
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs"
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            Returns & Refunds
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs"
          >
            <Package className="mr-2 h-3 w-3" />
            Track a Package
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============ Inline Styles ============
const DASHBOARD_STYLES = `
/* ===== HERO ===== */
.hero-banner {
  background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 35%, #4f46e5 70%, #7c3aed 100%);
  min-height: 220px;
}
.blob {
  position: absolute;
  border-radius: 9999px;
  filter: blur(60px);
  opacity: 0.35;
  animation: blobFloat 8s ease-in-out infinite;
}
.blob-1 {
  width: 380px; height: 380px;
  top: -120px; right: -80px;
  background: radial-gradient(circle, #818cf8, #4f46e5);
  animation-delay: 0s;
}
.blob-2 {
  width: 300px; height: 300px;
  bottom: -120px; left: -60px;
  background: radial-gradient(circle, #60a5fa, #3b82f6);
  animation-delay: -3s;
}
.blob-3 {
  width: 200px; height: 200px;
  top: 50%; left: 40%;
  background: radial-gradient(circle, #a78bfa, #7c3aed);
  animation-delay: -6s;
}
@keyframes blobFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(20px, -20px) scale(1.05); }
  66% { transform: translate(-15px, 15px) scale(0.95); }
}
.noise-overlay {
  position: absolute; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
}

.hero-pill {
  display: inline-flex; align-items: center; gap: 4px;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.2);
  padding: 3px 10px; border-radius: 999px;
  font-size: 11px; font-weight: 600;
  color: #e0e7ff; letter-spacing: 0.02em;
}
.hero-icon-btn {
  display: flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border-radius: 50%;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.2);
  color: white; cursor: pointer;
  transition: background 0.2s;
}
.hero-icon-btn:hover { background: rgba(255,255,255,0.25); }

.hero-search-input {
  background: rgba(255,255,255,0.12) !important;
  border: 1px solid rgba(255,255,255,0.25) !important;
  color: white !important;
  backdrop-filter: blur(8px);
  transition: all 0.25s;
}
.hero-search-input::placeholder { color: rgba(224,231,255,0.7) !important; }
.hero-search-input:focus {
  background: rgba(255,255,255,0.22) !important;
  border-color: rgba(255,255,255,0.5) !important;
  box-shadow: 0 0 0 3px rgba(165,180,252,0.3) !important;
}
.hero-search-btn {
  background: white !important;
  color: #4f46e5 !important;
  font-weight: 700;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(0,0,0,0.2);
}
.hero-search-btn:hover {
  background: #e0e7ff !important;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.25);
}

/* ===== STAT CARDS ===== */
.stat-card {
  border-radius: 16px;
  padding: 16px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
.stat-blue  { background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 1px solid #bfdbfe; }
.stat-purple{ background: linear-gradient(135deg, #faf5ff, #ede9fe); border: 1px solid #ddd6fe; }
.stat-rose  { background: linear-gradient(135deg, #fff1f2, #ffe4e6); border: 1px solid #fecdd3; }
.stat-amber { background: linear-gradient(135deg, #fffbeb, #fef3c7); border: 1px solid #fde68a; }
.dark .stat-blue   { background: linear-gradient(135deg, #1e3a5f, #1e3a8a); border-color: #1d4ed880; }
.dark .stat-purple { background: linear-gradient(135deg, #2e1065, #3b0764); border-color: #7c3aed40; }
.dark .stat-rose   { background: linear-gradient(135deg, #4c0519, #881337); border-color: #f43f5e30; }
.dark .stat-amber  { background: linear-gradient(135deg, #451a03, #78350f); border-color: #f59e0b30; }
.stat-icon-wrap {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 10px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(4px);
}
.dark .stat-icon-wrap { background: rgba(255,255,255,0.1); }
.stat-blue .stat-icon-wrap  { color: #3b82f6; }
.stat-purple .stat-icon-wrap{ color: #a855f7; }
.stat-rose .stat-icon-wrap  { color: #f43f5e; }
.stat-amber .stat-icon-wrap { color: #f59e0b; }
.stat-value {
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1;
  margin-top: 10px;
  letter-spacing: -0.02em;
}
.stat-blue .stat-value   { color: #1d4ed8; }
.stat-purple .stat-value { color: #7c3aed; }
.stat-rose .stat-value   { color: #e11d48; }
.stat-amber .stat-value  { color: #d97706; }
.stat-label {
  font-size: 11px;
  font-weight: 600;
  margin-top: 4px;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.stat-sub {
  font-size: 10px;
  opacity: 0.5;
  margin-top: 1px;
}

/* ===== ACTIVE ORDER ===== */
.active-order-card {
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  border: 1px solid #6ee7b7;
  border-radius: 16px;
  padding: 20px 20px 24px;
  box-shadow: 0 4px 20px rgba(16,185,129,0.12);
}
.dark .active-order-card {
  background: linear-gradient(135deg, #022c22, #064e3b);
  border-color: #065f4640;
}
.order-truck-icon {
  display: flex; align-items: center; justify-content: center;
  width: 48px; height: 48px; border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 4px 12px rgba(16,185,129,0.4);
  animation: truckPulse 2.5s ease-in-out infinite;
}
@keyframes truckPulse {
  0%, 100% { box-shadow: 0 4px 12px rgba(16,185,129,0.4); }
  50% { box-shadow: 0 4px 24px rgba(16,185,129,0.7); }
}
.progress-track {
  position: absolute; top: 6px; left: 6px; right: 6px; height: 2px;
  background: #d1fae5; z-index: 0;
}
.progress-fill {
  position: absolute; top: 6px; left: 6px; height: 2px;
  background: linear-gradient(90deg, #10b981, #059669);
  transition: width 0.8s ease; z-index: 1;
}
.progress-step-wrap {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  position: relative; z-index: 2;
}
.progress-dot {
  width: 14px; height: 14px; border-radius: 50%;
  background: #d1fae5; border: 2px solid #10b981;
  transition: all 0.3s;
}
.progress-dot.active { background: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.25); }
.progress-step-label {
  font-size: 9px; font-weight: 500;
  color: #064e3b; opacity: 0.6;
  white-space: nowrap;
}
.dark .progress-step-label { color: #a7f3d0; }
.progress-step-label.active-label { font-weight: 700; opacity: 1; color: #10b981 !important; }

/* ===== CATEGORY CHIPS ===== */
.category-chip {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 10px 18px; border-radius: 14px;
  background: var(--background, white);
  border: 1.5px solid rgba(0,0,0,0.08);
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.category-chip:hover {
  border-color: var(--chip-color);
  background: color-mix(in srgb, var(--chip-color) 10%, transparent);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.1);
}
.dark .category-chip { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); }
.category-chip-emoji { font-size: 22px; line-height: 1; }
.category-chip-name { font-size: 11px; font-weight: 600; white-space: nowrap; }

/* ===== PRODUCT CARDS ===== */
.product-card {
  width: 188px;
  border-radius: 16px;
  background: white;
  border: 1px solid rgba(0,0,0,0.06);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  position: relative;
}
.dark .product-card { background: #1e293b; border-color: rgba(255,255,255,0.08); }
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0,0,0,0.14);
  border-color: rgba(99,102,241,0.3);
}
.product-badge {
  position: absolute; top: 10px; right: 10px; z-index: 10;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white; font-size: 11px; font-weight: 700;
  padding: 2px 8px; border-radius: 999px;
  box-shadow: 0 2px 8px rgba(239,68,68,0.4);
}
.product-wishlist-btn {
  position: absolute; top: 10px; left: 10px; z-index: 10;
  width: 28px; height: 28px; border-radius: 50%;
  background: rgba(255,255,255,0.85); backdrop-filter: blur(4px);
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #f43f5e; transition: all 0.2s;
  opacity: 0;
}
.product-card:hover .product-wishlist-btn { opacity: 1; }
.product-wishlist-btn:hover { background: #fff; transform: scale(1.1); }
.product-image-wrap {
  aspect-ratio: 1/1; overflow: hidden;
  background: #f8fafc;
  position: relative;
}
.dark .product-image-wrap { background: #0f172a; }
.product-image {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform 0.4s ease;
}
.product-card:hover .product-image { transform: scale(1.06); }
.product-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%);
  display: flex; align-items: flex-end; padding: 12px;
  opacity: 0; transition: opacity 0.25s;
}
.product-card:hover .product-overlay { opacity: 1; }
.product-cart-btn {
  width: 100%;
  background: white !important;
  color: #1e293b !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  border-radius: 8px !important;
  height: 32px !important;
}
.product-cart-btn:hover {
  background: #6366f1 !important;
  color: white !important;
}
.product-info { padding: 12px; }
.product-brand {
  font-size: 10px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.06em;
  color: #6366f1; margin-bottom: 3px;
}
.product-name {
  font-size: 13px; font-weight: 600; line-height: 1.35;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden; height: 36px;
  margin-bottom: 6px;
}
.product-rating {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 500;
  color: #78716c; margin-bottom: 6px;
}
.product-price-row { display: flex; align-items: baseline; gap: 6px; }
.product-price { font-size: 16px; font-weight: 800; color: #0f172a; }
.dark .product-price { color: #f8fafc; }
.product-original-price {
  font-size: 11px; font-weight: 400;
  color: #94a3b8; text-decoration: line-through;
}

/* ===== SECTION TITLES ===== */
.section-title {
  font-size: 1.1rem; font-weight: 800;
  display: flex; align-items: center; gap: 8px;
  letter-spacing: -0.01em;
}
.section-link {
  font-size: 12px; font-weight: 600;
  color: #6366f1;
}
.section-link:hover { color: #4f46e5; }

/* ===== PROMO BANNERS ===== */
.promo-card {
  border-radius: 16px;
  overflow: hidden;
  min-height: 160px;
  display: flex;
  position: relative;
  cursor: pointer;
  transition: transform 0.25s, box-shadow 0.25s;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
.promo-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.2);
}
.promo-inner {
  position: relative; z-index: 2;
  padding: 20px 22px;
  display: flex; flex-direction: column;
  gap: 4px; flex: 1;
}
.promo-tag {
  display: inline-block;
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.3);
  font-size: 10px; font-weight: 700;
  padding: 2px 8px; border-radius: 999px;
  color: white; letter-spacing: 0.05em;
  width: fit-content;
}
.promo-label {
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: rgba(255,255,255,0.7); margin-top: 6px;
}
.promo-title {
  font-size: 1.3rem; font-weight: 900;
  color: white; line-height: 1.2;
}
.promo-btn {
  background: rgba(255,255,255,0.2) !important;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.3) !important;
  color: white !important;
  font-weight: 700 !important;
  font-size: 13px !important;
  width: fit-content;
  height: 34px !important;
  border-radius: 8px !important;
  transition: all 0.2s !important;
}
.promo-btn:hover { background: rgba(255,255,255,0.35) !important; }
.promo-icon-wrap {
  position: absolute; right: -20px; top: -20px;
  display: flex; align-items: center; justify-content: center;
  color: white;
}

/* ===== WIDGET CARDS ===== */
.widget-card {
  border: 1px solid rgba(0,0,0,0.06) !important;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
  border-radius: 16px !important;
  transition: box-shadow 0.2s;
}
.widget-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.1) !important; }
.dark .widget-card { border-color: rgba(255,255,255,0.06) !important; }
.widget-header-bar {
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #6366f1);
}
.widget-mini-stat {
  background: rgba(0,0,0,0.03);
  border-radius: 12px; padding: 10px;
  text-align: center;
}
.dark .widget-mini-stat { background: rgba(255,255,255,0.04); }
.widget-stat-val { font-size: 1.4rem; font-weight: 800; line-height: 1; }
.widget-stat-label { font-size: 10px; font-weight: 600; opacity: 0.6; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.05em; }
.widget-stat-sub { font-size: 9px; opacity: 0.45; margin-top: 1px; }

.cart-summary-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 0; border-bottom: 1px dashed rgba(0,0,0,0.07);
}
.dark .cart-summary-row { border-color: rgba(255,255,255,0.07); }

.wishlist-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px; border-radius: 10px; cursor: pointer;
  transition: background 0.15s;
}
.wishlist-item:hover { background: rgba(0,0,0,0.04); }
.dark .wishlist-item:hover { background: rgba(255,255,255,0.04); }
.wishlist-item-img {
  width: 44px; height: 44px; border-radius: 8px; overflow: hidden;
  background: #f1f5f9; flex-shrink: 0;
}
.wishlist-cart-btn {
  width: 28px; height: 28px; border-radius: 8px;
  background: rgba(99,102,241,0.1); border: none;
  display: flex; align-items: center; justify-content: center;
  color: #6366f1; cursor: pointer;
  flex-shrink: 0; transition: all 0.15s;
}
.wishlist-cart-btn:hover { background: #6366f1; color: white; }

.empty-widget-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 16px 0; text-align: center;
}

/* ===== CTA WIDGETS ===== */
.seller-cta-card {
  border-radius: 16px; overflow: hidden;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%);
  position: relative;
  box-shadow: 0 8px 24px rgba(99,102,241,0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}
.seller-cta-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(99,102,241,0.45);
}
.seller-cta-bg {
  position: absolute; inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
.seller-cta-icon {
  width: 40px; height: 40px; border-radius: 12px;
  background: rgba(255,255,255,0.2); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.delivery-cta-card {
  border-radius: 16px; overflow: hidden;
  background: linear-gradient(135deg, #059669, #10b981, #0d9488);
  box-shadow: 0 8px 24px rgba(16,185,129,0.25);
  transition: transform 0.2s, box-shadow 0.2s;
}
.delivery-cta-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(16,185,129,0.4);
}
.delivery-cta-icon {
  width: 40px; height: 40px; border-radius: 12px;
  background: rgba(255,255,255,0.2); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
`;

// ============ Main Page Component ============
export function CustomerDashboard() {
  const { data: session, status } = useSession() as {
    data: ExtendedSession | null;
    status: string;
  };
  const router = useRouter();

  const [data, setData] = useState<CustomerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      // apiClient handles token injection automatically if configured, 
      // but we can also pass it in headers if needed. 
      // However, our hardened apiClient is designed to work with the session.
      const resp = await apiClient.get<any>(API_ENDPOINTS.DASHBOARD.CUSTOMER);
      const dashboardData = (resp.data?.data ?? resp.data) as CustomerDashboardData;
      setData(dashboardData);
    } catch (err: unknown) {
      const isForbidden = err instanceof AppError && err.isForbidden();
      if (isForbidden) {
        console.warn('[Dashboard] 403 – showing empty dashboard for new user.');
        setData(buildEmptyDashboard(
          session?.user?.name || 'Customer',
          session?.user?.email || '',
        ));
      } else {
        // AppError typically has enough info, but we can log it
        console.error('[Dashboard] Fetch failed', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      fetchData(session.accessToken);
    }
  }, [status, session, fetchData]);

  if (status === 'loading') return null;
  if (status === 'unauthenticated')
    return (
      <div className="flex min-h-screen items-center justify-center text-red-500">
        Please sign in to view your dashboard.
      </div>
    );

  const user = session?.user;

  return (
    <>
      {/* Scoped styles */}
      <style dangerouslySetInnerHTML={{ __html: DASHBOARD_STYLES }} />

      <div className="min-h-screen bg-gray-50/60 dark:bg-[#0a0f1e]">
        <div className="container mx-auto grid grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-[1fr_300px] lg:gap-8">

          {/* ── Main Column ── */}
          <main className="min-w-0 space-y-8">
            <DashboardHero user={user} />
            <StatsRow data={data} loading={loading} />
            <ActiveOrderBanner order={data?.activeOrder || null} />
            <CategoryChips />
            <PromoBanners />
            <ProductFeed
              title="Trending Now"
              icon={Zap}
              accent="#f59e0b"
              products={data?.trendingProducts || []}
              loading={loading}
            />
            <ProductFeed
              title="Recommended for You"
              icon={Star}
              accent="#6366f1"
              products={data?.featuredProducts || []}
              loading={loading}
            />
          </main>

          {/* ── Sidebar Column ── */}
          <aside className="space-y-4">
            <ActivityWidget data={data} loading={loading} />
            <CartWidget data={data} loading={loading} />
            <WishlistWidget data={data} loading={loading} />
            <SellerCTAWidget session={session} router={router} />
            <DeliveryAgentCTAWidget session={session} router={router} />
            <SupportWidget />
          </aside>
        </div>
      </div>
    </>
  );
}
