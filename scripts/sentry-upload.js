const { execSync } = require('child_process');

const org = process.env.SENTRY_ORG;
const project = process.env.SENTRY_PROJECT;
const token = process.env.SENTRY_AUTH_TOKEN || process.env.SENTRY_TOKEN;
const version = process.env.npm_package_version;

if (!org || !project || !token || token.includes('YOUR_AUTH_TOKEN') || org.includes('your-org')) {
  console.log('ℹ️ Sentry credentials not configured. Skipping Sentry release tracking.');
  process.exit(0);
}

try {
  console.log(`🚀 Creating Sentry release ${version}...`);
  execSync(`sentry-cli releases new ${version}`, { stdio: 'inherit' });
  execSync(`sentry-cli releases set-commits ${version} --auto`, { stdio: 'inherit' });
  
  console.log('🚀 Uploading sourcemaps to Sentry...');
  execSync(`sentry-cli sourcemaps upload --org=${org} --project=${project} .next`, { stdio: 'inherit' });
  
  console.log('🚀 Finalizing Sentry release...');
  execSync(`sentry-cli releases finalize ${version}`, { stdio: 'inherit' });
  console.log('✅ Sentry release and sourcemaps upload completed.');
} catch (error) {
  console.warn('⚠️ Sentry release tracking failed but will not block the build:', error.message);
}
