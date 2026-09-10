# Rendering Governance Standards

Welcome to the rendering standards for E-Shop's ultra-enterprise frontend platform. This document enforces rules regarding **React Server Components (RSC)**, **Client Components (RCC)**, and caching strategies in our Next.js App Router workspace.

---

## 🏛️ Architecture Rules

Every page layout should prioritize **Server-First** design:

1. **Server Components by Default**: All components are Server Components unless dynamic client-side interactions are needed.
2. **Orchestration only at Page-Level**: `page.tsx` files must be lightweight orchestrators that handle SSR data fetching and hydration boundary creation.
3. **Client Boundaries**: Keep client boundaries (`"use client"`) as deep/low in the component tree as possible (e.g., individual buttons, forms, or slide-outs) to minimize dynamic hydration overhead.

---

## ⚡ Server Components (RSC) vs Client Components (RCC)

| Criteria           | Server Component (RSC)                                   | Client Component (RCC)                        |
| ------------------ | -------------------------------------------------------- | --------------------------------------------- |
| **Default**        | Yes                                                      | Explicitly defined with `"use client"`        |
| **Data Fetching**  | Direct database or fetch from secure backend             | React Query hooks (`useQuery`, `useMutation`) |
| **Secrets Access** | Safe to read `process.env` and database credentials      | Restricted to public environment variables    |
| **Interactivity**  | No events (`onClick`, `onChange`), no client state/hooks | Full use of state, effects, browser APIs      |
| **Bundle Cost**    | 0kb added to client JavaScript bundle                    | Added to client bundle; subject to budgets    |

---

## 🛡️ Edge Caching & Incremental Static Regeneration (ISR)

1. **Static Pre-Rendering (SSG)**: Catalog index pages, generic brand listings, and static FAQs must use static generation with high revalidation durations (e.g. `revalidate = 3600`).
2. **Streaming and Suspense**: Use React `<Suspense>` at logical block boundaries (e.g., `<SellerReviewsSkeleton />`) to support streaming SSR and progressive page hydration.
3. **Segment Cache Policies**: Do not use dynamic routes without defining robust dynamic-route parameters or fallback policies using Next.js caching.
