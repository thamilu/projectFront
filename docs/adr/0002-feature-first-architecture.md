# ADR 2: Feature-First Architecture

## Status

Accepted

## Context

Standard Next.js projects often group by file type (`components`, `hooks`, `types`). This leads to "fragmented domain" issues where a single feature's logic is scattered across 5+ global directories.

## Decision

We adopt a **Feature-First** directory structure.

### Structure:

```text
features/
  [feature-name]/
    components/    # UI specific to this feature
    hooks/         # Business logic hooks
    api/           # Feature-specific API clients
    types/         # Domain models
    index.ts       # Public API
```

### Rules:

1. **Locality**: If a component is only used within the "Cart" domain, it must live in `features/cart/components`.
2. **Encapsulation**: Internal components should NOT be exported from `index.ts` unless they are intended for cross-feature composition.
3. **Purity**: Hooks in `features/` should not depend on other features' hooks directly (use composition at the `app/` level instead).

## Consequences

- **Positive**: High cohesion, low coupling, easier deletion of features (delete folder = delete feature), and predictable file locations.
- **Negative**: Deeper nesting in some cases.
