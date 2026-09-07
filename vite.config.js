import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('three') || id.includes('@react-three')) return 'three-vendor'
          if (id.includes('framer-motion') || id.includes('gsap')) return 'motion-vendor'
          if (id.includes('@tanstack/react-query') || id.includes('axios')) return 'query-vendor'
          if (id.includes('leaflet') || id.includes('react-leaflet')) return 'map-vendor'
        },
      },
    },
    modulePreload: {
      // three-vendor (Three.js, solo lo usa el hero WebGL de Home) y map-vendor
      // (Leaflet, solo Mapas/Geovisor) ya se cargan bajo demanda vía React.lazy().
      // Sin este filtro, Vite igual los precarga en <link rel="modulepreload">
      // del index.html en TODAS las páginas, anulando el beneficio del lazy().
      resolveDependencies: (_filename, deps) =>
        deps.filter((dep) => !dep.includes('three-vendor') && !dep.includes('map-vendor')),
    },
  },
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})