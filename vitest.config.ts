import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/test/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/', 'dist/', 'src/test/',
        'src/main.tsx', 'src/vite-env.d.ts', 'src/types/**',
      ],
      // Ratchet: solo subir, nunca bajar para que un PR pase.
      thresholds: {
        statements: 76,
        branches: 74,
        functions: 72,
        lines: 80,
      },
    },
    globals: true,
  },
})
