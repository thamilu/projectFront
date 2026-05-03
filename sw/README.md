# Service Worker Source

**DO NOT edit `/public/service-worker.js` directly!**

The service worker is written in TypeScript at:
```
src/sw/service-worker.ts
```

## Building

The TypeScript source is automatically compiled to `public/service-worker.js` during the build:

```bash
npm run build:sw    # Compile service worker only
npm run build       # Runs build:sw + next build
```

## Configuration

- **TypeScript config**: `tsconfig.sw.json`
- **Output**: `public/service-worker.js` (gitignored)
- **Source**: `src/sw/service-worker.ts`

## Registration

The service worker is registered in your app's initialization code. Make sure to update the registration path if needed:

```typescript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}
```

## Features

- ✅ IndexedDB storage (idb-keyval) for offline data
- ✅ Network-first caching for HTML
- ✅ Cache-first for static assets
- ✅ Never caches API routes
- ✅ Background sync with retry logic
- ✅ Push notifications
- ✅ Authenticated sync requests
