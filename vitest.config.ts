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
    // Refleja el dominio real de R2 en producción para que isTrustedUrl()
    // acepte las URLs de fixtures (https://r2.example.com/...) en los tests.
    env: {
      VITE_R2_PUBLIC_URL: 'https://r2.example.com',
    },
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
        statements: 79,
        branches: 78,
        functions: 79,
        lines: 82,
      },
    },
    globals: true,
  },
})
