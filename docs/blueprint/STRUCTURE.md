# Enterprise Architectural Blueprint: Definitive Technical Map

This document is the **Ultimate Source of Truth** for the E-Shop Enterprise workspace. It meticulously documents every layer of the infrastructure, configuration files, and build artifacts, ensuring total architectural transparency.

## 🏗️ Architectural Overview

The project follows a **Feature-First Bounded Context** architecture (Modular Monolith).

## 🏛️ Layer Matrix Enforcement [HARDEN]

| Layer        | Allowed Imports       | Responsibility                               |
| :----------- | :-------------------- | :------------------------------------------- |
| **app**      | features, shared, lib | Routing, Page composition, Global providers  |
| **features** | shared, lib           | Bounded contexts, Business UI, Feature-state |
| **shared**   | lib                   | Cross-domain UI components, Global hooks     |
| **lib**      | lib (internal)        | Infrastructure, API clients, Low-level utils |
| **ui**       | nothing               | Primitive, stateless UI components (Shadcn)  |

## 📜 Layer Responsibilities

### 1. The Feature Layer (/features)

Each feature folder is a **Bounded Context** that encapsulates a specific business domain.

### 2. The Shared Layer (/shared)

Business-logic-aware primitives shared across features.

### 3. The Infrastructure Layer (/lib)

Stateless utilities, core service configurations, and external integrations.

---

## 🗺️ Architectural Roadmap [FUTURE]

| Goal                     | Description                                                             | Status      |
| :----------------------- | :---------------------------------------------------------------------- | :---------- |
| **Typed SDK Generation** | Switch to Orval for automatic React Query hook generation from OpenAPI. | Planned     |
| **Infrastructure Split** | Sub-divide `lib/` into `infra/`, `platform/`, and `core/`.              | Planned     |
| **Contract Testing**     | Implement PACT or similar for consumer-driven contract testing.         | Researching |
| **Performance Gates**    | Block CI if Lighthouse or BundleSize budgets are exceeded.              | Active      |

---

## 📂 Exhaustive Project Tree

