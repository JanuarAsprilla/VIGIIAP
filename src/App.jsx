import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense, useState, useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { SearchProvider } from './contexts/SearchContext'
import { UIProvider } from './contexts/UIContext'
import MainLayout from './layouts/MainLayout'
import AdminLayout from './layouts/AdminLayout'
import RequireAuth, { RequireInvestigador, RequireAdmin } from './components/RequireAuth'
import ErrorBoundary from './components/ErrorBoundary'
import Preloader from './components/Preloader'

// ── Public site ──
const Home            = lazy(() => import('./pages/Home'))
const Mapas           = lazy(() => import('./pages/Mapas'))
const Documentos      = lazy(() => import('./pages/Documentos'))
const Geovisor        = lazy(() => import('./pages/Geovisor'))
const Herramientas    = lazy(() => import('./pages/Herramientas'))
const Solicitudes     = lazy(() => import('./pages/Solicitudes'))
const Noticias        = lazy(() => import('./pages/Noticias'))
const NoticiaDetalle  = lazy(() => import('./pages/NoticiaDetalle'))
const GuiaUsuario     = lazy(() => import('./pages/recursos/GuiaUsuario'))
const FAQ             = lazy(() => import('./pages/recursos/FAQ'))
const Terminos        = lazy(() => import('./pages/recursos/Terminos'))

// ── Auth ──
const Login           = lazy(() => import('./pages/auth/Login'))
const SolicitarAcceso = lazy(() => import('./pages/auth/SolicitarAcceso'))
const RecuperarPassword = lazy(() => import('./pages/auth/RecuperarPassword'))

// ── Admin panel ──
const AdminDashboard    = lazy(() => import('./pages/admin/Dashboard'))
const AdminUsuarios     = lazy(() => import('./pages/admin/Usuarios'))
const AdminSolicitudes  = lazy(() => import('./pages/admin/GestionSolicitudes'))
const AdminNoticias     = lazy(() => import('./pages/admin/GestionNoticias'))
const AdminDocumentos   = lazy(() => import('./pages/admin/GestionDocumentos'))
const AdminMapas        = lazy(() => import('./pages/admin/GestionMapas'))
const AdminConfig       = lazy(() => import('./pages/admin/Configuracion'))
const AdminActividad    = lazy(() => import('./pages/admin/Actividad'))

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary-300 border-t-primary-800 rounded-full animate-spin" />
        <span className="text-sm text-text-muted">Cargando módulo...</span>
      </div>
    </div>
  )
}

export default function App() {
  const [appReady, setAppReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setAppReady(true), 2200)
    return () => clearTimeout(t)
  }, [])
  if (!appReady) return <Preloader />

  return (
    <AuthProvider>
    <UIProvider>
    <SearchProvider>
      <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Auth (sin layout) ── */}
          <Route path="/login"              element={<Login />} />
          <Route path="/solicitar-acceso"   element={<SolicitarAcceso />} />
          <Route path="/recuperar-password" element={<RecuperarPassword />} />

          {/* ── Sitio público (MainLayout) ── */}
          <Route element={<MainLayout />}>
            <Route path="/"              element={<Home />} />
            <Route path="/guia-usuario"  element={<GuiaUsuario />} />
            <Route path="/faq"           element={<FAQ />} />
            <Route path="/terminos"      element={<Terminos />} />
            <Route path="/noticias"      element={<Noticias />} />
            <Route path="/noticias/:slug" element={<NoticiaDetalle />} />

            {/* Requiere Investigador o Admin */}
            <Route element={<RequireInvestigador />}>
              <Route path="/mapas"        element={<Mapas />} />
              <Route path="/documentos"   element={<Documentos />} />
              <Route path="/geovisor"     element={<Geovisor />} />
              <Route path="/herramientas" element={<Herramientas />} />
              <Route path="/solicitudes"  element={<Solicitudes />} />
            </Route>
          </Route>

          {/* ── Panel Admin (AdminLayout) — solo Administrador SIG ── */}
          <Route element={<RequireAdmin />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin"                element={<AdminDashboard />} />
              <Route path="/admin/usuarios"       element={<AdminUsuarios />} />
              <Route path="/admin/solicitudes"    element={<AdminSolicitudes />} />
              <Route path="/admin/noticias"       element={<AdminNoticias />} />
              <Route path="/admin/documentos"     element={<AdminDocumentos />} />
              <Route path="/admin/mapas"          element={<AdminMapas />} />
              <Route path="/admin/configuracion"  element={<AdminConfig />} />
              <Route path="/admin/actividad"      element={<AdminActividad />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </SearchProvider>
    </UIProvider>
    </AuthProvider>
  )
}
