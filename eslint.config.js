/**
 * Flat ESLint config (ESLint v9+) for the Next.js monorepo.
 *
 * Goals:
 * - Deterministic rules (single source of truth)
 * - Catch real bugs (unused vars, hooks rules)
 * - Keep noise manageable while the codebase is being tightened
 */

const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');

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
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // Logging: allow warn/error, discourage log.
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Type safety / hygiene.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // React / JSX.
      'react/react-in-jsx-scope': 'off',

      // Hooks correctness (enterprise-grade: prevents real runtime bugs).
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