```text
├── .dependency-cruiser.js                          # Source implementation file
├── .env                                            # Source implementation file
├── .env.example                                    # Source implementation file
├── .env.local                                      # Source implementation file
├── .github                                         # Sub-directory
│   ├── appmod                                      # Sub-directory
│   │   └── appcat                                  # Sub-directory
│   └── workflows                                   # Sub-directory
│       └── frontend-check.yml                      # Source implementation file
├── .gitignore                                      # Source implementation file
├── .husky                                          # Sub-directory
│   └── _                                           # Sub-directory
│       ├── .gitignore                              # Source implementation file
│       ├── applypatch-msg                          # Source implementation file
│       ├── commit-msg                              # Source implementation file
│       ├── h                                       # Source implementation file
│       ├── husky.sh                                # Source implementation file
│       ├── post-applypatch                         # Source implementation file
│       ├── post-checkout                           # Source implementation file
│       ├── post-commit                             # Source implementation file
│       ├── post-merge                              # Source implementation file
│       ├── post-rewrite                            # Source implementation file
│       ├── pre-applypatch                          # Source implementation file
│       ├── pre-auto-gc                             # Source implementation file
│       ├── pre-commit                              # Source implementation file
│       ├── pre-merge-commit                        # Source implementation file
│       ├── pre-push                                # Source implementation file
│       ├── pre-rebase                              # Source implementation file
│       └── prepare-commit-msg                      # Source implementation file
├── .node-version                                   # Source implementation file
├── .nvmrc                                          # Source implementation file
├── .qodo                                           # Sub-directory
│   ├── agents                                      # Sub-directory
│   └── workflows                                   # Sub-directory
├── README.md                                       # Source implementation file
├── __tests__                                       # Sub-directory
│   ├── integration                                 # Sub-directory
│   │   ├── README.md                               # Source implementation file
│   │   └── api                                     # Sub-directory
│   │       └── auth-api.test.ts                    # Source implementation file
│   ├── setup.ts                                    # Source implementation file
│   └── unit                                        # Sub-directory
│       ├── README.md                               # Source implementation file
│       ├── components                              # Sub-directory
│       │   └── button.test.tsx                     # Source implementation file
│       └── hooks                                   # Sub-directory
├── app                                             # Route segment directory
│   ├── (auth)                                      # Route Group (logical separation)
│   │   ├── auth                                    # Route segment directory
│   │   │   ├── callback                            # Route segment directory
│   │   │   │   └── page.tsx                        # Page implementation component
│   │   │   ├── debug-redirect                      # Route segment directory
│   │   │   │   └── page.tsx                        # Page implementation component
│   │   │   ├── login                               # Route segment directory
│   │   │   │   └── page.tsx                        # Page implementation component
│   │   │   ├── pkce-callback                       # Route segment directory
│   │   │   │   └── page.tsx                        # Page implementation component
│   │   │   ├── popup-finish                        # Route segment directory
│   │   │   │   └── page.tsx                        # Page implementation component
│   │   │   ├── register                            # Route segment directory
│   │   │   │   └── page.tsx                        # Page implementation component
│   │   │   ├── signin                              # Route segment directory
│   │   │   │   └── page.tsx                        # Page implementation component
│   │   │   └── signout                             # Route segment directory
│   │   │       └── page.tsx                        # Page implementation component
│   │   ├── callback                                # Route segment directory
│   │   ├── login                                   # Route segment directory
│   │   │   ├── error.tsx                           # Error boundary for this segment
│   │   │   ├── loading.tsx                         # Loading UI for this segment
│   │   │   └── page.tsx                            # Page implementation component
│   │   └── register                                # Route segment directory
│   │       └── page.tsx                            # Page implementation component
│   ├── (customer)                                  # Route Group (logical separation)
│   │   ├── account                                 # Route segment directory
│   │   │   ├── addresses                           # Route segment directory
│   │   │   │   └── page.tsx                        # Page implementation component
│   │   │   ├── orders                              # Route segment directory
│   │   │   │   └── page.tsx                        # Page implementation component
│   │   │   ├── page.tsx                            # Page implementation component
│   │   │   ├── payment-methods                     # Route segment directory
│   │   │   │   └── page.tsx                        # Page implementation component
│   │   │   ├── profile                             # Route segment directory
│   │   │   │   └── page.tsx                        # Page implementation component
│   │   │   ├── reviews                             # Route segment directory
│   │   │   │   └── page.tsx                        # Page implementation component
│   │   │   └── security                            # Route segment directory
│   │   │       └── page.tsx                        # Page implementation component
│   │   ├── cart                                    # Route segment directory
│   │   │   └── page.tsx                            # Page implementation component
│   │   ├── checkout                                # Route segment directory
│   │   │   └── page.tsx                            # Page implementation component
│   │   ├── customer                                # Route segment directory
│   │   │   ├── dashboard                           # Route segment directory
│   │   │   │   ├── layout.tsx                      # Layout shell for this route
│   │   │   │   └── page.tsx                        # Page implementation component
│   │   │   └── page.tsx                            # Page implementation component
│   │   ├── dashboard                               # Route segment directory
│   │   │   └── page.tsx                            # Page implementation component
│   │   ├── notifications                           # Route segment directory
│   │   │   ├── page.tsx                            # Page implementation component
│   │   │   └── settings                            # Route segment directory
│   │   │       └── page.tsx                        # Page implementation component
│   │   ├── orders                                  # Route segment directory
│   │   │   ├── [id]                                # Route segment directory
│   │   │   │   ├── invoice                         # Route segment directory
│   │   │   │   │   └── page.tsx                    # Page implementation component
│   │   │   │   ├── page.tsx                        # Page implementation component
│   │   │   │   ├── return                          # Route segment directory
│   │   │   │   │   └── page.tsx                    # Page implementation component
│   │   │   │   └── track                           # Route segment directory
│   │   │   │       └── page.tsx                    # Page implementation component
│   │   │   └── page.tsx                            # Page implementation component
│   │   ├── settings                                # Route segment directory
│   │   │   └── page.tsx                            # Page implementation component
│   │   └── wishlist                                # Route segment directory
│   │       └── page.tsx                            # Page implementation component
│   ├── (public)                                    # Route Group (logical separation)
│   │   ├── 403                                     # Route segment directory
│   │   │   ├── Error403Client.tsx                  # Source implementation file
│   │   │   └── page.tsx                            # Page implementation component
│   │   ├── 500                                     # Route segment directory
│   │   │   └── page.tsx                            # Page implementation component
│   │   ├── about                                   # Route segment directory
│   │   │   └── page.tsx                            # Page implementation component
│   │   ├── access-denied                           # Route segment directory
│   │   │   └── page.tsx                            # Page implementation component
│   │   ├── categories                              # Route segment directory
│   │   │   └── page.tsx                            # Page implementation component
│   │   ├── compare                                 # Route segment directory
│   │   │   └── page.tsx                            # Page implementation component
│   │   ├── contact                                 # Route segment directory
│   │   │   └── page.tsx                            # Page implementation component
│   │   ├── deals                                   # Route segment directory
│   │   │   └── page.tsx                            # Page implementation component
│   │   ├── error.tsx                               # Error boundary for this segment
│   │   ├── flash-deals                             # Route segment directory
│   │   │   └── page.tsx                            # Page implementation component
│   │   ├── help                                    # Route segment directory
│   │   │   └── page.tsx                            # Page implementation component
│   │   ├── page.tsx                                # Page implementation component
│   │   ├── privacy                                 # Route segment directory
│   │   │   └── page.tsx                            # Page implementation component
│   │   ├── products                                # Route segment directory
│   │   │   ├── [slug]                              # Route segment directory
│   │   │   │   ├── not-found.tsx                   # Source implementation file
│   │   │   │   ├── page.tsx                        # Page implementation component
│   │   │   │   ├── product-detail-client.tsx       # Source implementation file
│   │   │   │   └── reviews                         # Route segment directory
│   │   │   │       └── page.tsx                    # Page implementation component
│   │   │   ├── page-new.tsx                        # Source implementation file
│   │   │   ├── page.tsx                            # Page implementation component
│   │   │   ├── products-list-client.tsx            # Source implementation file
│   │   │   └── products.module.css                 # Source implementation file
│   │   ├── search                                  # Route segment directory
│   │   │   └── page.tsx                            # Page implementation component
│   │   ├── stores                                  # Route segment directory
│   │   │   ├── [id]                                # Route segment directory
│   │   │   │   ├── error.tsx                       # Error boundary for this segment
│   │   │   │   ├── loading.tsx                     # Loading UI for this segment
│   │   │   │   └── page.tsx                        # Page implementation component
│   │   │   └── page.tsx                            # Page implementation component
│   │   ├── terms                                   # Route segment directory
│   │   │   └── page.tsx                            # Page implementation component
│   │   └── unauthorized                            # Route segment directory
│   │       └── page.tsx                            # Page implementation component
│   ├── (seller)                                    # Route Group (logical separation)
│   │   ├── become-seller                           # Route segment directory
│   │   │   └── page.tsx                            # Page implementation component
│   │   └── seller                                  # Route segment directory
│   │       ├── analytics                           # Route segment directory
│   │       │   └── page.tsx                        # Page implementation component
│   │       ├── coupons                             # Route segment directory
│   │       │   └── page.tsx                        # Page implementation component
│   │       ├── dashboard                           # Route segment directory
│   │       │   ├── SellerDashboardClient.tsx       # Source implementation file
│   │       │   └── page.tsx                        # Page implementation component
│   │       ├── disputes                            # Route segment directory
│   │       │   └── page.tsx                        # Page implementation component
│   │       ├── inventory                           # Route segment directory
│   │       │   └── page.tsx                        # Page implementation component
│   │       ├── layout.tsx                          # Layout shell for this route
│   │       ├── orders                              # Route segment directory
│   │       │   └── page.tsx                        # Page implementation component
│   │       ├── page.tsx                            # Page implementation component
│   │       ├── payouts                             # Route segment directory
│   │       │   └── page.tsx                        # Page implementation component
│   │       ├── products                            # Route segment directory
│   │       │   ├── [id]                            # Route segment directory
│   │       │   │   └── edit                        # Route segment directory
│   │       │   │       └── page.tsx                # Page implementation component
│   │       │   ├── add                             # Route segment directory
│   │       │   │   └── page.tsx                    # Page implementation component
│   │       │   ├── create                          # Route segment directory
│   │       │   │   └── page.tsx                    # Page implementation component
│   │       │   └── page.tsx                        # Page implementation component
│   │       ├── profile                             # Route segment directory
│   │       │   └── page.tsx                        # Page implementation component
│   │       ├── promotions                          # Route segment directory
│   │       │   └── page.tsx                        # Page implementation component
│   │       ├── register                            # Route segment directory
│   │       │   └── page.tsx                        # Page implementation component
│   │       ├── reviews                             # Route segment directory
│   │       │   └── page.tsx                        # Page implementation component
│   │       ├── settings                            # Route segment directory
│   │       │   └── page.tsx                        # Page implementation component
│   │       └── store                               # Route segment directory
│   │           ├── create                          # Route segment directory
│   │           │   └── page.tsx                    # Page implementation component
│   │           └── page.tsx                        # Page implementation component
│   ├── api                                         # Route segment directory
│   │   ├── auth                                    # Route segment directory
│   │   │   ├── [...nextauth]                       # Route segment directory
│   │   │   │   └── route.ts                        # Server-side API route handler
│   │   │   ├── debug                               # Route segment directory
│   │   │   │   └── route.ts                        # Server-side API route handler
│   │   │   ├── health                              # Route segment directory
│   │   │   │   └── route.ts                        # Server-side API route handler
│   │   │   ├── keycloak                            # Route segment directory
│   │   │   │   └── callback                        # Route segment directory
│   │   │   │       └── route.ts                    # Server-side API route handler
│   │   │   ├── logout                              # Route segment directory
│   │   │   │   └── route.ts                        # Server-side API route handler
│   │   │   ├── me                                  # Route segment directory
│   │   │   │   └── route.ts                        # Server-side API route handler
│   │   │   └── refresh                             # Route segment directory
│   │   │       └── route.ts                        # Server-side API route handler
│   │   ├── cart                                    # Route segment directory
│   │   │   └── sync                                # Route segment directory
│   │   ├── csp                                     # Route segment directory
│   │   │   └── report                              # Route segment directory
│   │   │       └── route.ts                        # Server-side API route handler
│   │   ├── debug                                   # Route segment directory
│   │   │   └── env                                 # Route segment directory
│   │   │       └── route.ts                        # Server-side API route handler
│   │   ├── get-token                               # Route segment directory
│   │   │   └── route.ts                            # Server-side API route handler
│   │   ├── hello                                   # Route segment directory
│   │   │   └── route.ts                            # Server-side API route handler
│   │   ├── onboarding                              # Route segment directory
│   │   │   ├── delivery                            # Route segment directory
│   │   │   │   └── route.ts                        # Server-side API route handler
│   │   │   └── seller                              # Route segment directory
│   │   │       └── route.ts                        # Server-side API route handler
│   │   ├── orders                                  # Route segment directory
│   │   │   └── [id]                                # Route segment directory
│   │   │       └── stream                          # Route segment directory
│   │   │           └── route.ts                    # Server-side API route handler
│   │   ├── payments                                # Route segment directory
│   │   │   └── create-intent                       # Route segment directory
│   │   │       └── route.ts                        # Server-side API route handler
│   │   ├── product-images                          # Route segment directory
│   │   │   ├── [imageId]                           # Route segment directory
│   │   │   │   └── route.ts                        # Server-side API route handler
│   │   │   ├── product                             # Route segment directory
│   │   │   │   └── [productId]                     # Route segment directory
│   │   │   │       ├── primary                     # Route segment directory
│   │   │   │       │   └── [imageId]               # Route segment directory
│   │   │   │       │       └── route.ts            # Server-side API route handler
│   │   │   │       └── route.ts                    # Server-side API route handler
│   │   │   └── route.ts                            # Server-side API route handler
│   │   ├── search                                  # Route segment directory
│   │   │   ├── route.ts                            # Server-side API route handler
│   │   │   └── suggest                             # Route segment directory
│   │   │       └── route.ts                        # Server-side API route handler
│   │   ├── secure                                  # Route segment directory
│   │   │   ├── pricing                             # Route segment directory
│   │   │   │   └── route.ts                        # Server-side API route handler
│   │   │   └── validate-coupon                     # Route segment directory
│   │   │       └── route.ts                        # Server-side API route handler
│   │   ├── seller                                  # Route segment directory
│   │   │   └── products                            # Route segment directory
│   │   │       └── route.ts                        # Server-side API route handler
│   │   ├── test                                    # Route segment directory
│   │   │   └── route.js                            # Source implementation file
│   │   └── webhooks                                # Route segment directory
│   │       └── stripe                              # Route segment directory
│   │           └── route.ts                        # Server-side API route handler
│   ├── error.tsx                                   # Error boundary for this segment
│   ├── global-error.tsx                            # Error boundary for this segment
│   ├── globals.css                                 # Source implementation file
│   ├── layout.tsx                                  # Layout shell for this route
│   ├── loading.tsx                                 # Loading UI for this segment
│   ├── manifest.ts                                 # Source implementation file
│   ├── not-found.tsx                               # Source implementation file
│   ├── providers.tsx                               # Source implementation file
│   ├── robots.ts                                   # Source implementation file
│   ├── sitemap.ts                                  # Source implementation file
│   ├── test-backend                                # Route segment directory
│   │   └── page.tsx                                # Page implementation component
│   └── test-route                                  # Route segment directory
├── auth.ts                                         # Source implementation file
├── components                                      # Sub-directory
│   ├── NextAuthProvider.tsx                        # Source implementation file
│   ├── R2ImageUploader.tsx                         # Source implementation file
│   ├── Seo                                         # Sub-directory
│   │   └── SafeJsonLd.tsx                          # Source implementation file
│   ├── auth                                        # Sub-directory
│   ├── common                                      # Sub-directory
│   │   ├── connection-status.tsx                   # Source implementation file
│   │   ├── cookie-consent.tsx                      # Source implementation file
│   │   ├── error-boundary.tsx                      # Source implementation file
│   │   ├── index.ts                                # Source implementation file
│   │   ├── network-status.tsx                      # Source implementation file
│   │   ├── resilient-section.tsx                   # Source implementation file
│   │   └── screen-reader-announcer.tsx             # Source implementation file
│   ├── error-boundary                              # Sub-directory
│   │   ├── error-boundary.tsx                      # Source implementation file
│   │   └── index.ts                                # Source implementation file
│   ├── home                                        # Sub-directory
│   │   ├── AppDownloadSection.tsx                  # Source implementation file
│   │   ├── BannerCarousel.tsx                      # Source implementation file
│   │   ├── FeaturedSlider.tsx                      # Source implementation file
│   │   ├── Hero.tsx                                # Source implementation file
│   │   ├── HomePage.tsx                            # Source implementation file
│   │   ├── PromoBannerSection.tsx                  # Source implementation file
│   │   ├── PromoBanners.tsx                        # Source implementation file
│   │   ├── QuickLinksBanner.tsx                    # Source implementation file
│   │   ├── QuickLinksBanner.wrapper.tsx            # Source implementation file
│   │   ├── RegisterPrompt.tsx                      # Source implementation file
│   │   ├── SectionReveal.tsx                       # Source implementation file
│   │   ├── TestimonialsSection.tsx                 # Source implementation file
│   │   ├── TrustSection.tsx                        # Source implementation file
│   │   ├── error-fallbacks.tsx                     # Source implementation file
│   │   ├── index.client.ts                         # Source implementation file
│   │   ├── index.server.ts                         # Source implementation file
│   │   ├── index.ts                                # Source implementation file
│   │   └── skeletons.tsx                           # Source implementation file
│   ├── icons                                       # Sub-directory
│   │   ├── AppleIcon.tsx                           # Source implementation file
│   │   └── GooglePlayIcon.tsx                      # Source implementation file
│   ├── index.ts                                    # Source implementation file
│   ├── layout                                      # Sub-directory
│   │   ├── SearchBar.tsx                           # Source implementation file
│   │   ├── cart-preview.tsx                        # Source implementation file
│   │   ├── category-menu.tsx                       # Source implementation file
│   │   ├── header-wrapper.tsx                      # Source implementation file
│   │   ├── header.tsx                              # Source implementation file
│   │   ├── index.ts                                # Source implementation file
│   │   ├── promotional-banner.tsx                  # Source implementation file
│   │   ├── sidebar.tsx                             # Source implementation file
│   │   └── skip-to-content.tsx                     # Source implementation file
│   ├── navigation.tsx                              # Source implementation file
│   ├── providers                                   # Sub-directory
│   │   ├── analytics-provider.tsx                  # Source implementation file
│   │   ├── auth-provider.tsx                       # Source implementation file
│   │   ├── stripe-provider.tsx                     # Source implementation file
│   │   ├── theme-provider.tsx                      # Source implementation file
│   │   └── toast-provider.tsx                      # Source implementation file
│   ├── search                                      # Sub-directory
│   │   ├── advanced-search.tsx                     # Source implementation file
│   │   └── search-autocomplete.tsx                 # Source implementation file
│   ├── settings                                    # Sub-directory
│   │   ├── SettingsButton.tsx                      # Source implementation file
│   │   └── tabs                                    # Sub-directory
│   │       └── AppearanceTab.tsx                   # Source implementation file
│   ├── store                                       # Sub-directory
│   │   └── PublicStoreProfile.tsx                  # Source implementation file
│   ├── theme-toggle.tsx                            # Source implementation file
│   └── ui                                          # Sub-directory
│       ├── alert.tsx                               # Source implementation file
│       ├── avatar.tsx                              # Source implementation file
│       ├── badge.tsx                               # Source implementation file
│       ├── button.tsx                              # Source implementation file
│       ├── card.tsx                                # Source implementation file
│       ├── checkbox.tsx                            # Source implementation file
│       ├── combobox.tsx                            # Source implementation file
│       ├── command.tsx                             # Source implementation file
│       ├── dialog.tsx                              # Source implementation file
│       ├── dropdown-menu.tsx                       # Source implementation file
│       ├── empty-state.tsx                         # Source implementation file
│       ├── error-alert.tsx                         # Source implementation file
│       ├── field-help.tsx                          # Source implementation file
│       ├── form-error.tsx                          # Source implementation file
│       ├── index.ts                                # Source implementation file
│       ├── input.tsx                               # Source implementation file
│       ├── label.tsx                               # Source implementation file
│       ├── loading.tsx                             # Source implementation file
│       ├── map-component.tsx                       # Source implementation file
│       ├── navigation-menu.tsx                     # Source implementation file
│       ├── password-strength.tsx                   # Source implementation file
│       ├── popover.tsx                             # Source implementation file
│       ├── progress.tsx                            # Source implementation file
│       ├── radio-group.tsx                         # Source implementation file
│       ├── select.tsx                              # Source implementation file
│       ├── separator.tsx                           # Source implementation file
│       ├── sheet.tsx                               # Source implementation file
│       ├── skeleton.tsx                            # Source implementation file
│       ├── slider.tsx                              # Source implementation file
│       ├── stats-card.tsx                          # Source implementation file
│       ├── stepper.tsx                             # Source implementation file
│       ├── switch.tsx                              # Source implementation file
│       ├── table.tsx                               # Source implementation file
│       ├── tabs.tsx                                # Source implementation file
│       ├── tag-input.tsx                           # Source implementation file
│       ├── textarea.tsx                            # Source implementation file
│       ├── toast.tsx                               # Source implementation file
│       └── tooltip.tsx                             # Source implementation file
├── components.json                                 # Source implementation file
├── config                                          # Sub-directory
│   ├── app.config.ts                               # Source implementation file
│   ├── env.config.ts                               # Source implementation file
│   ├── index.ts                                    # Source implementation file
│   └── routes.config.ts                            # Source implementation file
├── constants                                       # Sub-directory
│   ├── api                                         # Sub-directory
│   │   └── endpoints.ts                            # Source implementation file
│   ├── business.ts                                 # Source implementation file
│   ├── demoData.ts                                 # Source implementation file
│   ├── index.ts                                    # Source implementation file
│   ├── registry                                    # Sub-directory
│   └── routes                                      # Sub-directory
│       └── app-routes.ts                           # Source implementation file
├── docs                                            # Sub-directory
│   ├── README.md                                   # Source implementation file
│   ├── adr                                         # Sub-directory
│   │   ├── 0001-modular-monolith-architecture.md   # Source implementation file
│   │   ├── 0002-feature-first-architecture.md      # Source implementation file
│   │   └── 0003-authentication-architecture.md     # Source implementation file
│   ├── archive                                     # Sub-directory
│   │   ├── AUTHENTICATION_CHRONICLES.md            # Source implementation file
│   │   ├── BACKEND_CHANGES_REQUIRED.md             # Source implementation file
│   │   ├── EVOLUTION_LOGS.md                       # Source implementation file
│   │   └── SECURITY_CHRONICLES.md                  # Source implementation file
│   ├── blueprint                                   # Sub-directory
│   │   ├── ARCHITECTURE.md                         # Source implementation file
│   │   ├── SECURITY.md                             # Source implementation file
│   │   ├── SERVER_COMPONENT_RULES.md               # Source implementation file
│   │   └── STRUCTURE.md                            # Source implementation file
│   └── guides                                      # Sub-directory
│       ├── DEVELOPER_ONBOARDING.md                 # Source implementation file
│       ├── FRONTEND_ARCHITECTURAL_LAWS.md          # Source implementation file
│       ├── PWA_GOVERNANCE.md                       # Source implementation file
│       ├── PWA_SERVICE_WORKER.md                   # Source implementation file
│       └── UI-Component-Guide.md                   # Source implementation file
├── e2e                                             # Sub-directory
│   ├── README.md                                   # Source implementation file
│   └── auth.spec.ts                                # Source implementation file
├── env.ts                                          # Source implementation file
├── eslint.config.js                                # Source implementation file
├── features                                        # Sub-directory
│   ├── analytics                                   # Feature Bounded Context: ANALYTICS
│   │   ├── api                                     # Feature data access layer
│   │   ├── components                              # Feature-specific UI components
│   │   ├── hooks                                   # Feature business logic hooks
│   │   ├── store                                   # Feature state management (Zustand)
│   │   │   └── analytics-store.ts                  # Source implementation file
│   │   └── types                                   # Feature domain type definitions
│   ├── auth                                        # Feature Bounded Context: AUTH
│   │   ├── api                                     # Feature data access layer
│   │   │   └── __tests__                           # Sub-directory
│   │   │       └── auth-api-new.test.ts            # Source implementation file
│   │   ├── components                              # Feature-specific UI components
│   │   │   ├── AuthGuard.tsx                       # Source implementation file
│   │   │   ├── LogoutButton.tsx                    # Source implementation file
│   │   │   ├── ModernAuthUI.tsx                    # Source implementation file
│   │   │   ├── ProtectedRoute.tsx                  # Source implementation file
│   │   │   ├── auth-status.tsx                     # Source implementation file
│   │   │   ├── client-redirect.tsx                 # Source implementation file
│   │   │   ├── login-button.tsx                    # Source implementation file
│   │   │   ├── redirecting-screen.tsx              # Source implementation file
│   │   │   ├── role-redirect.tsx                   # Source implementation file
│   │   │   └── user-nav.tsx                        # Source implementation file
│   │   ├── hooks                                   # Feature business logic hooks
│   │   │   ├── use-auth.ts                         # Source implementation file
│   │   │   └── use-permissions.ts                  # Source implementation file
│   │   ├── index.ts                                # Feature Public API Gateway
│   │   ├── schemas                                 # Sub-directory
│   │   │   └── auth.schema.ts                      # Source implementation file
│   │   ├── server-utils.ts                         # Source implementation file
│   │   ├── store                                   # Feature state management (Zustand)
│   │   │   └── auth-store.ts                       # Source implementation file
│   │   ├── types                                   # Feature domain type definitions
│   │   │   └── auth.types.ts                       # Source implementation file
│   │   └── utils                                   # Sub-directory
│   │       └── role-mapper.ts                      # Source implementation file
│   ├── cart                                        # Feature Bounded Context: CART
│   │   ├── api                                     # Feature data access layer
│   │   │   └── cart-api.ts                         # Source implementation file
│   │   ├── components                              # Feature-specific UI components
│   │   │   └── AddToCartButton.tsx                 # Source implementation file
│   │   ├── hooks                                   # Feature business logic hooks
│   │   │   └── use-cart.ts                         # Source implementation file
│   │   ├── index.ts                                # Feature Public API Gateway
│   │   ├── schemas                                 # Sub-directory
│   │   ├── store                                   # Feature state management (Zustand)
│   │   │   └── cart-store.ts                       # Source implementation file
│   │   └── types                                   # Feature domain type definitions
│   ├── customer                                    # Feature Bounded Context: CUSTOMER
│   │   ├── api                                     # Feature data access layer
│   │   ├── components                              # Feature-specific UI components
│   │   │   ├── CustomerDashboard.tsx               # Source implementation file
│   │   │   └── CustomerQuickStats.tsx              # Source implementation file
│   │   ├── hooks                                   # Feature business logic hooks
│   │   └── index.ts                                # Feature Public API Gateway
│   ├── inventory                                   # Feature Bounded Context: INVENTORY
│   │   ├── api                                     # Feature data access layer
│   │   ├── components                              # Feature-specific UI components
│   │   ├── hooks                                   # Feature business logic hooks
│   │   └── types                                   # Feature domain type definitions
│   ├── locations                                   # Feature Bounded Context: LOCATIONS
│   │   └── hooks                                   # Feature business logic hooks
│   │       └── use-locations.ts                    # Source implementation file
│   ├── notifications                               # Feature Bounded Context: NOTIFICATIONS
│   │   ├── api                                     # Feature data access layer
│   │   │   └── notifications-api.ts                # Source implementation file
│   │   ├── components                              # Feature-specific UI components
│   │   ├── hooks                                   # Feature business logic hooks
│   │   │   └── use-notifications.ts                # Source implementation file
│   │   ├── index.ts                                # Feature Public API Gateway
│   │   ├── store                                   # Feature state management (Zustand)
│   │   │   └── notification-store.ts               # Source implementation file
│   │   └── types                                   # Feature domain type definitions
│   │       └── notification.types.ts               # Source implementation file
│   ├── orders                                      # Feature Bounded Context: ORDERS
│   │   ├── api                                     # Feature data access layer
│   │   │   └── order-api.ts                        # Source implementation file
│   │   ├── components                              # Feature-specific UI components
│   │   ├── hooks                                   # Feature business logic hooks
│   │   │   ├── use-order-updates.ts                # Source implementation file
│   │   │   └── use-orders.ts                       # Source implementation file
│   │   ├── index.ts                                # Feature Public API Gateway
│   │   ├── schemas                                 # Sub-directory
│   │   ├── store                                   # Feature state management (Zustand)
│   │   │   └── orders-store.ts                     # Source implementation file
│   │   └── types                                   # Feature domain type definitions
│   ├── payments                                    # Feature Bounded Context: PAYMENTS
│   │   ├── components                              # Feature-specific UI components
│   │   │   └── payment-element.tsx                 # Source implementation file
│   │   ├── hooks                                   # Feature business logic hooks
│   │   │   └── use-payment-intent.ts               # Source implementation file
│   │   ├── index.ts                                # Feature Public API Gateway
│   │   ├── schemas                                 # Sub-directory
│   │   └── types                                   # Feature domain type definitions
│   │       └── payment.types.ts                    # Source implementation file
│   ├── products                                    # Feature Bounded Context: PRODUCTS
│   │   ├── README.md                               # Source implementation file
│   │   ├── api                                     # Feature data access layer
│   │   │   └── product-api.ts                      # Source implementation file
│   │   ├── auto-description.ts                     # Source implementation file
│   │   ├── category-templates.ts                   # Source implementation file
│   │   ├── components                              # Feature-specific UI components
│   │   │   ├── CategoryRequestModal.tsx            # Source implementation file
│   │   │   ├── CategorySection.tsx                 # Source implementation file
│   │   │   ├── FeaturedProductsSection.tsx         # Source implementation file
│   │   │   ├── FlashDealsSection.tsx               # Source implementation file
│   │   │   ├── ProductImageUploader.tsx            # Source implementation file
│   │   │   ├── USAGE_EXAMPLES.tsx                  # Source implementation file
│   │   │   ├── product-card.tsx                    # Source implementation file
│   │   │   ├── product-filters.client.example.tsx  # Source implementation file
│   │   │   ├── product-filters.client.tsx          # Source implementation file
│   │   │   ├── product-filters.tsx                 # Source implementation file
│   │   │   ├── product-grid.tsx                    # Source implementation file
│   │   │   ├── product-list-skeleton.tsx           # Source implementation file
│   │   │   ├── product-list.tsx                    # Source implementation file
│   │   │   └── product-price.tsx                   # Source implementation file
│   │   ├── constants.ts                            # Source implementation file
│   │   ├── contracts                               # Sub-directory
│   │   ├── hooks                                   # Feature business logic hooks
│   │   │   └── use-products.ts                     # Source implementation file
│   │   ├── index.ts                                # Feature Public API Gateway
│   │   ├── mappers                                 # Feature DTO transformation logic
│   │   │   └── backend-mapper.ts                   # Source implementation file
│   │   ├── product-create-error-taxonomy.ts        # Source implementation file
│   │   ├── query-keys.ts                           # Source implementation file
│   │   ├── schemas                                 # Sub-directory
│   │   ├── store                                   # Feature state management (Zustand)
│   │   │   └── products-store.ts                   # Source implementation file
│   │   └── types                                   # Feature domain type definitions
│   │       └── product.types.ts                    # Source implementation file
│   ├── reviews                                     # Feature Bounded Context: REVIEWS
│   │   ├── api                                     # Feature data access layer
│   │   │   └── reviews-api.ts                      # Source implementation file
│   │   ├── components                              # Feature-specific UI components
│   │   ├── hooks                                   # Feature business logic hooks
│   │   │   └── use-reviews.ts                      # Source implementation file
│   │   ├── index.ts                                # Feature Public API Gateway
│   │   └── types                                   # Feature domain type definitions
│   │       └── review.types.ts                     # Source implementation file
│   ├── seller                                      # Feature Bounded Context: SELLER
│   │   ├── api                                     # Feature data access layer
│   │   │   └── seller-api.ts                       # Source implementation file
│   │   ├── components                              # Feature-specific UI components
│   │   │   ├── AddProductForm.tsx                  # Source implementation file
│   │   │   ├── AddProductFormWrapper.tsx           # Source implementation file
│   │   │   ├── DashboardSkeleton.tsx               # Source implementation file
│   │   │   ├── FeaturedStoresSection.module.css    # Source implementation file
│   │   │   ├── FeaturedStoresSection.tsx           # Source implementation file
│   │   │   ├── ImageUploader.tsx                   # Source implementation file
│   │   │   ├── SellerGuard.tsx                     # Source implementation file
│   │   │   ├── SellerOnboardingStepper.tsx         # Source implementation file
│   │   │   ├── SellerRoleUpgradeForm.tsx           # Source implementation file
│   │   │   ├── SellerStatusView.tsx                # Source implementation file
│   │   │   ├── StatCard.tsx                        # Source implementation file
│   │   │   ├── StoreDetailsFields.tsx              # Source implementation file
│   │   │   ├── StoreProfileForm.tsx                # Source implementation file
│   │   │   ├── layout                              # Sub-directory
│   │   │   │   ├── header.tsx                      # Source implementation file
│   │   │   │   ├── sidebar.tsx                     # Source implementation file
│   │   │   │   └── user-nav.tsx                    # Source implementation file
│   │   │   └── steps                               # Sub-directory
│   │   │       ├── FinanceStep.tsx                 # Source implementation file
│   │   │       ├── IdentityStep.tsx                # Source implementation file
│   │   │       ├── KycStep.tsx                     # Source implementation file
│   │   │       ├── PermanentAddressStep.tsx        # Source implementation file
│   │   │       ├── PersonalInfoStep.tsx            # Source implementation file
│   │   │       ├── ProfileStep.tsx                 # Source implementation file
│   │   │       ├── StoreStep.tsx                   # Source implementation file
│   │   │       ├── TermsStep.tsx                   # Source implementation file
│   │   │       └── VerificationStep.tsx            # Source implementation file
│   │   ├── hooks                                   # Feature business logic hooks
│   │   │   ├── use-seller-dashboard.ts             # Source implementation file
│   │   │   ├── use-seller.ts                       # Source implementation file
│   │   │   ├── useAddProduct.ts                    # Source implementation file
│   │   │   ├── useSellerOnboarding.ts              # Source implementation file
│   │   │   └── useSellerProfileStatus.ts           # Source implementation file
│   │   ├── index.ts                                # Feature Public API Gateway
│   │   ├── schemas                                 # Sub-directory
│   │   ├── store                                   # Feature state management (Zustand)
│   │   ├── types                                   # Feature domain type definitions
│   │   │   └── index.ts                            # Feature Public API Gateway
│   │   └── utils                                   # Sub-directory
│   │       ├── auth.ts                             # Source implementation file
│   │       ├── storage.ts                          # Source implementation file
│   │       └── store-mappers.ts                    # Source implementation file
│   ├── shipping                                    # Feature Bounded Context: SHIPPING
│   │   ├── api                                     # Feature data access layer
│   │   ├── components                              # Feature-specific UI components
│   │   ├── hooks                                   # Feature business logic hooks
│   │   └── types                                   # Feature domain type definitions
│   ├── users                                       # Feature Bounded Context: USERS
│   │   ├── api                                     # Feature data access layer
│   │   │   └── user-api.ts                         # Source implementation file
│   │   ├── components                              # Feature-specific UI components
│   │   │   └── ProfileForm.tsx                     # Source implementation file
│   │   ├── schemas                                 # Sub-directory
│   │   └── types                                   # Feature domain type definitions
│   └── wishlist                                    # Feature Bounded Context: WISHLIST
│       ├── api                                     # Feature data access layer
│       │   └── wishlist-api.ts                     # Source implementation file
│       ├── components                              # Feature-specific UI components
│       ├── hooks                                   # Feature business logic hooks
│       │   ├── use-wishlist.ts                     # Source implementation file
│       │   └── useWishlistToggle.ts                # Source implementation file
│       ├── index.ts                                # Feature Public API Gateway
│       ├── store                                   # Feature state management (Zustand)
│       │   └── wishlist-store.ts                   # Source implementation file
│       └── types                                   # Feature domain type definitions
│           └── wishlist.types.ts                   # Source implementation file
├── instrumentation.ts                              # Source implementation file
├── jest.config.cjs                                 # Source implementation file
├── knip.json                                       # Source implementation file
├── lib                                             # Sub-directory
│   ├── auth                                        # Security & Identity management core
│   │   ├── core                                    # Sub-directory
│   │   │   ├── authConfig.ts                       # Source implementation file
│   │   │   ├── config.ts                           # Source implementation file
│   │   │   ├── env-config.ts                       # Source implementation file
│   │   │   ├── errors.ts                           # Source implementation file
│   │   │   └── types.ts                            # Source implementation file
│   │   ├── providers                               # Sub-directory
│   │   │   └── keycloak.ts                         # Source implementation file
│   │   ├── security                                # Sub-directory
│   │   │   ├── permissions.ts                      # Source implementation file
│   │   │   ├── pkce.ts                             # Source implementation file
│   │   │   └── validation.ts                       # Source implementation file
│   │   ├── tokens                                  # Sub-directory
│   │   │   ├── token-schemas.ts                    # Source implementation file
│   │   │   ├── token-service.ts                    # Source implementation file
│   │   │   └── tokens.ts                           # Source implementation file
│   │   └── utils                                   # Sub-directory
│   │       ├── auth-utils.ts                       # Source implementation file
│   │       └── client-logout.ts                    # Source implementation file
│   ├── auth-debug.ts                               # Source implementation file
│   ├── auth.ts                                     # Source implementation file
│   ├── config                                      # Sub-directory
│   │   ├── index.ts                                # Source implementation file
│   │   ├── navigation.ts                           # Source implementation file
│   │   ├── product-attributes.ts                   # Source implementation file
│   │   ├── site-defaults.ts                        # Source implementation file
│   │   ├── site-schema.ts                          # Source implementation file
│   │   ├── site.ts                                 # Source implementation file
│   │   └── social.ts                               # Source implementation file
│   ├── data                                        # Sub-directory
│   │   ├── fetch-helpers.ts                        # Source implementation file
│   │   └── query-config.ts                         # Source implementation file
│   ├── db                                          # Sub-directory
│   ├── errors                                      # Standardized error hierarchy (AppError)
│   │   ├── AppError.ts                             # Source implementation file
│   │   ├── auth-errors.ts                          # Source implementation file
│   │   ├── custom-errors.ts                        # Source implementation file
│   │   ├── error-handler.ts                        # Source implementation file
│   │   └── index.ts                                # Source implementation file
│   ├── fonts                                       # Sub-directory
│   │   └── index.ts                                # Source implementation file
│   ├── formatters.ts                               # Source implementation file
│   ├── hooks                                       # Sub-directory
│   │   ├── index.ts                                # Source implementation file
│   │   └── use-authenticated-fetch.ts              # Source implementation file
│   ├── http                                        # HTTP transport & client configuration
│   │   ├── fetch-client.ts                         # Source implementation file
│   │   └── http-client.ts                          # Source implementation file
│   ├── image                                       # Sub-directory
│   │   └── compression.ts                          # Source implementation file
│   ├── index.ts                                    # Source implementation file
│   ├── keycloak.ts                                 # Source implementation file
│   ├── observability                               # Logging, Tracing & Monitoring
│   │   ├── logger.ts                               # Source implementation file
│   │   ├── metrics.ts                              # Source implementation file
│   │   └── tracing.ts                              # Source implementation file
│   ├── payments                                    # Sub-directory
│   │   └── stripe-client.ts                        # Source implementation file
│   ├── performance                                 # Sub-directory
│   │   ├── code-splitting.tsx                      # Source implementation file
│   │   ├── index.ts                                # Source implementation file
│   │   └── monitoring.ts                           # Source implementation file
│   ├── phone.ts                                    # Source implementation file
│   ├── query                                       # TanStack Query infrastructure
│   │   ├── query-client.ts                         # Source implementation file
│   │   └── query-keys.ts                           # Source implementation file
│   ├── rate-limit.ts                               # Source implementation file
│   ├── realtime                                    # Sub-directory
│   │   └── websocket-client.ts                     # Source implementation file
│   ├── sanitize.ts                                 # Source implementation file
│   ├── search                                      # Sub-directory
│   ├── security                                    # Sub-directory
│   │   ├── audit.ts                                # Source implementation file
│   │   ├── crypto.ts                               # Source implementation file
│   │   ├── input-sanitizer.ts                      # Source implementation file
│   │   ├── rate-limiter.ts                         # Source implementation file
│   │   ├── token-storage.ts                        # Source implementation file
│   │   └── url-validator.ts                        # Source implementation file
│   ├── store                                       # Sub-directory
│   │   ├── settings-store.ts                       # Source implementation file
│   │   ├── store-helpers.ts                        # Source implementation file
│   │   └── ui-store.ts                             # Source implementation file
│   ├── types                                       # Sub-directory
│   │   └── product.ts                              # Source implementation file
│   ├── utils                                       # Sub-directory
│   │   ├── debounce.ts                             # Source implementation file
│   │   ├── index.ts                                # Source implementation file
│   │   ├── pagination.ts                           # Source implementation file
│   │   ├── security.ts                             # Source implementation file
│   │   └── token-utils.ts                          # Source implementation file
│   ├── utils.ts                                    # Source implementation file
│   ├── validation                                  # Sub-directory
│   │   ├── api-contract.ts                         # Source implementation file
│   │   ├── checkout.ts                             # Source implementation file
│   │   ├── env-validator.ts                        # Source implementation file
│   │   └── rules                                   # Sub-directory
│   │       └── rules                               # Sub-directory
│   │           └── checkout.ts                     # Source implementation file
│   ├── validation.ts                               # Source implementation file
│   └── validations                                 # Sub-directory
│       └── product.ts                              # Source implementation file
├── lighthouserc.json                               # Source implementation file
├── lint_results.json                               # Source implementation file
├── lint_results.txt                                # Source implementation file
├── next.config.js                                  # Source implementation file
├── package.json                                    # Source implementation file
├── playwright.config.ts                            # Source implementation file
├── postcss.config.js                               # Source implementation file
├── proxy.ts                                        # Source implementation file
├── public                                          # Sub-directory
│   ├── app-download.png                            # Source implementation file
│   ├── icon-192x192.png                            # Source implementation file
│   ├── icon-512x512.png                            # Source implementation file
│   ├── images                                      # Sub-directory
│   │   ├── hero-pattern.jpg                        # Source implementation file
│   │   ├── placeholder.svg                         # Source implementation file
│   │   ├── products                                # Sub-directory
│   │   │   ├── deal-1.svg                          # Source implementation file
│   │   │   ├── deal-2.svg                          # Source implementation file
│   │   │   ├── deal-3.svg                          # Source implementation file
│   │   │   └── deal-4.svg                          # Source implementation file
│   │   └── promo                                   # Sub-directory
│   │       ├── flagship.svg                        # Source implementation file
│   │       ├── hero-banner-1.svg                   # Source implementation file
│   │       ├── hero-banner-2.svg                   # Source implementation file
│   │       └── hero-banner-3.svg                   # Source implementation file
│   └── promo-banner.png                            # Source implementation file
├── schemas                                         # Sub-directory
│   ├── api-response.schema.ts                      # Source implementation file
│   ├── product-form.schema.ts                      # Source implementation file
│   ├── product.schema.ts                           # Source implementation file
│   ├── seller.schema.ts                            # Source implementation file
│   └── user.schema.ts                              # Source implementation file
├── scratch                                         # Sub-directory
├── scripts                                         # Sub-directory
│   ├── __tests__                                   # Sub-directory
│   │   └── generate-lucide-types.test.ts           # Source implementation file
│   ├── debug                                       # Sub-directory
│   │   ├── check.js                                # Source implementation file
│   │   ├── check_backend.js                        # Source implementation file
│   │   ├── check_proxy.js                          # Source implementation file
│   │   ├── cleanup_v1.js                           # Source implementation file
│   │   ├── find_errors.js                          # Source implementation file
│   │   ├── parse_css.js                            # Source implementation file
│   │   ├── parse_css2.js                           # Source implementation file
│   │   ├── test-api.js                             # Source implementation file
│   │   └── test-validation.js                      # Source implementation file
│   ├── generate-icons.js                           # Source implementation file
│   ├── generate-lucide-types.selftest.ts           # Source implementation file
│   ├── generate-lucide-types.ts                    # Source implementation file
│   ├── generate-structure-doc.js                   # Source implementation file
│   ├── refactor-imports.js                         # Source implementation file
│   ├── test-keycloak.ts                            # Source implementation file
│   ├── validate-env.ts                             # Source implementation file
│   └── verify-keycloak-setup.ts                    # Source implementation file
├── sentry.client.config.ts                         # Source implementation file
├── sentry.edge.config.ts                           # Source implementation file
├── sentry.server.config.ts                         # Source implementation file
├── shared                                          # Sub-directory
│   ├── analytics                                   # Sub-directory
│   │   └── hooks                                   # Shared domain hooks (multi-feature)
│   │       └── use-admin-dashboard.ts              # Source implementation file
│   ├── components                                  # Shared domain UI components
│   │   ├── AddressFields.tsx                       # Source implementation file
│   │   ├── ErrorFallback.tsx                       # Source implementation file
│   │   ├── FeatureHeader.tsx                       # Source implementation file
│   │   ├── FormActions.tsx                         # Source implementation file
│   │   ├── Map.tsx                                 # Source implementation file
│   │   ├── MapInner.tsx                            # Source implementation file
│   │   ├── ModernDatePicker.tsx                    # Source implementation file
│   │   ├── PremiumCard.tsx                         # Source implementation file
│   │   ├── StepInput.tsx                           # Source implementation file
│   │   ├── StepLayout.tsx                          # Source implementation file
│   │   └── index.ts                                # Source implementation file
│   ├── hooks                                       # Shared domain hooks (multi-feature)
│   │   ├── index.ts                                # Source implementation file
│   │   ├── use-app-integrations.ts                 # Source implementation file
│   │   ├── use-mounted.ts                          # Source implementation file
│   │   ├── use-performance.ts                      # Source implementation file
│   │   ├── use-settings-effect.ts                  # Source implementation file
│   │   └── use-sse.ts                              # Source implementation file
│   ├── types                                       # Sub-directory
│   └── utils                                       # Shared domain business logic
├── sw                                              # Sub-directory
│   └── index.ts                                    # Source implementation file
├── tailwind.config.ts                              # Source implementation file
├── tsconfig.eslint.json                            # Source implementation file
├── tsconfig.json                                   # Source implementation file
├── tsconfig.sw.json                                # Source implementation file
├── tsconfig.sw.tsbuildinfo                         # Source implementation file
├── tsconfig.tsbuildinfo                            # Source implementation file
└── types                                           # Sub-directory
    ├── api.ts                                      # Source implementation file
    ├── auth.ts                                     # Source implementation file
    ├── auth.types.ts                               # Source implementation file
    ├── cloudinary.d.ts                             # Source implementation file
    ├── dashboard.ts                                # Source implementation file
    ├── env-module.d.ts                             # Source implementation file
    ├── generated                                   # Sub-directory
    │   └── api.ts                                  # Source implementation file
    ├── global-upstash.d.ts                         # Source implementation file
    ├── global.d.ts                                 # Source implementation file
    ├── index.d.ts                                  # Source implementation file
    ├── index.ts                                    # Source implementation file
    ├── isomorphic-dompurify.d.ts                   # Source implementation file
    ├── jose.d.ts                                   # Source implementation file
    ├── location.ts                                 # Source implementation file
    ├── lucide-icons.d.ts                           # Source implementation file
    ├── lucide-react.d.ts                           # Source implementation file
    ├── next-auth.d.ts                              # Source implementation file
    ├── product.ts                                  # Source implementation file
    ├── settings.ts                                 # Source implementation file
    ├── shims-external.d.ts                         # Source implementation file
    ├── shims-stripe.d.ts                           # Source implementation file
    ├── upstash-ratelimit.d.ts                      # Source implementation file
    └── upstash-redis.d.ts                          # Source implementation file
```
