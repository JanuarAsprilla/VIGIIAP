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
      // Sin `include`, v8 solo instrumenta los archivos que los tests actuales
      // importan — contexts/hooks quedaban al 98%+ mientras pages/ y components/
      // (la mayoría del código real) eran invisibles para el cálculo, no "cubiertos".
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/', 'dist/', 'src/test/',
        'src/main.tsx', 'src/vite-env.d.ts', 'src/types/**',
      ],
      // Ratchet honesto: la cobertura REAL de todo src/ (no solo lo que los
      // tests tocaban) partía de 8.69% — el 95%/100% previo pasaba porque
      // coverage.include estaba vacío y v8 solo instrumentaba contexts/hooks.
      // Estos números son el piso actual tras cubrir el código de mayor
      // riesgo (auth, guards RBAC, proyección geodésica, cliente HTTP);
      // pages/ y la mayoría de components/ siguen en 0%. Súbelos cada vez
      // que agregues tests nuevos — nunca los bajes para que un PR pase.
      thresholds: {
        statements: 13,
        branches: 9,
        functions: 13,
        lines: 14,
      },
    },
    globals: true,
  },
})
