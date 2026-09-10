const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Route-based budgets (more meaningful than chunk budgets)
const BUDGETS = {
  '/': { maxSize: 300 * 1024, maxGzip: 100 * 1024 },
  '/stores': { maxSize: 350 * 1024, maxGzip: 120 * 1024 },
  '/admin/dashboard': { maxSize: 500 * 1024, maxGzip: 180 * 1024 },
};

const manifestPath = path.join(process.cwd(), '.next/build-manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('❌ Build manifest not found. Please run next build first.');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

let failed = false;

for (const [route, budget] of Object.entries(BUDGETS)) {
  const files = manifest.pages[route] || [];
  let totalSize = 0;
  let totalGzipSize = 0;

  for (const file of files) {
    const filePath = path.join(process.cwd(), '.next', file);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath);
    totalSize += content.length;
    totalGzipSize += zlib.gzipSync(content).length;
  }

  const sizeLimitOk = totalSize <= budget.maxSize;
  const gzipLimitOk = totalGzipSize <= budget.maxGzip;

  const status = (sizeLimitOk && gzipLimitOk) ? '✅' : '❌';
  console.log(
    `${status} Route "${route}": ` +
    `Raw: ${(totalSize / 1024).toFixed(1)}KB / ${(budget.maxSize / 1024).toFixed(1)}KB, ` +
    `Gzip: ${(totalGzipSize / 1024).toFixed(1)}KB / ${(budget.maxGzip / 1024).toFixed(1)}KB`
  );

  if (!sizeLimitOk || !gzipLimitOk) {
    failed = true;
  }
}

if (failed) {
  console.error('\n❌ Bundle budget exceeded!');
  process.exit(1);
}

console.log('\n✅ All bundle budgets OK!');
process.exit(0);
