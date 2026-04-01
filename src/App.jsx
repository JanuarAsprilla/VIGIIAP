import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense, useState, useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import MainLayout from './layouts/MainLayout'
import Preloader from './components/Preloader'

const Home = lazy(() => import('./pages/Home'))
const Mapas = lazy(() => import('./pages/Mapas'))
const Documentos = lazy(() => import('./pages/Documentos'))
const Geovisor = lazy(() => import('./pages/Geovisor'))
const Herramientas = lazy(() => import('./pages/Herramientas'))
const Solicitudes = lazy(() => import('./pages/Solicitudes'))
const Login = lazy(() => import('./pages/auth/Login'))
const SolicitarAcceso = lazy(() => import('./pages/auth/SolicitarAcceso'))
const RecuperarPassword = lazy(() => import('./pages/auth/RecuperarPassword'))
const GuiaUsuario = lazy(() => import('./pages/recursos/GuiaUsuario'))
const FAQ = lazy(() => import('./pages/recursos/FAQ'))
const Terminos = lazy(() => import('./pages/recursos/Terminos'))

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
    const timer = setTimeout(() => setAppReady(true), 2200)
    return () => clearTimeout(timer)
  }, [])

  if (!appReady) return <Preloader />

  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth — sin layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/solicitar-acceso" element={<SolicitarAcceso />} />
          <Route path="/recuperar-password" element={<RecuperarPassword />} />

          {/* App — con dashboard layout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/mapas" element={<Mapas />} />
            <Route path="/documentos" element={<Documentos />} />
            <Route path="/geovisor" element={<Geovisor />} />
            <Route path="/herramientas" element={<Herramientas />} />
            <Route path="/solicitudes" element={<Solicitudes />} />
            <Route path="/guia-usuario" element={<GuiaUsuario />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/terminos" element={<Terminos />} />
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}