/**
 * Application Configuration
 * Central configuration for the e-commerce frontend application
 */

export const appConfig = {
  // Application Info
  app: {
    name: 'Enterprise E-Commerce',
    description: 'Modern e-commerce platform with Next.js',
    version: '1.0.0',
  },

  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082',
    timeout: 30000,
    retryAttempts: 3,
  },

  // Authentication
  auth: {
    tokenKey: 'auth_token',
    refreshTokenKey: 'refresh_token',
    tokenExpiryKey: 'token_expiry',
    sessionTimeout: 3600000, // 1 hour in milliseconds
  },

  // Pagination
  pagination: {
    defaultPageSize: 20,
    pageSizes: [10, 20, 50, 100],
  },

  // File Upload
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedDocumentTypes: ['application/pdf', 'application/msword'],
  },

  // Feature Flags
  features: {
    enableWishlist: true,
    enableReviews: true,
    enableChat: false,
    enableNotifications: true,
    enableAnalytics: true,
  },

  // UI Configuration
  ui: {
    theme: {
      defaultMode: 'light' as 'light' | 'dark',
    },
    toast: {
      duration: 3000,
      position: 'bottom-right' as const,
    },
  },
} as const;

export type AppConfig = typeof appConfig;
