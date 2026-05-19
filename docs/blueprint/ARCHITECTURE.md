# Enterprise Architecture Blueprint: E-Shop Frontend

This document outlines the architectural standards and patterns used in the E-Shop frontend (Next.js 16).

## 🏗️ Core Architecture: Next.js 16 + React 19

The project follows a **Modular, Layered Architecture** designed for high scalability and enterprise-grade maintainability.

### 1. Route Group Isolation (`app/`)
The `app/` directory is organized into **Route Groups** to isolate business domains and layouts.
- **`(public)`**: Open access routes (Products, Home, About).
- **`(auth)`**: Authentication flows (NextAuth / Keycloak).
- **`(customer)`**: Protected customer features (Orders, Cart).
- **`(seller)`**: Business management (Dashboard, Product Creation).
- **`(delivery)`**: Logistics and fulfillment.
- **`(admin)`**: System administration.

### 2. Service Layer Pattern (`services/`)
To adhere to the **DRY Principle** and **Clear Layering**, all business logic and API orchestration is extracted into dedicated services.
- **Thin Components**: JSX only handles rendering and local UI state.
- **Service Orchestration**: Services handle data fetching, error normalization, and caching.
- **Registry**: `services/index.ts` provides a single entry point for all feature services.

### 3. Feature-Based Modularity (`features/`)
Complex features are isolated into the `features/` directory, containing:
- `components/`: Feature-specific UI.
- `hooks/`: Feature-specific state and service integration.
- `types/`: Domain-specific type definitions.
- `schemas/`: Zod validation schemas.

## 🔄 Data Flow
1. **Component** calls a **Hook**.
2. **Hook** calls a **Service**.
3. **Service** calls the **API Client** (`lib/axios.ts`).
4. **API Client** returns data or throws a normalized **AppError**.

## 🎨 Styling & Design
- **Tailwind CSS 4**: Utility-first styling with design tokens in `app/globals.css`.
- **shadcn/ui**: Accessible Radix-based primitives.
- **Dark Mode**: Native support via `next-themes`.

---

## 🏗️ Layer Boundaries: Core vs Shared

To enforce strict separation of concerns and prevent circular or leaking dependencies, the application strictly distinguishes between the **Core** and **Shared** layers.

### 🛡️ Core Layer (`core/`)
- **Purpose**: Low-level system configurations, global HTTP adapters, security proxies, auth session bridging, logger adapters, and telemetry integrations.
- **Constraints**:
  - **Visual-free**: Core contains absolutely no UI, visual rendering, or style rules.
  - **No Outward Dependencies**: Core **MUST NOT** import any code from `shared/`, `features/`, or `app/` modules.
  - **Direct Consumption**: Core utilities can be imported directly by any other layer (features, pages, or shared hooks).

### 🧩 Shared Layer (`shared/`)
- **Purpose**: Domain-agnostic UI kit components (buttons, cards, grids), shared hooks (useMounted, usePerformance), shared types, validation schemas, and constants.
- **Constraints**:
  - **Domain-agnostic**: Shared modules cannot contain domain-specific business rules or business-specific logic.
  - **Features Dependency Forbidden**: Shared modules **MUST NOT** import from `features/` or `app/` modules.
  - **Import Hierarchy**: Shared code can import from `core/` to access base system facilities.

