const { execSync } = require('child_process');

const org = process.env.SENTRY_ORG;
const project = process.env.SENTRY_PROJECT;
const token = process.env.SENTRY_AUTH_TOKEN || process.env.SENTRY_TOKEN;
const version = process.env.npm_package_version;
const env = process.env.DEPLOY_ENV || 'production';

if (!org || !project || !token || token.includes('YOUR_AUTH_TOKEN') || org.includes('your-org')) {
  console.log('ℹ️ Sentry credentials not configured. Skipping Sentry deploy notification.');
  process.exit(0);
}

try {
  console.log(`🚀 Sending Sentry deploy notification for release ${version} to ${env}...`);
  execSync(`sentry-cli releases deploys ${version} new -e ${env}`, { stdio: 'inherit' });
  console.log('✅ Sentry deploy notification sent.');
} catch (error) {
  console.warn('⚠️ Sentry deploy notification failed:', error.message);
}
