const fs = require('fs');
const path = require('path');

const REPLACEMENTS = [
  // Core Platform Promotion
  { from: /@\/lib\/auth/g, to: '@/core/auth' },
  { from: /@\/lib\/http/g, to: '@/core/api' },
  { from: /@\/lib\/observability/g, to: '@/core/telemetry' },
  { from: /@\/lib\/query/g, to: '@/core/cache' },
  { from: /@\/lib\/config/g, to: '@/core/config' },
  { from: /@\/lib\/errors/g, to: '@/core/api/errors' },

  // Infrastructure Promotion
  { from: /@\/lib\/db/g, to: '@/infrastructure/db' },
  { from: /@\/lib\/image/g, to: '@/infrastructure/image' },
  { from: /@\/lib\/payments/g, to: '@/infrastructure/payments' },
  { from: /@\/lib\/search/g, to: '@/infrastructure/search' },

  // Shared Logic & UI
  { from: /@\/lib\/hooks/g, to: '@/shared/hooks' },
  { from: /@\/lib\/utils/g, to: '@/shared/utils' },
  { from: /@\/lib\/store/g, to: '@/shared/store' },
  { from: /@\/lib\/fonts/g, to: '@/shared/fonts' },
  { from: /@\/types/g, to: '@/shared/types' },
  { from: /@\/schemas/g, to: '@/shared/schemas' },
  { from: /@\/constants/g, to: '@/shared/constants' },

  // UI Taxonomy
  { from: /@\/components\/ui/g, to: '@/shared/ui/atoms' },
  { from: /@\/components\/layout/g, to: '@/shared/ui/layout' },
  { from: /@\/components\/error-boundary/g, to: '@/shared/ui/feedback' },
  { from: /@\/components\/providers/g, to: '@/core/providers' },
  { from: /@\/components\/Seo/g, to: '@/shared/ui/layout/Seo' },
  { from: /@\/components\/icons/g, to: '@/shared/ui/atoms/icons' },
  { from: /@\/components\/common/g, to: '@/shared/ui/common' },
  { from: /@\/components\/home/g, to: '@/features/home/components' },
  { from: /@\/components\/auth/g, to: '@/features/auth/components' },
  { from: /@\/components\/search/g, to: '@/features/search/components' },
  { from: /@\/components\/settings/g, to: '@/features/settings/components' },
  { from: /@\/components\/store/g, to: '@/features/seller/components' },
  { from: /@\/components\/navigation/g, to: '@/shared/ui/layout/navigation' },
  { from: /@\/components\/theme-toggle/g, to: '@/shared/ui/layout/theme-toggle' },
  { from: /@\/components\/R2ImageUploader/g, to: '@/shared/ui/forms/R2ImageUploader' },
  { from: /@\/components\/NextAuthProvider/g, to: '@/core/providers/NextAuthProvider' },

  // Cleanup potential leftover root auth
  { from: /from '@\/auth'/g, to: "from '@/core/auth'" },
  { from: /from "@\/auth"/g, to: 'from "@/core/auth"' }
];

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach( f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (!['node_modules', '.next', '.git'].includes(f)) {
        walk(dirPath, callback);
      }
    } else {
      if (['.ts', '.tsx', '.css'].includes(path.extname(f))) {
        callback(dirPath);
      }
    }
  });
};

console.log('🚀 Starting elite architectural refactor of imports...');

walk('.', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  REPLACEMENTS.forEach(rep => {
    content = content.replace(rep.from, rep.to);
  });
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  }
});

console.log('✨ Refactor complete.');
