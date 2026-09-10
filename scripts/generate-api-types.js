const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const isCheck = process.argv.includes('--check');
const isOffline = process.argv.includes('--offline');

// Paths config
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_API_TS = path.resolve(ROOT_DIR, 'shared/types/generated/api.ts');
const OUTPUT_ZOD_TS = path.resolve(ROOT_DIR, 'shared/types/generated/zod-schemas.ts');
const OUTPUT_OPENAPI_JSON = path.resolve(ROOT_DIR, 'shared/types/generated/openapi.json');
const TEMP_SPEC_JSON = path.resolve(ROOT_DIR, 'shared/types/generated/openapi-temp-spec.json');
const TEMP_ZOD_TS = path.resolve(ROOT_DIR, 'shared/types/generated/zod-schemas-temp.ts');

function getBackendUrl() {
  if (process.env.BACKEND_API_URL) return process.env.BACKEND_API_URL;
  if (process.env.NEXT_PUBLIC_API_BASE_URL) return process.env.NEXT_PUBLIC_API_BASE_URL;

  // Try reading from .env.local and .env
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const filePath = path.resolve(ROOT_DIR, file);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const match = content.match(/^BACKEND_API_URL\s*=\s*(.*)$/m) ||
                      content.match(/^NEXT_PUBLIC_API_BASE_URL\s*=\s*(.*)$/m);
        if (match && match[1]) {
          return match[1].trim();
        }
      } catch (e) {
        // Ignored
      }
    }
  }
  return 'http://localhost:8082'; // fallback
}

const backendUrl = getBackendUrl();
const openapiEndpoint = `${backendUrl}/v3/api-docs`;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch OpenAPI JSON. Status: ${res.statusCode}`));
        return;
      }
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          resolve(parsedData);
        } catch (e) {
          reject(new Error(`Failed to parse response as JSON: ${e.message}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function sanitizeSpec(obj, path = 'root') {
  if (!obj || typeof obj !== 'object') return;

  // If it's a schema object and has both enum and pattern, remove pattern
  if (obj.enum && obj.pattern) {
    console.log(`🧹 Removing redundant pattern constraint from enum at ${path}`);
    delete obj.pattern;
  }

  // Clean Java inline modifiers in patterns to prevent JS regex compile failures
  if (typeof obj.pattern === 'string' && obj.pattern.includes('(?i)')) {
    console.log(`🧹 Fixing Java-specific (?i) modifier in pattern at ${path}`);
    obj.pattern = obj.pattern.replace(/\(\?i\)/g, '');
  }

  // Recursively process all properties/keys
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const child = obj[key];
      if (child && typeof child === 'object') {
        sanitizeSpec(child, `${path}.${key}`);
      }
    }
  }
}

