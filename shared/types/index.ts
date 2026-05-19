import { ProductDTO } from '@/domains/catalog/contracts/catalog.types';

export type { ProductDTO, CategoryDTO, BrandDTO, TagDTO, ProductFilters, BackendProductRequest } from '@/domains/catalog/contracts/catalog.types';
export type { StoreDTO, ShopDTO } from '@/domains/seller/contracts/seller.types';

// Pagination

export interface PageRequest {
  page: number;
  size: number;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// Backwards-compatible alias used across the frontend
export type PaginatedResponse<T> = PageResponse<T>;

// Generic API wrapper used by api-client helpers
export interface ApiResponse<T> {
  data?: T;
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

// API Response

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// Enhanced E-commerce Frontend Types

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  priceAlerts: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  language: string;
  notifications: NotificationSettings;
}

export interface WishlistItem {
  id: string;
  productId: string;
  product: ProductDTO;
  addedAt: Date;
  priceAtAdd: number;
  notes?: string;
}

export interface Wishlist {
  id: string;
  name: string;
  description?: string;
  items: WishlistItem[];
  isDefault: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export type NotificationType =
  | 'order'
  | 'promotion'
  | 'price_drop'
  | 'restock'
  | 'security'
  | 'system';

// Analytics types
export interface SpendingData {
  date: string;
  amount: number;
  category: string;
}

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface MonthlyTrend {
  month: string;
  spending: number;
  orders: number;
}

export interface RecommendationItem {
  id: string;
  product: ProductDTO;
  reason: string;
  confidence: number;
  category: string;
}

export interface AnalyticsData {
  totalSpent: number;
  totalOrders: number;
  avgOrderValue: number;
  favoriteCategory: string;
  monthlySpending: SpendingData[];
  categoryBreakdown: CategorySpending[];
  monthlyTrends: MonthlyTrend[];
  recommendations: RecommendationItem[];
  budgetGoal?: number;
  budgetProgress: number;
}

// Store state types
export interface WishlistState {
  wishlists: Wishlist[];
  activeWishlistId: string | null;
  isLoading: boolean;
  createWishlist: (name: string, description?: string) => void;
  deleteWishlist: (id: string) => void;
  addToWishlist: (productId: string, wishlistId?: string, notes?: string) => void;
  removeFromWishlist: (itemId: string, wishlistId: string) => void;
  moveToCart: (itemId: string, wishlistId: string) => void;
  shareWishlist: (wishlistId: string) => string;
  getActiveWishlist: () => Wishlist | null;
  getWishlistById: (id: string) => Wishlist | null;
  getPriceDropItems: () => WishlistItem[];
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
}

export interface AnalyticsState {
  data: AnalyticsData;
  isLoading: boolean;
  addOrder: (amount: number, category: string) => void;
  setBudgetGoal: (amount: number) => void;
  getSpendingByCategory: () => CategorySpending[];
  getMonthlyTrends: () => MonthlyTrend[];
}

// PWA types
export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  outcome: 'accepted' | 'dismissed';
}

export interface ServiceWorkerState {
  isOnline: boolean;
  isInstalled: boolean;
  hasUpdate: boolean;
  installPrompt: PWAInstallPrompt | null;
}
