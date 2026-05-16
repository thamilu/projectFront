// Core Types matching backend entities

// Core Keycloak roles - only these 4 roles in authentication
export enum UserRole {
  SELLER = 'SELLER',
  CUSTOMER = 'CUSTOMER',
  DELIVERY_AGENT = 'DELIVERY_AGENT',
}

// Identity types for compliance & KYC
export enum SellerIdentityType {
  INDIVIDUAL = 'INDIVIDUAL',
  BUSINESS = 'BUSINESS',
}

// Business types for commercial behavior
export enum SellerBusinessType {
  FARMER = 'FARMER',
  WHOLESALER = 'WHOLESALER',
  RETAILER = 'RETAILER',
}

export const SELLER_BUSINESS_TYPE_LABELS: Record<SellerBusinessType, string> = {
  [SellerBusinessType.FARMER]: 'Farmer / Producer',
  [SellerBusinessType.WHOLESALER]: 'Wholesaler',
  [SellerBusinessType.RETAILER]: 'Retailer',
};

export enum OrderStatus {
  PLACED = 'PLACED',
  CONFIRMED = 'CONFIRMED',
  PACKED = 'PACKED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

// DTOs matching backend

export interface UserDTO {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  address?: string;
  active: boolean;
  emailVerified?: boolean;
  image?: string | null;
  createdAt: string;
  updatedAt?: string;
  // Seller-specific fields
  shopName?: string;
  businessName?: string;
  panNumber?: string;
  gstinNumber?: string;
  businessType?: string;
  // Refactored seller types
  sellerIdentityType?: SellerIdentityType;
  sellerBusinessTypes?: SellerBusinessType[]; // List of business types
  isOwnProduce?: boolean; // For FARMER business type
  // Delivery agent fields
  vehicleType?: string;
}

// Export User type for React Query hooks
export type User = UserDTO;

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone: string;
  address?: string;
  // Seller-specific fields
  shopName?: string;
  businessName?: string;
  panNumber?: string;
  gstinNumber?: string;
  businessType?: string;
  // Seller types (Refactored)
  sellerIdentityType?: SellerIdentityType;
  sellerBusinessTypes?: SellerBusinessType[];
  isOwnProduce?: boolean;
  // Delivery agent fields
  vehicleType?: string;
}

export interface AuthResponse {
  token?: string;
  user?: UserDTO | null;
  type?: string;
  expiresIn?: number;
}

export interface ProductDTO {
  id: number;
  name: string;
  description: string;
  sku: string;
  price: number;
  discountPrice?: number;
  stockQuantity: number;
  imageUrl?: string;
  active: boolean;
  featured: boolean;
  category: CategoryDTO;
  brand?: BrandDTO;
  shop: ShopDTO;
  tags?: TagDTO[];
  createdAt: string;
  updatedAt?: string;
}

export interface CategoryDTO {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  active: boolean;
  parentCategory?: CategoryDTO;
  children?: CategoryDTO[];
  createdAt: string;
}

export interface BrandDTO {
  id: number;
  name: string;
  description?: string;
  logoUrl?: string;
  active: boolean;
  createdAt: string;
}

export interface TagDTO {
  id: number;
  name: string;
  createdAt: string;
}

// ShopDTO - Customer-facing shop entity (for browsing marketplace)
export interface ShopDTO {
  id: number;
  shopName: string;
  description: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
  active: boolean;
  seller?: UserDTO;
  createdAt: string;
}

// StoreDTO - Seller management store entity (for seller's own storefront management)
// Same structure as ShopDTO but semantically different in the seller context
export interface StoreDTO {
  id: number;
  storeName: string;
  description: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  taluk?: string;
  district?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  domain?: string;
  rating?: number;
  active: boolean;
  seller: UserDTO;
  sellerId?: number;
  sellerUsername?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CartDTO {
  id: number;
  user: UserDTO;
  items: CartItemDTO[];
  totalAmount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CartItemDTO {
  id: number;
  product: ProductDTO;
  quantity: number;
  price: number;
  subtotal: number;
  createdAt: string;
}

export interface OrderDTO {
  id: number;
  orderNumber: string;
  customer: UserDTO;
  items: OrderItemDTO[];
  totalAmount: number;
  shippingAmount?: number;
  taxAmount?: number;
  discountAmount?: number;
  shippingAddress: string;
  billingAddress?: string;
  phone?: string;
  notes?: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryAgent?: UserDTO;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderItemDTO {
  id: number;
  product: ProductDTO;
  quantity: number;
  price: number;
  discountAmount?: number;
  subtotal: number;
  createdAt: string;
}

export interface CreateOrderRequest {
  shippingAddress: string;
  billingAddress?: string;
  phone?: string;
  notes?: string;
}

export interface UpdateOrderStatusRequest {
  orderStatus: OrderStatus;
}

export interface UpdatePaymentStatusRequest {
  paymentStatus: PaymentStatus;
}

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

// Filter types

export interface ProductFilters {
  categoryId?: number;
  brandId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  search?: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
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
