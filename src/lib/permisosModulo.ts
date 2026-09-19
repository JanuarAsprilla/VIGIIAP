import type { AuthUser } from '@/contexts/AuthContext'
import type { ModuloClave } from '@/lib/constants/modulos'

/**
 * Espejo en frontend de tienePermisoModulo() en VIGIIAP-backend/src/modules/admin/modulos.service.js:
 * - super_admin y cualquier rol que no sea admin_sig: sin restricción de este panel.
 * - admin_sig: se rige por user.modulos (ver getProfile en auth.service.js). Sin fila = deniega por defecto.
 */
export function puedeVerModulo(user: AuthUser | null | undefined, clave: ModuloClave): boolean {
  if (!user) return false
  if (user.rol !== 'admin_sig') return true
  return user.modulos?.find((p) => p.modulo === clave)?.puede_ver ?? false
}

export function puedeEditarModulo(user: AuthUser | null | undefined, clave: ModuloClave): boolean {
  if (!user) return false
  if (user.rol !== 'admin_sig') return true
  return user.modulos?.find((p) => p.modulo === clave)?.puede_editar ?? false
}
