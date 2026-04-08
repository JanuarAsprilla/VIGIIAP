import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Protege las rutas del dashboard.
 * Si el usuario no está autenticado, redirige a /login preservando
 * la URL de destino en state.from para poder redirigirlo de vuelta
 * después del login.
 */
export default function RequireAuth() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
