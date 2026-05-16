const fs = require('fs');
const path = require('path');

const REPLACEMENTS = [
  // Products consolidation
  { from: /@\/features\/product(?!\w)/g, to: '@/features/products' },
  { from: /@\/components\/products/g, to: '@/features/products/components' },
  { from: /@\/lib\/product/g, to: '@/features/products' },
  
  // Store consolidation
  { from: /@\/store\/analytics-store/g, to: '@/features/analytics/store/analytics-store' },
  { from: /@\/store\/auth-store/g, to: '@/features/auth/store/auth-store' },
  { from: /@\/store\/cart-store/g, to: '@/features/cart/store/cart-store' },
  { from: /@\/store\/notification-store/g, to: '@/features/notifications/store/notification-store' },
  { from: /@\/store\/orders-store/g, to: '@/features/orders/store/orders-store' },
  { from: /@\/store\/products-store/g, to: '@/features/products/store/products-store' },
  { from: /@\/store\/wishlist-store/g, to: '@/features/wishlist/store/wishlist-store' },
  { from: /@\/store\/ui-store/g, to: '@/lib/store/ui-store' },
  { from: /@\/store\/settings-store/g, to: '@/lib/store/settings-store' },

  // Hooks refactoring
  { from: /@\/hooks\/useWishlistToggle/g, to: '@/features/wishlist/hooks/useWishlistToggle' },
  { from: /@\/hooks\/use-locations/g, to: '@/features/locations/hooks/use-locations' },
  { from: /@\/hooks\/use-admin-dashboard/g, to: '@/features/seller/hooks/use-admin-dashboard' },
  { from: /@\/hooks\/use-permissions/g, to: '@/features/auth/hooks/use-permissions' },
  { from: /@\/hooks\/seller/g, to: '@/features/seller/hooks' },
  
  // Move remaining hooks to lib/hooks or shared/hooks
  { from: /@\/hooks\/use-mounted/g, to: '@/shared/hooks/use-mounted' },
  { from: /@\/hooks\/use-performance/g, to: '@/shared/hooks/use-performance' },
  { from: /@\/hooks\/use-app-integrations/g, to: '@/shared/hooks/use-app-integrations' },
  { from: /@\/hooks\/(?!shared|queries|seller)/g, to: '@/lib/hooks/' },
  { from: /@\/lib\/hooks\/(\w+)/g, to: '@/lib/hooks/$1' }, // Cleanup potential double lib/hooks
  { from: /@\/hooks\/queries/g, to: '@/lib/hooks/queries' },
  
  // API standardization
  { from: /@\/lib\/api\/client/g, to: '@/lib/http/http-client' },
  { from: /@\/lib\/api\/axios/g, to: '@/lib/http/http-client' },
  { from: /@\/lib\/api/g, to: '@/lib/http/http-client' },
  { from: /@\/lib\/axios/g, to: '@/lib/http/http-client' },
  
  // Cleanup potential double slashes or extensions
  { from: /@\/lib\/http\/http-client.ts/g, to: '@/lib/http/http-client' },
];

function walk(dir, callback) {
  fs.readdirSync(dir).forEach( f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (!['node_modules', '.next', '.git'].includes(f)) {
        walk(dirPath, callback);
      }
    } else {
      if (['.ts', '.tsx'].includes(path.extname(f))) {
        callback(dirPath);
      }
    }
  });
};

walk('.', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  REPLACEMENTS.forEach(rep => {
    content = content.replace(rep.from, rep.to);
  });
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
});
