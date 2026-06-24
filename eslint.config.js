import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import reactPlugin from 'eslint-plugin-react'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),

  // ─── Source files ─────────────────────────────────────────────────────────
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: { react: reactPlugin },
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
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // Track JSX member expressions (e.g. <motion.div>) as variable usage
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'off',

      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],

      // react-hooks v7 strict rules — downgraded to warn.
      // These rules flag valid React patterns (reset state on open, derived state
      // sync, geometry init with Math.random, closures over refs in event handlers).
      // Treat as advisory until the community settles on idiomatic replacements.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',

      // Context and utility files export both a Provider component and a useXxx hook
      // from the same file — this is standard React Context architecture.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // ─── Test files (Vitest globals) ──────────────────────────────────────────
  {
    files: ['src/test/**/*.{js,jsx}'],
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
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'no-console': 'off',
    },
  },

  // ─── Node.js config files (process, __dirname) ────────────────────────────
  {
    files: ['*.config.{js,ts}', 'e2e/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
])
