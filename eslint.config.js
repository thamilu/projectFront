/**
 * Flat ESLint config (ESLint v9+) for the Next.js monorepo.
 */

const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const boundariesPlugin = require('eslint-plugin-boundaries');
const rscPlugin = require('eslint-plugin-react-server-components');

module.exports = [
  {
    ignores: [
      '.next/**',
      '.turbopack/**',
      'node_modules/**',
      'dist/**',
      'build/**',
      'out/**',
      'coverage/**',
      '.cache/**',
      'public/**',
      'worker/**',
      'scripts/**',
      'shared/types/generated/**',
      'next.config.*',
      'tailwind.config.*',
      'postcss.config.*',
      '**/*.d.ts',
      '**/*.min.*',
    ],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
      // Without this, eslint-plugin-boundaries has no way to resolve `@/*`
      // path-alias imports (this project's convention for effectively all
      // cross-module imports — see tsconfig.json's `paths`) back to local
      // files. It silently classified every `@/...` import as "external"
      // instead, which meant `boundaries/dependencies` was never actually
      // evaluating them — a second, independent cause (beyond the legacy
      // selector syntax fixed above) of that rule enforcing nothing.
      // Verified via `ESLINT_PLUGIN_BOUNDARIES_DEBUG=true npx eslint <file>`:
      // before this setting, `@/features/...` imports resolved with
      // `origin: "external"` and `path: null`; the resolver package itself
      // (eslint-import-resolver-typescript) was already present in
      // node_modules as a transitive dependency — nothing new to install.
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
      'boundaries/elements': [
        {
          type: 'feature',
          pattern: 'features/*',
          mode: 'folder',
        },
        {
          type: 'shared',
          pattern: 'shared/*',
        },
        {
          type: 'ui-component',
          pattern: 'components/ui/*',
        },
        {
          type: 'layout-component',
          pattern: 'components/layout/*',
        },
        {
          type: 'global-component',
          pattern: 'components/*',
          mode: 'folder',
        },
        {
          type: 'lib',
          pattern: 'lib/*',
        },
        {
          type: 'app',
          pattern: 'app/*',
        },
      ],
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      boundaries: boundariesPlugin,
      'react-server-components': rscPlugin,
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/shared/constants',
              importNames: [
                'validateId',
                'validateSlug',
                'validateHandle',
                'validateSlugOrId',
                'validateAlphanumeric',
                'buildQueryString',
                'buildSearchUrl',
                'PathSegmentError',
              ],
              message: 'Import utilities from @/shared/utils, not @/shared/constants.',
            },
            {
              name: '@/shared/constants',
              importNames: ['LanguageSchema', 'CurrencySchema'],
              message: 'Import schemas from @/shared/schemas, not @/shared/constants.',
            },
            {
              name: '@/shared/constants',
              importNames: [
                'APP_ROUTES',
                'API_ROUTE_PREFIXES',
                'PROTECTED_ROUTE_PREFIXES',
              ],
              message: 'Import routes from @/shared/routes, not @/shared/constants.',
            },
            {
              name: '@/shared/mocks',
              message: 'Mock data must not be imported in production source files. Use only in *.test.ts, *.spec.ts files.',
            },
            {
              name: '@/shared/constants',
              importNames: ['languages', 'accentColors'],
              message: 'Deprecated. Use LANGUAGES and ACCENT_COLORS instead. See migration guide: https://your-docs.com/migration/v3',
            },
            {
              name: '@/shared/config/animation-variants',
              importNames: [
                'PAGE_SLIDE_VARIANTS',
                'PAGE_TRANSITION',
                'STEP_CONTENT_VARIANTS',
                'STEP_CONTENT_TRANSITION',
              ],
              message: 'Deprecated animation constants. Use PageAnimations or StepAnimations from @/shared/config/animation-variants instead. See migration guide: docs/animation-migration.md',
            },
            {
              name: '@/shared/config',
              importNames: [
                'PAGE_SLIDE_VARIANTS',
                'PAGE_TRANSITION',
                'STEP_CONTENT_VARIANTS',
                'STEP_CONTENT_TRANSITION',
              ],
              message: 'Deprecated animation constants. Use PageAnimations or StepAnimations from @/shared/config instead. See migration guide: docs/animation-migration.md',
            },
            {
              name: '@/shared/config/app-config',
              importNames: ['APP_CONFIG'],
              message: 'Deprecated. Use getAppConfig() instead. See migration guide: docs/app-config-migration.md',
            },
            {
              name: '@/shared/config',
              importNames: ['APP_CONFIG'],
              message: 'Deprecated. Use getAppConfig() instead. See migration guide: docs/app-config-migration.md',
            },
          ],
          patterns: [
            {
              // @/auth (auth.ts) is the permanent, intentional public entry
              // point for the NextAuth config — these lib/auth/* modules are
              // an internal implementation detail decomposed for
              // maintainability, not a parallel public API. Importing them
              // directly bypasses the barrel's deliberately narrow, curated
              // export surface.
              //
              // Deliberately NOT listed: lib/auth/constants (the /login
              // page's error-message catalog) and lib/auth/types (the
              // AuthErrorCode enum + type contracts). Both have zero
              // next-auth/jose runtime dependencies, but @/auth's very first
              // export line pulls in the real NextAuth() initialization —
              // which (a) is pure ESM Jest's default transform cannot parse,
              // breaking every test that transitively imports it, and (b)
              // throws at runtime in any browser context, breaking any
              // client component that needs AuthErrorCode's actual runtime
              // values (not just its type) for a comparison. Enumerated
              // explicitly here (rather than a wildcard with negation)
              // because that negation syntax did not actually take effect
              // against this project's eslint-plugin version — verified
              // empirically, not assumed. See auth.ts's docblock for the
              // full story.
              group: [
                '@/lib/auth/index',
                '@/lib/auth/config',
                '@/lib/auth/utils',
                '@/lib/auth/token-refresh',
                '@/lib/auth/backend-role',
                '@/lib/auth/handlers',
                '@/lib/auth/sign-out',
              ],
              message: 'Import from @/auth instead of @/lib/auth/* directly — see auth.ts for the public API surface.',
            },
          ],
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Architectural Boundaries [HARDEN]
      // Object-based selector syntax (eslint-plugin-boundaries v6+) — the
      // previous string-array syntax (`from: 'lib', allow: ['lib']`) was
      // silently non-functional under this plugin version: it logged a
      // "legacy selector syntax" warning for every rule but the rule
      // itself enforced nothing (verified empirically — a confirmed
      // lib -> feature violation in lib/auth/utils.ts produced zero
      // lint errors under the old syntax). This was the actual root
      // cause; the rules below are otherwise unchanged in intent.
      'boundaries/dependencies': [
        // WARN, not error: with the resolver fix above, this rule now
        // correctly evaluates every `@/*`-aliased import for the first
        // time. That surfaced ~340 pre-existing violations across the
        // codebase — almost all because the policy below never allowed a
        // layer to import from itself (fixed here) or accounted for
        // global-component <-> feature, which turned out to be a real,
        // heavily-used dependency direction (134 combined occurrences) that
        // nobody could have designed for correctly, since the rule never
        // ran to give that feedback. A residual ~18 violations remain
        // (shared -> feature, global-component -> app, lib -> feature) —
        // those look like genuine architectural violations, not policy
        // gaps, and are left as warnings pending a dedicated cleanup pass
        // rather than silently fixed or flipped to a build-breaking error
        // without that plan. See lib/auth/utils.ts's mapUserRole import for
        // the one already investigated in detail.
        'warn',
        {
          default: 'disallow',
          rules: [
            {
              from: { type: 'app' },
              allow: {
                to: {
                  type: [
                    'app',
                    'feature',
                    'shared',
                    'ui-component',
                    'layout-component',
                    'lib',
                    'global-component',
                  ],
                },
              },
            },
            {
              from: { type: 'feature' },
              allow: {
                to: { type: ['feature', 'shared', 'ui-component', 'lib', 'layout-component', 'global-component'] },
              },
            },
            {
              from: { type: 'shared' },
              allow: { to: { type: ['shared', 'lib', 'ui-component'] } },
            },
            {
              from: { type: 'global-component' },
              allow: {
                to: { type: ['global-component', 'shared', 'ui-component', 'lib', 'layout-component', 'feature'] },
              },
            },
            {
              from: { type: 'layout-component' },
              allow: { to: { type: ['layout-component', 'shared', 'ui-component', 'lib'] } },
            },
            {
              from: { type: 'lib' },
              allow: { to: { type: ['lib'] } }, // Infrastructure must be pure
            },
            {
              from: { type: 'ui-component' },
              allow: { to: { type: ['ui-component', 'lib'] } }, // UI components only depend on UI or utils
            },
          ],
        },
      ],

      // React Server Components
      // 'react-server-components/use-client': 'error',
      // 'react-server-components/no-hooks': 'error',
    },

  },
  {
    // Step components must use named exports only to prevent module contract drift
    files: ['features/**/components/steps/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-exports': [
        'error',
        { restrictedNamedExports: ['default'] }
      ]
    }
  },
  {
    // auth.ts IS the @/lib/auth barrel — it's the one legitimate place
    // allowed to import from @/lib/auth directly, since it's what defines
    // @/auth as the public path in the first place (see the
    // no-restricted-imports pattern above).
    files: ['auth.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    // Override for test files — allow mocks
    files: [
      '**/*.test.ts',
      '**/*.test-d.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/testing/**',
      '**/__mocks__/**',
    ],
    rules: {
      'no-restricted-imports': 'off',
    },
  }
];

