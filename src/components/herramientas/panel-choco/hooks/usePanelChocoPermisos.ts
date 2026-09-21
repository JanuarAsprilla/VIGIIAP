import { useAuth } from '@/contexts/AuthContext'

const ROLES_EDITAN = new Set(['investigador', 'admin_sig', 'super_admin'])

/** Quién puede subir/editar los datasets del panel — decisión de producto propia de
 * esta herramienta, no una regla general de AuthContext (los demás roles solo leen). */
export function usePanelChocoPermisos() {
  const { user } = useAuth()
  const puedeEditar = !!user && ROLES_EDITAN.has(user.rol)
  return { puedeEditar }
}
