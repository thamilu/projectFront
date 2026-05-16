# Products Feature

The definitive bounded context for all product-related logic in the eShop frontend.

## Responsibilities
- Product listing, filtering, and searching.
- Product detail view and variant management.
- Category browsing and navigation.
- Product data mapping and schema validation.

## Architectural Boundaries
- **Public API**: Only export via `index.ts`.
- **Dependencies**: May depend on `lib/http` for API transport and `features/auth` for permission checks.
- **Inbound**: Other features (e.g., `orders`, `cart`) must import via the public API in `index.ts`.

## Structure
- `api/`: Backend communication layer.
- `components/`: UI components (e.g., `ProductCard`, `ProductGrid`).
- `hooks/`: Domain-specific hooks (e.g., `useProducts`, `useProductDetail`).
- `store/`: Zustand stores for client-side state (e.g., `products-store.ts`).
- `mappers/`: DTO transformation logic.
- `contracts/`: Type definitions for backend data structures.
- `query-keys.ts`: Standardized TanStack Query keys.
