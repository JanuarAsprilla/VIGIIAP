import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import MainLayout from './layouts/MainLayout'

// Lazy load — cada módulo se carga solo cuando el usuario navega a él
const Home = lazy(() => import('./pages/Home'))
const Mapas = lazy(() => import('./pages/Mapas'))
const Documentos = lazy(() => import('./pages/Documentos'))
const Geovisor = lazy(() => import('./pages/Geovisor'))
const Herramientas = lazy(() => import('./pages/Herramientas'))
const Solicitudes = lazy(() => import('./pages/Solicitudes'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-primary-300 border-t-primary-800 rounded-full animate-spin" />
        <span className="text-sm text-text-muted">Cargando módulo...</span>
      </div>
    </div>
  )
}

export default function App() {
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