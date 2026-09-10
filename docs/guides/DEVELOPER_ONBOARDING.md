# Developer Onboarding & Engineering Standards

Welcome to the E-Shop Enterprise Frontend. This guide ensures you are aligned with our engineering protocols and coding standards.

## 🚀 Quick Start

1. **Node Version**: Ensure you are using Node `v24.x` (check `.nvmrc`).
2. **Install**: `npm install`.
3. **Environment**: Copy `.env.example` to `.env.local` and configure your Keycloak/Backend URLs.
4. **Dev Server**: `npm run dev` (uses Turbopack).

## 📏 Coding Standards (STRICT)

### 1. The [HARDEN] Rule

Every pull request must undergo a simultaneous audit of:

- **Performance**: Zero redundant re-renders.
- **Reusability**: Shared components first.
- **Security**: No secrets in frontend, use zod for validation.
- **Clean Code**: No legacy artifacts or commented-out code.

### 2. Naming Conventions

- **Directories**: `kebab-case` (e.g., `feature-header`).
- **Components**: `PascalCase` (e.g., `PremiumCard.tsx`).
- **Hooks**: `useKebabCase` (e.g., `use-cart.ts`).
- **Services**: `camelCase` (e.g., `product.service.ts`).

### 3. Import Protocol

- Always use **Path Aliases** (`@/*`) for cross-directory imports.
- Avoid relative paths deeper than two levels (`../../`).

### 4. Component Rules

- **Thin Components**: Keep logic in hooks or services.
- **Prop Typing**: Mandatory interfaces/types for all props.
- **Default Export**: Use named exports from `index.ts` barrels where appropriate.

## 🧪 Testing Protocol

- **Unit**: Vitest/Jest for hooks and utils.
- **Integration**: React Testing Library for complex component interactions.
- **E2E**: Playwright for critical user journeys (Auth, Checkout).

## 🛠️ Tooling

- **Formatting**: Prettier (automated).
- **Linting**: ESLint (Next.js Core Web Vitals + Strict TS).
- **Type Check**: `npm run type-check` before every commit.
