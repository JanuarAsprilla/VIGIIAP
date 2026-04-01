import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense, useState, useEffect } from 'react'
import MainLayout from './layouts/MainLayout'
import Preloader from './components/Preloader'

// Lazy load pages
const Home = lazy(() => import('./pages/Home'))
const Mapas = lazy(() => import('./pages/Mapas'))
const Documentos = lazy(() => import('./pages/Documentos'))
const Geovisor = lazy(() => import('./pages/Geovisor'))
const Herramientas = lazy(() => import('./pages/Herramientas'))
const Solicitudes = lazy(() => import('./pages/Solicitudes'))

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-primary-300 border-t-primary-800 rounded-full animate-spin" />
        <span className="text-sm text-text-muted">Cargando módulo...</span>
      </div>
    </div>
  )
}

export default function App() {
  const [appReady, setAppReady] = useState(false)

  useEffect(() => {
    // Preloader solo la primera vez que se abre el sitio
    const timer = setTimeout(() => setAppReady(true), 2200)
    return () => clearTimeout(timer)
  }, [])

  if (!appReady) {
    return <Preloader />
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/mapas" element={<Mapas />} />
          <Route path="/documentos" element={<Documentos />} />
          <Route path="/geovisor" element={<Geovisor />} />
          <Route path="/herramientas" element={<Herramientas />} />
          <Route path="/solicitudes" element={<Solicitudes />} />
        </Route>
      </Routes>
    </Suspense>
  )
}