async function main() {
  let spec;
  if (isOffline) {
    console.log(`📡 Offline mode: Reading local OpenAPI spec from: ${OUTPUT_OPENAPI_JSON}`);
    try {
      if (!fs.existsSync(OUTPUT_OPENAPI_JSON)) {
        throw new Error(`Local spec file not found at ${OUTPUT_OPENAPI_JSON}`);
      }
      spec = JSON.parse(fs.readFileSync(OUTPUT_OPENAPI_JSON, 'utf8'));
    } catch (err) {
      console.error(`❌ Error reading local OpenAPI spec: ${err.message}`);
      process.exit(1);
    }
  } else {
    console.log(`📡 Fetching OpenAPI specifications from: ${openapiEndpoint}`);
    try {
      spec = await fetchJson(openapiEndpoint);
    } catch (err) {
      console.error(`❌ Error fetching OpenAPI schema from backend: ${err.message}`);
      console.error('Make sure the backend Spring Boot server is running on port 8082.');
      console.error('Or use "--offline" flag to generate/check against the committed local openapi.json file.');
      process.exit(1);
    }
  }

  const backendVersion = spec.info?.version || 'unknown';
  const backendTitle = spec.info?.title || 'E-Shop Backend API';
  const openapiSpecVersion = spec.openapi || '3.x';

  // Sanitize the OpenAPI specification before passing to code generators
  sanitizeSpec(spec);

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_API_TS);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save temp spec JSON file for openapi-typescript and openapi-zod-client command inputs
  fs.writeFileSync(TEMP_SPEC_JSON, JSON.stringify(spec, null, 2));

  console.log(`🚀 Found OpenAPI spec version ${openapiSpecVersion} (API Version: ${backendVersion})`);
  console.log('🔄 Running generator...');

  try {
    // 1. Run openapi-typescript
    console.log(' - Generating TypeScript interfaces...');
    const apiTsContent = execSync(`npx openapi-typescript "${TEMP_SPEC_JSON}"`, {
      encoding: 'utf8',
      cwd: ROOT_DIR,
      stdio: ['pipe', 'pipe', 'inherit'],
    });

    const currentDate = new Date().toISOString().split('T')[0];
    const lintSuppression = `/* eslint-disable */\n/* tslint:disable */\n/* prettier-ignore */\n`;
    
    const apiTsHeader = `${lintSuppression}/**
 * AUTO-GENERATED FILE - DO NOT MODIFY.
 *
 * Source Spec: ${openapiEndpoint}
 * Spec Version: ${openapiSpecVersion}
 * Backend Title: ${backendTitle}
 * Backend Version: ${backendVersion}
 * Generated at: ${currentDate}
 * Generator: openapi-typescript
 */\n\n`;

    const finalApiTsContent = apiTsHeader + apiTsContent;

    // 2. Run openapi-zod-client
    console.log(' - Generating Zod runtime validation schemas...');
    execSync(`npx openapi-zod-client "${TEMP_SPEC_JSON}" -o "${TEMP_ZOD_TS}"`, {
      cwd: ROOT_DIR,
      stdio: 'inherit',
    });

    const zodTsContent = fs.readFileSync(TEMP_ZOD_TS, 'utf8');
    const zodTsHeader = `${lintSuppression}/**
 * AUTO-GENERATED FILE - DO NOT MODIFY.
 *
 * Source Spec: ${openapiEndpoint}
 * Spec Version: ${openapiSpecVersion}
 * Backend Title: ${backendTitle}
 * Backend Version: ${backendVersion}
 * Generated at: ${currentDate}
 * Generator: openapi-zod-client
 */\n\n`;

    // Remove any existing comments/eslint-disable in generated file to avoid duplication
    const cleanZodTsContent = zodTsContent.replace(/^\/\*[\s\S]*?\*\//, '').trim();
    const finalZodTsContent = zodTsHeader + cleanZodTsContent;

    if (isCheck) {
      console.log('🔍 Performing contract drift checks...');
      
      const existingApiTs = fs.existsSync(OUTPUT_API_TS) ? fs.readFileSync(OUTPUT_API_TS, 'utf8') : '';
      const existingZodTs = fs.existsSync(OUTPUT_ZOD_TS) ? fs.readFileSync(OUTPUT_ZOD_TS, 'utf8') : '';

      // Normalize newlines for cross-platform comparison
      const normalize = (str) => str.replace(/\r\n/g, '\n').trim();

      const apiChanged = normalize(existingApiTs) !== normalize(finalApiTsContent);
      const zodChanged = normalize(existingZodTs) !== normalize(finalZodTsContent);

      if (apiChanged || zodChanged) {
        console.error('❌ OpenAPI contract drift detected! The committed type definitions do not match the backend spec.');
        if (apiChanged) console.error(`   - ${path.relative(ROOT_DIR, OUTPUT_API_TS)} is out of sync`);
        if (zodChanged) console.error(`   - ${path.relative(ROOT_DIR, OUTPUT_ZOD_TS)} is out of sync`);
        console.error('👉 Please run "npm run gen:api-types" locally and commit the updated files.');
        cleanup();
        process.exit(1);
      } else {
        console.log('✅ OpenAPI contracts are fully synchronized. No drift detected.');
        cleanup();
        process.exit(0);
      }
    } else {
      // Write to destination files
      fs.writeFileSync(OUTPUT_API_TS, finalApiTsContent);
      fs.writeFileSync(OUTPUT_ZOD_TS, finalZodTsContent);
      fs.writeFileSync(OUTPUT_OPENAPI_JSON, JSON.stringify(spec, null, 2));

      console.log(`✅ Generated TypeScript definitions: ${path.relative(ROOT_DIR, OUTPUT_API_TS)}`);
      console.log(`✅ Generated Zod validation schemas: ${path.relative(ROOT_DIR, OUTPUT_ZOD_TS)}`);
      console.log(`✅ Cached OpenAPI spec JSON: ${path.relative(ROOT_DIR, OUTPUT_OPENAPI_JSON)}`);
      
      cleanup();
    }
  } catch (err) {
    console.error(`❌ Code generation failed: ${err.message}`);
    cleanup();
    process.exit(1);
  }
}

function cleanup() {
  try {
    if (fs.existsSync(TEMP_SPEC_JSON)) fs.unlinkSync(TEMP_SPEC_JSON);
    if (fs.existsSync(TEMP_ZOD_TS)) fs.unlinkSync(TEMP_ZOD_TS);
  } catch (e) {
    // Ignored
  }
}

main();
