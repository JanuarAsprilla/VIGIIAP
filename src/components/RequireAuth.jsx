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
  if (user?.role === ROLES.PUBLICO || user?.isVisitante) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}

/** Protege rutas exclusivas para Administrador SIG. */
export function RequireAdmin() {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (user?.role !== ROLES.ADMIN) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
