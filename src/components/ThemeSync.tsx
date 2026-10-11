import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

/**
 * Aplica la preferencia de tema guardada en el servidor (usuarios.tema)
 * sobre ThemeContext al cargar sesión -- ThemeProvider envuelve a
 * AuthProvider (necesita estar listo antes que la sesión, para no parpadear
 * en modo claro mientras se rehidrata), así que no puede leer useAuth()
 * directamente y esta sincronización vive en un componente aparte, montado
 * dentro de ambos providers.
 *
 * Solo aplica al cargar/cambiar de cuenta -- una vez montado, alternar el
 * tema desde el botón del topbar no debe "rebotar" de vuelta a user.tema en
 * cada render (por eso corre en base a user?.id, no en cada cambio de tema).
 */
export default function ThemeSync() {
  const { user } = useAuth()
  const { setTheme } = useTheme()

  useEffect(() => {
    if (user?.tema) setTheme(user.tema)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberado: solo al cargar/cambiar de cuenta, no en cada cambio de tema
  }, [user?.id, user?.tema])

  return null
}
