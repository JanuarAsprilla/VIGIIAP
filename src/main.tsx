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
