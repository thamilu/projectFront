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
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              from: 'app',
              allow: ['feature', 'shared', 'ui-component', 'layout-component', 'lib', 'global-component'],
            },
            {
              from: 'feature',
              allow: ['shared', 'ui-component', 'lib', 'layout-component'],
            },
            {
              from: 'shared',
              allow: ['lib', 'ui-component'],
            },
            {
              from: 'global-component',
              allow: ['shared', 'ui-component', 'lib', 'layout-component'],
            },
            {
              from: 'layout-component',
              allow: ['shared', 'ui-component', 'lib'],
            },
            {
              from: 'lib',
              allow: ['lib'], // Infrastructure must be pure
            },
            {
              from: 'ui-component',
              allow: ['ui-component', 'lib'], // UI components only depend on UI or utils
            },
          ],
        },
      ],

      // React Server Components
      // 'react-server-components/use-client': 'error',
      // 'react-server-components/no-hooks': 'error',
    },

  },
];
