const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * Robust zero-dependency glob scanner
 */
function scanFiles(pattern) {
  const parts = pattern.split('/');
  const baseDir = parts.slice(0, 3).join('/'); // Scan under .next/static/chunks
  
  // Convert glob-like pattern to a regex
  const regexStr = '^' + pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*') + '$';
  const regex = new RegExp(regexStr);

  const results = [];
  function recurse(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const normalizedPath = fullPath.replace(/\\/g, '/');
      if (entry.isDirectory()) {
        recurse(fullPath);
      } else if (entry.isFile() && regex.test(normalizedPath)) {
        results.push(fullPath);
      }
    }
  }

  recurse(baseDir);
  return results;
}

const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const budgets = packageJson.bundlesize;

if (!budgets || !Array.isArray(budgets)) {
  console.log('✅ No bundle size budgets configured in package.json.');
  process.exit(0);
}

console.log('📊 Enforcing Bundle Budgets & Performance Gates...');
let failed = false;

for (const budget of budgets) {
  const pattern = budget.path;
  const rawLimit = budget.maxSize;
  
  const limitBytes = parseInt(rawLimit, 10) * (rawLimit.toLowerCase().includes('kb') ? 1024 : 1);
  const files = scanFiles(pattern);
  
  if (files.length === 0) {
    console.warn(`⚠️ Warning: No files matched budget pattern "${pattern}"`);
    continue;
  }
  
  for (const file of files) {
    const content = fs.readFileSync(file);
    // Measure actual gzipped size to reflect real-world network payload size
    const gzipped = zlib.gzipSync(content);
    const sizeKb = (gzipped.length / 1024).toFixed(2);
    const limitKb = (limitBytes / 1024).toFixed(2);
    
    if (gzipped.length > limitBytes) {
      console.error(`❌ [BUDGET EXCEEDED] ${path.basename(file)}: ${sizeKb} KB (Limit: ${limitKb} KB)`);
      failed = true;
    } else {
      console.log(`✅ [BUDGET PASS] ${path.basename(file)}: ${sizeKb} KB (Limit: ${limitKb} KB)`);
    }
  }
}

if (failed) {
  console.error('\n🚨 One or more bundle budgets exceeded! Blocking CI build.');
  process.exit(1);
} else {
  console.log('\n🎉 All bundle budgets passed successfully!');
  process.exit(0);
}
