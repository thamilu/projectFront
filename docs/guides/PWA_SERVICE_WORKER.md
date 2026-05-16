# PWA & Service Worker Infrastructure

This guide documents the enterprise Service Worker implementation for offline resilience, background synchronization, and push notifications.

## 🏗️ Architecture
The service worker is authored in TypeScript to ensure type safety for IndexedDB operations and push events.

- **Source**: `sw/service-worker.ts`
- **TypeScript Config**: `tsconfig.sw.json`
- **Output**: `public/service-worker.js` (Compiled artifact, Gitignored)

## 🛠️ Build Workflow
**DO NOT edit `/public/service-worker.js` directly!** Changes must be made in the TypeScript source.

```bash
# Compile service worker only
npm run build:sw

# Full production build (Includes build:sw)
npm run build
```

## 🔐 Registration Logic
The service worker is registered at the application root (`app/providers.tsx` or similar):

```typescript
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js');
  });
}
```

## ✨ Hardened Features
- **IndexedDB Orchestration**: Uses `idb-keyval` for resilient offline data storage.
- **Caching Strategy**: 
  - **Network-First**: For HTML/Content to ensure data freshness.
  - **Cache-First**: For static assets (images, fonts) to maximize performance.
- **Background Sync**: Automated retry logic for failed mutations during offline periods.
- **Push Notifications**: Integrated Keycloak-aware notification delivery.
- **Security**: Strict exclusion of sensitive `/api/auth` routes from caching.
