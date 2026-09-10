# Products Feature

The bounded context for product-related logic that isn't already owned by
`domains/catalog/` — homepage merchandising sections, the seller
product-form-to-backend mapper, and thin re-export proxies over the real
catalog domain.

## Responsibilities

- Homepage merchandising: category showcase, featured products, flash deals.
- Product query hooks (`useProducts`, `useProduct`, `useSearchProducts`, …)
  and their TanStack Query key factory.
- Mapping seller product-form data to the backend's `CreateProductRequest`
  shape (`mappers/backend-mapper.ts`).

## Architectural Boundaries

- **Source of truth**: Types, DTOs, and the real API implementation live in
  `domains/catalog/` (`contracts/catalog.types.ts`,
  `infrastructure/api/catalog-api.ts`). This feature re-exports the API from
  there rather than duplicating it — see `api/product-api.ts`, a thin
  re-export proxy, not an independent implementation. Types are imported
  directly from `domains/catalog/contracts/` wherever needed; there is no
  local type-re-export barrel to keep in sync.
- **No barrel `index.ts`**: consumers (this feature's own components,
  `features/seller`, `app/` pages) import directly from the specific
  submodule they need (e.g. `@/features/products/components/CategorySection`,
  `@/features/products/hooks/use-products`) rather than through a public
  barrel. If a barrel is introduced later, every consumer's import path will
  need updating to match — until then, deep imports are the real, working
  contract.
- **Dependencies**: May depend on `core/client` for API transport and
  `domains/catalog` for types and the real API implementation.

## Structure

- `api/`: Thin re-export proxy over `domains/catalog/infrastructure/api/catalog-api.ts`.
- `components/`: Homepage merchandising sections (`CategorySection`,
  `FeaturedProductsSection`, `FlashDealsSection`) — server components with a
  demo-data fallback when the backend is unavailable.
- `constants.ts` / `constants/placeholders.ts`: Form defaults and the demo
  placeholder data used by the fallback path above.
- `hooks/use-products.ts`: TanStack Query hooks for product/category/brand
  reads and product create/update mutations. Only hooks with a real consumer
  are kept here — `useFeaturedProducts`/`useTags` were removed after an
  audit confirmed neither was called anywhere in the app (the homepage's
  "Featured Products" section fetches directly via `productApi.getProducts`
  server-side instead; nothing in the app renders a tag list via this hook).
- `mappers/backend-mapper.ts`: Maps seller product-form data to the
  backend's `CreateProductRequest` shape.
- `query-keys.ts`: Standardized TanStack Query key factory for this domain.
- `utils/fetch-with-fallback.ts`: Shared resilient-fetch helper used by all
  three homepage sections (network call + fallback/demo-data padding).

There is no `store/` (no client-side global state is needed for this
feature's current responsibilities), no local `contracts/`/`types/` folder
(types are owned by `domains/catalog/` and imported directly, not
re-exported through a local barrel), and no root `index.ts` (see above).
