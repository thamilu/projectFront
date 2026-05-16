# ADR 1: Modular Monolith Frontend Architecture

## Status
Accepted

## Context
As the EShop frontend grows, maintaining a flat structure leads to "spaghetti imports," circular dependencies, and unclear ownership of business logic. We need a structure that scales with multiple teams and features while keeping the deployment simple.

## Decision
We adopt a **Modular Monolith** architecture with a **Feature-First** orientation.

### Key Rules:
1. **Features as Boundaries**: Each major business capability (cart, products, auth) resides in its own `features/` folder.
2. **Strict Public API**: Features only expose functionality via a top-level `index.ts`. Cross-feature imports must use these public APIs.
3. **Layer Matrix Enforcement**:
   - `app` (Pages) can import anything.
   - `features` can import `shared` and `lib`.
   - `lib` (Infrastructure) must be stateless and domain-agnostic.
4. **De-cluttered Shared Space**: Global `components/` are reserved for truly layout-level or atomic UI elements. Business-specific UI belongs in `features/`.

## Consequences
- **Positive**: Clear ownership, faster build times (via better caching), easier onboarding, and reduced regressions.
- **Negative**: Slight overhead when creating new features (requires index files and strict mapping).
- **Enforcement**: Automated via `eslint-plugin-boundaries` and `dependency-cruiser`.
