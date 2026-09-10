# ADR 0004: Font Loading and Optimization Strategy

## Status

Accepted

## Context

Typography is a foundational design system concerns that directly impacts Core Web Vitals (specifically Cumulative Layout Shift [CLS] and Largest Contentful Paint [LCP]), WCAG 2.2 AA visual accessibility, branding consistency, and user bandwidth consumption. We need a centralized font loading strategy for the Next.js frontend application.

## Decision

We have implemented a highly optimized font loading strategy using `next/font/google` and a centralized configuration schema in `shared/fonts`.

### 1. Font Choices

- **Sans-Serif**: `Inter` is chosen for primary UI copy, headings, and interactive elements. It has excellent screen legibility, high x-height, clear numeric/character distinction, and supports variable axes.
- **Monospace**: `JetBrains Mono` is chosen for code snippets, developer technical content, and terminal outputs. It offers superior monospace readability and support for developer ligatures.

### 2. Loading and Preloading Options

- **Asymmetric Preloading**:
  - `fontSans` (Inter) is on the critical rendering path for all visible layout text and is preloaded (`preload: true`) to prevent FOUT (Flash of Unstyled Text) and FOIT (Flash of Invisible Text) on initial paint.
  - `fontMono` (JetBrains Mono) is non-critical (used for code snippets typically below-the-fold) and is lazy loaded (`preload: false`) to save initial page bandwidth.
- **Weight Subsetting**:
  - `fontSans` limits loaded weights to `['400', '500', '600', '700']` matching design system tokens (Regular, Medium, SemiBold, Bold).
  - `fontMono` limits loaded weights to `['400', '700']` (Regular, Bold) to minimize typography payloads.
- **Character Subsetting**:
  - `fontSans` includes `['latin', 'latin-ext']` to support European localization markets.
  - `fontMono` includes `['latin']` only, as programming code is ASCII-dominant, saving ~12kb in font file sizes.

### 3. Cumulative Layout Shift (CLS) Reduction

- Enforce `display: 'swap'` on both fonts combined with `adjustFontFallback: true` to enable Next.js to dynamically calculate and inject size-adjust descriptors on fallback system font stacks, minimizing page reflows during loading.

### 4. Tailwind and CSS Integration

- Expose a unified `tailwindFontConfig` helper and `FONT_CSS_VARIABLES` custom properties registry to ensure exact synchronization of fallback font stacks between React SSR/CSR and the Tailwind theme engine.

## Consequences

- **Positive**: Near-zero typography CLS, minimal font payloads, and a single source of truth for design tokens.
- **Negative**: Loader parameters are subject to Next.js AST static compiler constraints, requiring literal values inside function calls, which we validate via dev-only assertions.
