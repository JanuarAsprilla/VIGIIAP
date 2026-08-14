import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import reactPlugin from 'eslint-plugin-react'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const sharedPlugins = { react: reactPlugin }

const sharedRules = {
  'react/jsx-uses-vars': 'error',
  'react/jsx-uses-react': 'off',
  'no-console': ['error', { allow: ['warn', 'error'] }],
  'react-hooks/set-state-in-effect': 'warn',
  'react-hooks/purity': 'warn',
  'react-hooks/refs': 'warn',
  'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
}

export default defineConfig([
  globalIgnores(['dist']),

  // ─── JS/JSX source files ───────────────────────────────────────────────────
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: sharedPlugins,
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...sharedRules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },

  // ─── TS/TSX source files — TypeScript-aware linting ───────────────────────
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      ...sharedPlugins,
      '@typescript-eslint': tseslint.plugin,
    },
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      parser: tseslint.parser,
      globals: globals.browser,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...sharedRules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // ─── Test files (Vitest globals) ───────────────────────────────────────────
  {
    files: ['src/test/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // ─── Node.js config files (process, __dirname) ─────────────────────────────
  {
    files: ['*.config.{js,ts}', 'e2e/**/*.{js,ts}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: { 'no-console': 'off' },
  },
])
