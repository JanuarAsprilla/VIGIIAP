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
import {
  HomeSkeleton,
  MapasSkeleton,
  DocumentosSkeleton,
  HerramientasSkeleton,
  NoticiasSkeleton,
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
const Noticias        = lazy(() => import('./pages/Noticias'))
const NoticiaDetalle  = lazy(() => import('./pages/NoticiaDetalle'))
const GuiaUsuario     = lazy(() => import('./pages/recursos/GuiaUsuario'))
const FAQ             = lazy(() => import('./pages/recursos/FAQ'))
const Terminos        = lazy(() => import('./pages/recursos/Terminos'))
const Perfil          = lazy(() => import('./pages/Perfil'))
const NotFound        = lazy(() => import('./pages/NotFound'))

// ── Auth ──
const Login             = lazy(() => import('./pages/auth/Login'))
const SolicitarAcceso   = lazy(() => import('./pages/auth/SolicitarAcceso'))
const RecuperarPassword = lazy(() => import('./pages/auth/RecuperarPassword'))

// ── Admin panel ──
const AdminDashboard   = lazy(() => import('./pages/admin/Dashboard'))
const AdminUsuarios    = lazy(() => import('./pages/admin/Usuarios'))
const AdminSolicitudes = lazy(() => import('./pages/admin/GestionSolicitudes'))
const AdminNoticias    = lazy(() => import('./pages/admin/GestionNoticias'))
const AdminDocumentos  = lazy(() => import('./pages/admin/GestionDocumentos'))
const AdminMapas       = lazy(() => import('./pages/admin/GestionMapas'))
const AdminConfig      = lazy(() => import('./pages/admin/Configuracion'))
const AdminActividad   = lazy(() => import('./pages/admin/Actividad'))

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
        <Routes>
          {/* ── Auth (sin layout, sin skeleton específico) ── */}
          <Route path="/login"              element={<Suspense fallback={null}><Login /></Suspense>} />
          <Route path="/solicitar-acceso"   element={<Suspense fallback={null}><SolicitarAcceso /></Suspense>} />
          <Route path="/recuperar-password" element={<Suspense fallback={null}><RecuperarPassword /></Suspense>} />

          {/* ── Sitio público (MainLayout) — skeletons por ruta ── */}
          <Route element={<MainLayout />}>
            <Route path="/" element={
              <Suspense fallback={<HomeSkeleton />}><Home /></Suspense>
            } />
            <Route path="/noticias" element={
              <Suspense fallback={<NoticiasSkeleton />}><Noticias /></Suspense>
            } />
            <Route path="/noticias/:slug" element={
              <Suspense fallback={<GenericPageSkeleton />}><NoticiaDetalle /></Suspense>
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

            {/* Requiere Investigador o Admin */}
            <Route element={<RequireInvestigador />}>
              <Route path="/perfil" element={
                <Suspense fallback={<PerfilSkeleton />}><Perfil /></Suspense>
              } />
              <Route path="/mapas" element={
                <Suspense fallback={<MapasSkeleton />}><Mapas /></Suspense>
              } />
              <Route path="/documentos" element={
                <Suspense fallback={<DocumentosSkeleton />}><Documentos /></Suspense>
              } />
              <Route path="/geovisor" element={
                <Suspense fallback={<GeovisorLoader />}><Geovisor /></Suspense>
              } />
              <Route path="/herramientas" element={
                <Suspense fallback={<HerramientasSkeleton />}><Herramientas /></Suspense>
              } />
              <Route path="/solicitudes" element={
                <Suspense fallback={<SolicitudesSkeleton />}><Solicitudes /></Suspense>
              } />
            </Route>
          </Route>

          {/* ── 404 ── */}
          <Route path="*" element={
            <Suspense fallback={null}><NotFound /></Suspense>
          } />

          {/* ── Panel Admin (AdminLayout) — solo Administrador SIG ── */}
          <Route element={<RequireAdmin />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin"               element={<Suspense fallback={<GenericPageSkeleton />}><AdminDashboard /></Suspense>} />
              <Route path="/admin/usuarios"      element={<Suspense fallback={<GenericPageSkeleton />}><AdminUsuarios /></Suspense>} />
              <Route path="/admin/solicitudes"   element={<Suspense fallback={<GenericPageSkeleton />}><AdminSolicitudes /></Suspense>} />
              <Route path="/admin/noticias"      element={<Suspense fallback={<GenericPageSkeleton />}><AdminNoticias /></Suspense>} />
              <Route path="/admin/documentos"    element={<Suspense fallback={<GenericPageSkeleton />}><AdminDocumentos /></Suspense>} />
              <Route path="/admin/mapas"         element={<Suspense fallback={<GenericPageSkeleton />}><AdminMapas /></Suspense>} />
              <Route path="/admin/configuracion" element={<Suspense fallback={<GenericPageSkeleton />}><AdminConfig /></Suspense>} />
              <Route path="/admin/actividad"     element={<Suspense fallback={<GenericPageSkeleton />}><AdminActividad /></Suspense>} />
            </Route>
          </Route>
        </Routes>
      </ErrorBoundary>
    </SearchProvider>
    </UIProvider>
    </AuthProvider>
  )
}
