import { Routes, Route, useLocation } from 'react-router-dom'
import { lazy, Suspense, useState, useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { SearchProvider } from './contexts/SearchContext'
import { UIProvider } from './contexts/UIContext'
import { ThemeProvider } from './contexts/ThemeContext'
import MainLayout from './layouts/MainLayout'
import AdminLayout from './layouts/AdminLayout'
import RequireAuth, { RequireInvestigador, RequireVerified, RequireAdmin, RequireSuperAdmin } from './components/RequireAuth'
import ErrorBoundary from './components/ErrorBoundary'
import Preloader from './components/Preloader'
import {
  HomeSkeleton,
  MapasSkeleton,
  DocumentosSkeleton,
  HerramientasSkeleton,
  SolicitudesSkeleton,
  PerfilSkeleton,
  GenericPageSkeleton,
} from './components/ui/PageSkeletons'

// ── Public site ──
const Home            = lazy(() => import('./pages/Home'))
const Mapas           = lazy(() => import('./pages/Mapas'))
const Documentos      = lazy(() => import('./pages/Documentos'))
const Geovisor        = lazy(() => import('./pages/Geovisor'))
const Herramientas    = lazy(() => import('./pages/Herramientas'))
const Solicitudes     = lazy(() => import('./pages/Solicitudes'))
const GuiaUsuario     = lazy(() => import('./pages/recursos/GuiaUsuario'))
const FAQ             = lazy(() => import('./pages/recursos/FAQ'))
const Terminos        = lazy(() => import('./pages/recursos/Terminos'))
const Perfil          = lazy(() => import('./pages/Perfil'))
const NotFound        = lazy(() => import('./pages/NotFound'))

// ── Auth ──
const Login             = lazy(() => import('./pages/auth/Login'))
const SolicitarAcceso   = lazy(() => import('./pages/auth/SolicitarAcceso'))
const RecuperarPassword = lazy(() => import('./pages/auth/RecuperarPassword'))
const VerificarEmail    = lazy(() => import('./pages/auth/VerificarEmail'))
const ResetPassword           = lazy(() => import('./pages/auth/ResetPassword'))
const CambiarPasswordExpirada = lazy(() => import('./pages/auth/CambiarPasswordExpirada'))

// ── Admin panel ──
const AdminDashboard   = lazy(() => import('./pages/admin/Dashboard'))
const AdminUsuarios    = lazy(() => import('./pages/admin/Usuarios'))
const AdminSolicitudes = lazy(() => import('./pages/admin/GestionSolicitudes'))
const AdminDocumentos  = lazy(() => import('./pages/admin/GestionDocumentos'))
const AdminMapas       = lazy(() => import('./pages/admin/GestionMapas'))
const AdminConfig      = lazy(() => import('./pages/admin/Configuracion'))
const AdminActividad   = lazy(() => import('./pages/admin/Actividad'))
const AdminCategorias  = lazy(() => import('./pages/admin/GestionCategorias'))
const AdminGestionAdmins = lazy(() => import('./pages/admin/GestionAdmins'))

// Fallback genérico para Geovisor (mapa de pantalla completa, sin skeleton de columnas)
function GeovisorLoader() {
  return (
    <div className="flex-1 flex items-center justify-center bg-bg" role="status" aria-label="Cargando geovisor...">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary-300 border-t-primary-800 rounded-full animate-spin" aria-hidden="true" />
        <span className="text-sm text-text-muted">Inicializando mapa...</span>
      </div>
    </div>
  )
}

function AppLoader() {
  const [appReady, setAppReady] = useState(false)
  useEffect(() => {
    // A3: detectar carga real en vez de timeout mínimo hardcodeado (era 2200ms fijo)
    if (document.readyState === 'complete') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- estado del document ya resuelto al montar
      setAppReady(true)
      return
    }
    const onLoad = () => setAppReady(true)
    window.addEventListener('load', onLoad)
    // Fallback máximo de 3s — garantiza que el preloader siempre termine
    const fallback = setTimeout(() => setAppReady(true), 3000)
    return () => {
      window.removeEventListener('load', onLoad)
      clearTimeout(fallback)
    }
  }, [])
  if (!appReady) return <Preloader />
  return <AppRoutes />
}

// Spinner mínimo para Suspense en páginas de auth/404
function PageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-primary-300 border-t-primary-800 rounded-full animate-spin" aria-hidden="true" />
    </div>
  )
}

