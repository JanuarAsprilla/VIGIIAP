import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ROLES } from '@/contexts/AuthContext'

/** Protege rutas que requieren sesión activa. */
export default function RequireAuth() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <Outlet />
}

/** Protege rutas que requieren rol Investigador o Administrador SIG. Bloquea Público y Visitante. */
export function RequireInvestigador() {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()
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
  const { isAuthenticated, isAdmin } = useAuth()
  const location = useLocation()
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
  const { isAuthenticated, isSuperAdmin } = useAuth()
  const location = useLocation()
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
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()
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
