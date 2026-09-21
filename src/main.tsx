import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import queryClient from './lib/queryClient'
// Fuentes auto-hospedadas — eliminan dependencia de Google Fonts CDN
import '@fontsource/source-serif-4/400.css'
import '@fontsource/source-serif-4/600.css'
import '@fontsource/source-serif-4/700.css'
import '@fontsource/source-serif-4/900.css'
import '@fontsource/source-sans-3/400.css'
import '@fontsource/source-sans-3/500.css'
import '@fontsource/source-sans-3/600.css'
import '@fontsource/source-sans-3/700.css'
import './index.css'
import heroSerifBoldWoff2 from '@fontsource/source-serif-4/files/source-serif-4-latin-700-normal.woff2?url'
import bodySansRegularWoff2 from '@fontsource/source-sans-3/files/source-sans-3-latin-400-normal.woff2?url'

// Cada despliegue reemplaza los archivos de /assets/ por otros con hash
// distinto -- una pestaña que ya tenía la app cargada en memoria (sin
// recargar) y navega a una ruta que todavía no había visitado (React.lazy)
// pide el chunk viejo, que el servidor ya no tiene (404 / "Failed to fetch
// dynamically imported module"), y sin este manejo ese error sube hasta el
// ErrorBoundary global y deja al usuario con la pantalla de error en vez de
// simplemente refrescar para obtener la versión actual. Vite dispara este
// evento en window ante cualquier import() dinámico fallido -- justo el
// caso. Recarga una sola vez por sesión, para no entrar en loop si la causa
// real fuera otra (ej. el propio index.html también quedó cacheado stale).
window.addEventListener('vite:preloadError', () => {
  const YA_RECARGO_KEY = 'vigiiap:preload-error-reload'
  if (sessionStorage.getItem(YA_RECARGO_KEY)) return
  sessionStorage.setItem(YA_RECARGO_KEY, '1')
  window.location.reload()
})

// Precarga las dos variantes tipográficas críticas para el primer render
// (encabezado hero en Source Serif 4 700, cuerpo en Source Sans 3 400) para
// que el navegador las descargue en paralelo al HTML en vez de recién al
// descubrirlas al parsear el CSS de @fontsource.
for (const href of [heroSerifBoldWoff2, bodySansRegularWoff2]) {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'font'
  link.type = 'font/woff2'
  link.crossOrigin = 'anonymous'
  link.href = href
  document.head.appendChild(link)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
