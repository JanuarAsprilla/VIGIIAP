import { useEffect, useState } from 'react'
import api from '@/lib/api'

export interface EstadoPlataforma {
  mantenimiento: boolean
  mensaje: string | null
}

const INTERVALO_MS = 30_000
const MENSAJE_POR_DEFECTO = 'La plataforma está en mantenimiento. Vuelve a intentarlo más tarde.'

/**
 * Estado público de la plataforma (GET /estado, sin sesión). Se consulta al cargar, cada 30 s y
 * al volver a la pestaña, así que entrar o salir del mantenimiento se refleja en toda la
 * aplicación sin recargar. Si el backend no responde, se conserva el último estado conocido:
 * una caída no debe verse como "mantenimiento".
 * Un 503 `maintenance:true` en cualquier petición (evento vigiiap:maintenance) lo activa al instante.
 */
export function useEstadoPlataforma(): EstadoPlataforma {
  const [estado, setEstado] = useState<EstadoPlataforma>({ mantenimiento: false, mensaje: null })

  useEffect(() => {
    let activo = true

    const consultar = async () => {
      try {
        const res = await api.get('/estado') as Partial<EstadoPlataforma>
        if (!activo) return
        setEstado({ mantenimiento: res.mantenimiento === true, mensaje: res.mensaje ?? null })
      } catch {
        // Sin respuesta: se queda el último estado conocido.
      }
    }

    const alMantenimiento = (e: Event) => {
      const detalle = (e as CustomEvent<{ message?: string }>).detail
      setEstado({ mantenimiento: true, mensaje: detalle?.message || MENSAJE_POR_DEFECTO })
    }
    const alVolver = () => { if (document.visibilityState === 'visible') void consultar() }

    void consultar()
    const temporizador = setInterval(consultar, INTERVALO_MS)
    window.addEventListener('vigiiap:maintenance', alMantenimiento)
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      activo = false
      clearInterval(temporizador)
      window.removeEventListener('vigiiap:maintenance', alMantenimiento)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [])

  return estado
}

export { MENSAJE_POR_DEFECTO as MENSAJE_MANTENIMIENTO_POR_DEFECTO }