function AppRoutes() {
  const location = useLocation()

  return (
    <ThemeProvider>
    <AuthProvider>
    <UIProvider>
    <SearchProvider>
      {/* key={location.key} — resetea el ErrorBoundary en cada navegación,
          evitando que un error en una ruta deje la app pegada al navegar de vuelta */}
      <ErrorBoundary key={location.key}>
        <Routes>
          {/* ── Auth (sin layout) ── */}
          <Route path="/login"                       element={<Suspense fallback={<PageSpinner />}><Login /></Suspense>} />
          <Route path="/solicitar-acceso"            element={<Suspense fallback={<PageSpinner />}><SolicitarAcceso /></Suspense>} />
          <Route path="/recuperar-password"          element={<Suspense fallback={<PageSpinner />}><RecuperarPassword /></Suspense>} />
          <Route path="/verificar-email/:token"      element={<Suspense fallback={<PageSpinner />}><VerificarEmail /></Suspense>} />
          <Route path="/reset-password/:token"        element={<Suspense fallback={<PageSpinner />}><ResetPassword /></Suspense>} />
          <Route path="/cambiar-password-expirada"   element={<Suspense fallback={null}><CambiarPasswordExpirada /></Suspense>} />

          {/* ── Sitio público (MainLayout) — skeletons por ruta ── */}
          <Route element={<MainLayout />}>
            <Route path="/" element={
              <Suspense fallback={<HomeSkeleton />}><Home /></Suspense>
            } />
            <Route path="/guia-usuario" element={
              <Suspense fallback={<GenericPageSkeleton />}><GuiaUsuario /></Suspense>
            } />
            <Route path="/faq" element={
              <Suspense fallback={<GenericPageSkeleton />}><FAQ /></Suspense>
            } />
            <Route path="/terminos" element={
              <Suspense fallback={<GenericPageSkeleton />}><Terminos /></Suspense>
            } />

            {/* Requiere sesión (cualquier rol incluyendo Público y Visitante) */}
            <Route element={<RequireAuth />}>
              <Route path="/mapas" element={
                <Suspense fallback={<MapasSkeleton />}><Mapas /></Suspense>
              } />
              <Route path="/documentos" element={
                <Suspense fallback={<DocumentosSkeleton />}><Documentos /></Suspense>
              } />
            </Route>

            {/* Requiere usuario verificado — bloquea visitante y público */}
            <Route element={<RequireVerified />}>
              <Route path="/perfil" element={
                <Suspense fallback={<PerfilSkeleton />}><Perfil /></Suspense>
              } />
              <Route path="/solicitudes" element={
                <Suspense fallback={<SolicitudesSkeleton />}><Solicitudes /></Suspense>
              } />
            </Route>

            {/* Bloquea Público y Visitante — en la práctica deja pasar a cualquier
                otro rol verificado (investigador/tecnico/institucional/admin),
                no solo Investigador/Admin. Ver nota en RequireAuth.tsx. */}
            <Route element={<RequireInvestigador />}>
              <Route path="/geovisor" element={
                <Suspense fallback={<GeovisorLoader />}><Geovisor /></Suspense>
              } />
              <Route path="/herramientas" element={
                <Suspense fallback={<HerramientasSkeleton />}><Herramientas /></Suspense>
              } />
            </Route>
          </Route>

          {/* ── Panel Admin (AdminLayout) — Administrador SIG y Super Admin ── */}
          <Route element={<RequireAdmin />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin"               element={<Suspense fallback={<GenericPageSkeleton />}><AdminDashboard /></Suspense>} />
              <Route path="/admin/usuarios"      element={<Suspense fallback={<GenericPageSkeleton />}><AdminUsuarios /></Suspense>} />
              <Route path="/admin/solicitudes"   element={<Suspense fallback={<GenericPageSkeleton />}><AdminSolicitudes /></Suspense>} />
              <Route path="/admin/documentos"    element={<Suspense fallback={<GenericPageSkeleton />}><AdminDocumentos /></Suspense>} />
              <Route path="/admin/mapas"         element={<Suspense fallback={<GenericPageSkeleton />}><AdminMapas /></Suspense>} />
              <Route path="/admin/configuracion" element={<Suspense fallback={<GenericPageSkeleton />}><AdminConfig /></Suspense>} />
              <Route path="/admin/actividad"     element={<Suspense fallback={<GenericPageSkeleton />}><AdminActividad /></Suspense>} />
              <Route path="/admin/categorias"    element={<Suspense fallback={<GenericPageSkeleton />}><AdminCategorias /></Suspense>} />

              {/* ── Rutas exclusivas Super Admin ── */}
              <Route element={<RequireSuperAdmin />}>
                <Route path="/admin/superadmin" element={<Suspense fallback={<GenericPageSkeleton />}><AdminGestionAdmins /></Suspense>} />
              </Route>
            </Route>
          </Route>

          {/* ── 404 — siempre al final para no capturar rutas válidas ── */}
          <Route path="*" element={<Suspense fallback={<PageSpinner />}><NotFound /></Suspense>} />
        </Routes>
      </ErrorBoundary>
    </SearchProvider>
    </UIProvider>
    </AuthProvider>
    </ThemeProvider>
  )
}

export default AppLoader
