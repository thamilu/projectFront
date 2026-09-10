/**
 * @fileoverview Shared Constants — Public API Barrel
 *
 * Single entry point for all shared constants.
 * ALL constant imports across the application use this barrel.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  ARCHITECTURE RULES — READ BEFORE MODIFYING                     │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  ✅ Export constants and their types (values + types together)   │
 * │  ✅ Explicit named exports ONLY — no wildcard (export * from)    │
 * │  ❌ No runtime utility functions → use @/shared/utils            │
 * │  ❌ No Zod/validation schemas  → use @/shared/schemas            │
 * │  ❌ No React components        → use @/shared/components         │
 * │  ❌ No mock/demo data in prod  → use @/shared/mocks              │
 * │  ❌ No route definitions       → use @/shared/routes             │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * EXPORT ORDER (maintain this sequence):
 *   1. Schema Version     5. Navigation       9. Infrastructure
 *   2. Localization       6. Domain          10. Business Rules
 *   3. Theme & Layout     7. API & Network
 *   4. (reserved)         8. Auth
 *
 * @module shared/constants
 * @version 2.1.0
 */

// ─── 1. Schema Version ───────────────────────────────────────────────────────
export {
  CONSTANTS_SCHEMA_VERSION,
  isCurrentSchemaVersion,
  withSchemaVersion,
} from './schema-version';
export type { ConstantsSchemaVersion } from './schema-version';

// ─── 2. Localization ─────────────────────────────────────────────────────────
export { LANGUAGES } from './localization/languages';
export type { Language, LanguageCode } from './localization/languages';

export { CURRENCIES, DEFAULT_CURRENCY } from './localization/currencies';
export type { Currency, CurrencyCode } from './localization/currencies';

// ─── 3. Theme & Layout ───────────────────────────────────────────────────────
export { ACCENT_COLORS } from './theme/accent-colors';
export type { AccentColorConfig, AccentColorName } from './theme/accent-colors';

export { GRID_COLS_MAP, LAYOUT_CONSTANTS, TAILWIND_BREAKPOINTS } from './theme/layout';
export type { GridColsCount, TailwindBreakpoint } from './theme/layout';

// ─── 4. Navigation ───────────────────────────────────────────────────────────
export { SETTINGS_TABS } from './navigation/settings-tabs';
export type { SettingsTab, SettingsTabId } from './navigation/settings-tabs';

// ─── 5. Domain ───────────────────────────────────────────────────────────────
export {
  CATEGORIES,
  CATEGORY_IDS,
  isCategoryId,
  sortCategories,
  getActiveCategories,
  findCategoryById,
  findCategoryBySlug,
  formatCategoryCount,
  getCategoryChildren,
  getCategoryAncestors,
  buildCategoryTree,
} from './domain/categories';
export type {
  ProductCategory,
  CategoryId,
  CategoryIconName,
  CategoryTreeNode,
} from './domain/categories';

export { PRODUCT_LIMITS } from './domain/product-config';
export type { ProductLimits } from './domain/product-config';

// ─── 6. Business Rules ───────────────────────────────────────────────────────
export { ORDER_STATUS } from './domain/order';
export type { OrderStatus } from './domain/order';

export { PAYMENT_STATUS, CURRENCY_SYMBOLS } from './domain/payment';
export type { PaymentStatus } from './domain/payment';

export { PRODUCT_STATUS, PRICE_RANGE, RATING, INVENTORY } from './domain/product';
export type { ProductStatus } from './domain/product';

// ─── 7. Auth ─────────────────────────────────────────────────────────────────
export { USER_ROLES } from './auth/roles';
export type { UserRole } from './auth/roles';

// ─── 8. API & Network ────────────────────────────────────────────────────────
export { API_ENDPOINTS, API_CONFIG, HTTP_STATUS } from './api/endpoints';
export type { ApiPath, HttpStatusCode } from './api/endpoints';
export { isClientError, isServerError, isSuccess, isRetryable } from './api/endpoints';

// ─── 9. Infrastructure ───────────────────────────────────────────────────────
export { PAGINATION } from './pagination';
export type { PageSize } from './pagination';

export { VALIDATION } from './validation';
export type { ValidationConfig } from './validation';

export { FILE_UPLOAD } from './upload';
export type { FileUploadConfig, AllowedMimeType } from './upload';
