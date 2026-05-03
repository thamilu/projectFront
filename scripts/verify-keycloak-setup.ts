#!/usr/bin/env node
/*
 * scripts/verify-keycloak-setup.ts
 *
 * Improved Keycloak Authentication Test Script (TypeScript)
 * - Validates presence of key frontend directories/files
 * - Validates required env vars via process.env (works in CI)
 * - Performs basic URL validation for URL-shaped vars
 * - Supports `--ci` flag (concise output) and `--json` for machine-readable results
 *
 * Note: This script performs presence and basic value validation only.
 * It does not guarantee runtime wiring, correct exports, or backend availability.
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

type Result = {
  ok: boolean;
  missingFiles: string[];
  missingEnv: string[];
  invalidEnv: string[];
};

const argv = process.argv.slice(2);
const isCi = argv.includes('--ci');
const outJson = argv.includes('--json');
const failFast = argv.includes('--fail-fast');

const REQUIRED_DIRS = [
  'hooks',
  'components/auth',
  'app/login',
];

const REQUIRED_FILES = [
  'lib/axios.ts',
  'lib/auth/config.ts',
  'lib/auth/pkce.ts',
  'lib/auth/session.ts',
  'app/api/auth/keycloak/callback/route.ts',
];

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_API_BASE_URL',
  'NEXT_PUBLIC_API_AUTH_URL',
  'NEXT_PUBLIC_KEYCLOAK_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_ENABLE_OAUTH',
];

const URL_ENV_VARS = ['NEXT_PUBLIC_API_BASE_URL', 'NEXT_PUBLIC_KEYCLOAK_URL', 'NEXT_PUBLIC_APP_URL', 'NEXTAUTH_URL'];

function log(msg: string) {
  if (isCi) {
    console.log(msg.replace(/✅|❌|🔍|📁|🔐/g, '').trim());
  } else {
    console.log(msg);
  }
}

function exitWithCode(code: number): never {
  process.exit(code);
}

function checkExists(p: string): boolean {
  try {
    return fs.existsSync(path.join(process.cwd(), p));
  } catch {
    return false;
  }
}

function validateUrlEnv(name: string, val: string | undefined): boolean {
  if (!val) return false;
  try {
    const u = new URL(val);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

async function run(): Promise<Result> {
  const missingFiles: string[] = [];
  const missingEnv: string[] = [];
  const invalidEnv: string[] = [];

  log('🔍 Verifying Keycloak Authentication Setup...');

  // Check directories
  log('📁 Checking required directories...');
  for (const d of REQUIRED_DIRS) {
    if (checkExists(d)) {
      log(`✅ ${d}`);
    } else {
      log(`❌ ${d} - MISSING`);
      missingFiles.push(d);
      if (failFast) return { ok: false, missingFiles, missingEnv, invalidEnv };
    }
  }

  // Check files
  log('\n📁 Checking required files...');
  for (const f of REQUIRED_FILES) {
    if (checkExists(f)) {
      log(`✅ ${f}`);
    } else {
      log(`❌ ${f} - MISSING`);
      missingFiles.push(f);
      if (failFast) return { ok: false, missingFiles, missingEnv, invalidEnv };
    }
  }

  // Static export checks for critical modules
  log('\n🔎 Validating module exports (static checks)...');
  const exportChecks: Record<string, string[]> = {
    'lib/auth/pkce.ts': ['generatePKCEChallenge', 'buildAuthorizationUrl'],
    'lib/auth/session.ts': ['storePkceState', 'retrievePkceState', 'clearPkceState'],
    'lib/auth/config.ts': ['loadAuthConfig', 'getAuthorizationEndpoint'],
    'lib/auth/tokens.ts': ['validateIdToken'],
  };

  for (const [modPath, names] of Object.entries(exportChecks)) {
    const abs = path.join(process.cwd(), modPath);
    try {
      const modUrl = pathToFileURL(abs).href;
      const mod = await import(modUrl);
      for (const n of names) {
        if (typeof (mod as any)[n] === 'function' || typeof (mod as any)[n] === 'object') {
          log(`✅ ${modPath} exports ${n}`);
        } else {
          log(`❌ ${modPath} missing export ${n}`);
          missingFiles.push(`${modPath} -> export ${n}`);
          if (failFast) return { ok: false, missingFiles, missingEnv, invalidEnv };
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log(`❌ Failed importing ${modPath}: ${msg}`);
      missingFiles.push(`${modPath} -> import failed`);
      if (failFast) return { ok: false, missingFiles, missingEnv, invalidEnv };
    }
  }

  // Check env via process.env (works in CI and local)
  log('\n🔐 Checking environment variables...');
  for (const name of REQUIRED_ENV_VARS) {
    const val = process.env[name];
    if (val && val.trim().length > 0) {
      // If this is URL-shaped, validate
      if (URL_ENV_VARS.includes(name)) {
        if (validateUrlEnv(name, val)) {
          log(`✅ ${name}`);
        } else {
          log(`❌ ${name} - INVALID URL`);
          invalidEnv.push(name);
          if (failFast) return { ok: false, missingFiles, missingEnv, invalidEnv };
        }
      } else {
        log(`✅ ${name}`);
      }
    } else {
      log(`❌ ${name} - MISSING or EMPTY`);
      missingEnv.push(name);
      if (failFast) return { ok: false, missingFiles, missingEnv, invalidEnv };
    }
  }

  // Provide Keycloak guidance
  if (process.env.NEXT_PUBLIC_KEYCLOAK_URL) {
    try {
      const base = new URL(process.env.NEXT_PUBLIC_KEYCLOAK_URL).origin;
      log(`\n[info] Keycloak base URL: ${base}`);
      if (process.env.NEXT_PUBLIC_APP_URL && validateUrlEnv('NEXT_PUBLIC_APP_URL', process.env.NEXT_PUBLIC_APP_URL)) {
        log(`[info] Ensure Keycloak Valid Redirect URIs contain: ${new URL(process.env.NEXT_PUBLIC_APP_URL).origin}`);
      }
    } catch {
      // ignore
    }
  }

  const ok = missingFiles.length === 0 && missingEnv.length === 0 && invalidEnv.length === 0;
  return { ok, missingFiles, missingEnv, invalidEnv };
}

run().then(result => {
  console.log('\n' + '='.repeat(50));
  if (outJson) {
    console.log(JSON.stringify(result));
  }
  if (result.ok) {
    log('✅ All checks passed! Keycloak authentication is properly set up.');
    if (!isCi) {
      log('\n📝 Next steps:');
      log('1. Start your backend API on port 8082 (if applicable)');
      log('2. Run: npm run dev');
      log('3. Visit: http://localhost:3000/login');
      log('4. Test login with your credentials');
    }
    exitWithCode(0);
  }

  log(`❌ Found ${result.missingFiles.length + result.missingEnv.length + result.invalidEnv.length} missing/invalid items.`);
  exitWithCode(1);
}).catch(err => {
  console.error('[verify] Unexpected error:', err);
  process.exit(2);
});
