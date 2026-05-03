## Tech Stack — EcomApp Frontend

### Overview
Concise summary of technologies used for the frontend and how they integrate with the backend.

### Frontend
- Framework: Next.js (App Router) — server/client components, routing, middleware
- UI library: Tailwind CSS (utility-first), custom components using shadcn/ui primitives
- Language: TypeScript
- React: React 18 with functional components and hooks
- Component icons: lucide-react
- Forms & validation: react-hook-form + zod (+ @hookform/resolvers)
- Styling: Tailwind + PostCSS

### State & Data
- Global state: Zustand (`src/store/*`) for auth/cart/ui
- Server state & async: TanStack Query (React Query) for mutations/queries
- HTTP client: Axios (`src/lib/axios.ts`) with `withCredentials` and refresh-token interceptor
- Retry: `axios-retry` for transient network errors

### Auth
- Auth flow uses Next API routes as same-origin proxies (`/api/auth/*`) to backend v1 endpoints — cookies are set as httpOnly by server route handlers (see `app/api/auth/*/route.ts`)
- Client helpers: `src/features/auth/api/auth-api-new.ts`, `src/lib/auth.ts` and `src/store/auth-store.ts`
 - Role-based routing enforced via proxy `src/proxy.ts` (replaces `src/middleware.ts`) and client redirects in `use-auth.ts`

### Backend (integration)
- Backend: Spring Boot (documentation and rewrites reference `http://localhost:8080` / `http://localhost:8082`) — Next rewrites proxy `/api/:path*` to `http://localhost:8082/:path*` by default (see `next.config.js`)
- API version: `/api/v1/*` paths are used for live backend endpoints

### Files & Locations (key)
- Next config: [next.config.js](next.config.js)
- Axios client: [src/lib/axios.ts](src/lib/axios.ts)
- API-client helpers: [src/lib/api-client/*](src/lib/api-client)
- Next API proxy routes: [app/api/auth/*/route.ts](app/api/auth)
- Auth hooks: [src/features/auth/hooks/use-auth.ts](src/features/auth/hooks/use-auth.ts)
- Auth API wrapper: [src/features/auth/api/auth-api-new.ts](src/features/auth/api/auth-api-new.ts)
 - Middleware (proxy): [src/proxy.ts](src/proxy.ts) — replaces `src/middleware.ts`

### Build & Scripts
- Package manager: npm
- Important scripts (in `package.json`): `dev` (Next dev), `build`, `start`, `lint`, `format` (project-specific)

### Dev Tools & Observability
- Source maps disabled in production (`productionBrowserSourceMaps: false`) and optional Sentry integration configured via `NEXT_PUBLIC_SENTRY_DSN` in `next.config.js`
- Hot Module Reloading used during development; `.next/` contains build artifacts

### Environment
- Env var for backend: `NEXT_PUBLIC_API_URL` (frontend axios) and `BACKEND_API_URL` (server routes fallback) — configured in `.env.local` or `.env.example`
- Example: `.env.local` currently contains `NEXT_PUBLIC_API_URL=http://localhost:8082`

### Notes & Recommendations
- Use same-origin Next API routes (`/api/*`) for any operations that must set/read httpOnly cookies (auth flows). Avoid calling backend origin directly from browser JS when cookies must be set.
- Consolidate hardcoded `http://localhost:8080` occurrences to use `NEXT_PUBLIC_API_URL` or fix `next.config.js` rewrite target to match actual backend.
- Role detection should be tolerant of backend role formats (e.g., `admin`, `ADMIN`, `ROLE_ADMIN`) — mapping is implemented in `src/features/auth/api/auth-api-new.ts`.

---
Generated: December 21, 2025
