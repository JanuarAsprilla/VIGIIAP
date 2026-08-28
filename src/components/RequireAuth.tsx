import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ROLES } from '@/lib/constants/roles'

// Mostrado mientras AuthContext rehidrata la sesión desde GET /auth/me.
// Evita redirección prematura a /login antes de confirmar si hay sesión activa.
function AuthSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div
        className="w-7 h-7 border-2 border-primary-300 border-t-primary-800 rounded-full animate-spin"
        aria-label="Verificando sesión..."
        role="status"
      />
    </div>
  )
}

/** Protege rutas que requieren sesión activa. */
export default function RequireAuth() {
  const { isAuthenticated, initializing } = useAuth()
  const location = useLocation()
  if (initializing) return <AuthSpinner />
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <Outlet />
}

/**
 * Protege /geovisor y /herramientas. Bloquea Público y Visitante.
 * NOTA (decisión de producto pendiente): a pesar del nombre, deja pasar a
 * CUALQUIER rol verificado (investigador, tecnico, institucional, admin_sig,
 * super_admin) — no solo Investigador/Admin. Si el acceso a estas dos rutas
 * debe ser más restrictivo, hay que decidir la regla real y ajustar aquí.
 */
export function RequireInvestigador() {
  const { isAuthenticated, initializing, user } = useAuth()
  const location = useLocation()
  if (initializing) return <AuthSpinner />
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (user?.role === ROLES.PUBLICO || user?.role === ROLES.VISITANTE || user?.isVisitante) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}

/** Protege rutas exclusivas para Administrador SIG (también permite super_admin). */
export function RequireAdmin() {
  const { isAuthenticated, initializing, isAdmin } = useAuth()
  const location = useLocation()
  if (initializing) return <AuthSpinner />
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}

/** Protege rutas exclusivas para Super Administrador. */
export function RequireSuperAdmin() {
  const { isAuthenticated, initializing, isSuperAdmin } = useAuth()
  const location = useLocation()
  if (initializing) return <AuthSpinner />
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (!isSuperAdmin) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}

/** Protege rutas que requieren usuario verificado (no visitante, no público).
 *  Permite: investigador, tecnico, institucional, admin_sig, super_admin.
 *  Redirige a /solicitar-acceso si es visitante/público, a /login si no autenticado.
 */
export function RequireVerified() {
  const { isAuthenticated, initializing, user } = useAuth()
  const location = useLocation()
  if (initializing) return <AuthSpinner />
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  // user.rol es la clave backend raw ('visitante', 'publico', 'investigador', etc.)
  const isUnverified = user?.isVisitante || user?.rol === 'visitante' || user?.rol === 'publico'
  if (isUnverified) {
    return <Navigate to="/solicitar-acceso" replace />
  }
  return <Outlet />
}
