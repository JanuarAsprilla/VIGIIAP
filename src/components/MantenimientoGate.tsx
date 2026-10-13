import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useEstadoPlataforma, MENSAJE_MANTENIMIENTO_POR_DEFECTO } from '@/hooks/useEstadoPlataforma'
import MaintenancePage from '@/components/MaintenancePage'

// Pantallas que un administrador necesita para entrar a desactivar el mantenimiento.
const RUTAS_DE_ACCESO = ['/login', '/verificar-2fa', '/recuperar-password', '/reset-password', '/cambiar-password-expirada']

const esRutaDeAcceso = (ruta: string) =>
  RUTAS_DE_ACCESO.some((base) => ruta === base || ruta.startsWith(`${base}/`))

/**
 * Con el modo mantenimiento activo la plataforma entera queda en pausa: en vez de la aplicación
 * solo se ve el aviso. Quedan fuera las pantallas de acceso y los administradores con sesión
 * (el backend también los deja pasar), para que puedan volver a abrirla.
 */
export default function MantenimientoGate({ children }: { children: ReactNode }) {
  const { mantenimiento, mensaje } = useEstadoPlataforma()
  const { isAdmin, isAuthenticated, initializing, logout } = useAuth()
  const { pathname } = useLocation()

  if (!mantenimiento) return <>{children}</>
  if (esRutaDeAcceso(pathname)) return <>{children}</>
  if (initializing) {
    return <div className="min-h-screen" style={{ background: 'var(--shell-bg)' }} aria-busy="true" />
  }
  if (isAdmin) return <>{children}</>

  return (
    <MaintenancePage
      mensaje={mensaje || MENSAJE_MANTENIMIENTO_POR_DEFECTO}
      onCerrarSesion={isAuthenticated ? () => { void logout() } : undefined}
    />
  )
}
