# PWA Governance & Caching Strategy

## 1. Overview

The E-Shop Storefront uses `next-pwa` for progressive web app capabilities. To ensure consistency and data integrity, the following rules must be followed.

## 2. Caching Policies

### NEVER Cache:

- **Authentication Responses**: `/api/auth/**` or any session-related data.
- **Payment Responses**: `/api/v1/checkout/**` or Stripe-related payloads.
- **Inventory Mutations**: Any `POST`, `PUT`, or `DELETE` requests to product inventory.
- **Personal Data**: User profile details that are sensitive (PII).

### ALWAYS Cache:

- **Static Assets**: Images, fonts, and core CSS/JS bundles.
- **Product Catalog (Read-only)**: `/api/v1/catalog/products/**` (with short TTL).
- **Home Page Data**: Initial hero sections and promotional banners.

## 3. Offline Strategy

- **Fallback Page**: A professional `/offline` page must be rendered when the user is disconnected and a requested page is not in the cache.
- **Optimistic UI**: Use Zustand for optimistic cart updates; sync with the server once connection is restored (Background Sync).
- **Conflict Resolution**: If a cart change occurs offline and conflicts with server state, the server state (Spring Boot) is the single source of truth. Notify the user of any discrepancies.

## 4. Background Synchronization

- **Checkout**: Prohibited offline. Users must be online to initiate payments.
- **Reviews/Ratings**: Eligible for background sync. Queue the request and retry when online.

## 5. Cache Invalidation

- **Manual Purge**: Clear specific caches when the application version changes (via `service-worker.js`).
- **TTL**: Static assets (1 year), Catalog data (1 hour).
