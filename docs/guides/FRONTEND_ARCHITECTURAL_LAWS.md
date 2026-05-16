# Frontend Architectural Laws

1. **Backend Separation**: Frontend never accesses DB directly. All persistence is handled by Spring Boot.
2. **Unified API Layer**: All backend communication must go through `lib/api/http-client.ts`. Direct `fetch` or `axios` calls outside this layer are prohibited.
3. **Feature Isolation**: Features may not import internals of other features. Communication between features must happen via public APIs exposed in `index.ts`.
4. **Logic Decoupling**: No business logic in React components. JSX should only handle UI rendering and UX orchestration.
5. **UI-Only State**: Zustand stores must contain UI state only. Server state must be managed by TanStack Query.
6. **Single Source of Truth**: Types generated from Spring Boot OpenAPI are the source of truth for DTOs.
7. **Secure Token Handling**: Tokens must never be stored in `localStorage` or `IndexedDB`. Use `httpOnly` secure cookies.
8. **Explicit Client Components**: Use Next.js Server Components by default. `'use client'` requires explicit justification (interactivity, hooks, browser APIs).
9. **Domain-Agnostic Shared Components**: Components in `components/shared/` must remain domain-agnostic and reusable across features.
10. **Strict Validation**: All forms and environment variables require Zod validation.
11. **Feature Gating**: Use feature flags to gate unfinished or experimental functionality.
12. **Route Grouping**: Route groups in `app/` must mirror bounded contexts (e.g., `(customer)`, `(seller)`).
13. **Edge Compatibility**: Edge runtime code must avoid Node.js-specific APIs.
14. **Error Mapping**: Map backend `ErrorCodes` consistently to `AppError` hierarchy for predictable UI behavior.
15. **Distributed Tracing**: Propagate `X-Correlation-ID` and trace headers in all outgoing requests.
