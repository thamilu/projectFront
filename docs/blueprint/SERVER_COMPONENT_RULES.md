# Next.js Server Component Governance [HARDEN]

## Overview

To leverage the full power of the App Router and streaming SSR, we enforce strict rules on the separation of Server and Client components.

## 1. Data Fetching (Server-First)

- **Rule**: All data fetching SHOULD occur in Server Components.
- **Why**: Reduces client-side bundle size, hides sensitive API endpoints, and improves time-to-interactive (TTI).
- **Exception**: Client-side searching/filtering or "live" updates where `react-query` is necessary.

## 2. Component Composition

- **Rule**: Pass Client Components as `children` or `props` to Server Components to keep the server tree intact.
- **Why**: Prevents the "Client Component Leakage" where a parent `use client` forces all descendants to be client components.

## 3. Secret Isolation

- **Rule**: Never import files containing `process.env` (server-side secrets) into Client Components.
- **Enforcement**: Use the `server-only` package in modules that touch secrets.

## 4. State Management

- **Rule**: Avoid using global Client Contexts (Zustand/Context API) for data that can be passed via Props.
- **Why**: Props are serializable and compatible with Server Components.

## 5. Directory Mapping

- **.server.ts**: Explicitly for server-only logic/components.
- **.client.ts**: Explicitly for client-only logic/components.
