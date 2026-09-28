import { useState } from 'react'
import { ImageOff } from 'lucide-react'

const MAX_REINTENTOS = 2
const RETRASO_BASE_MS = 1200

interface ThumbnailProps {
  src: string
  alt: string
  /** Clases para el contenedor -- ahí van position/size/animación (ej. "absolute inset-0 w-full h-full group-hover/card:scale-105 transition-transform duration-500"). */
  className?: string
  objectFit?: 'cover' | 'contain'
  loading?: 'lazy' | 'eager'
}

/** Miniatura remota (mapas, geovisores, categorías) con skeleton mientras
 *  carga, fade-in al terminar, y reintento automático ante fallo.
 *
 *  Las miniaturas se sirven vía el proxy /files/ -> MinIO; bajo ráfagas de
 *  peticiones concurrentes (ej. al cambiar de página en un listado, donde
 *  toda la grilla nueva pide su miniatura a la vez) algunas llegan truncadas
 *  intermitentemente (net::ERR_CONTENT_LENGTH_MISMATCH) aunque la solicitud
 *  en sí es válida -- un segundo intento casi siempre la trae completa, así
 *  que reintentar aquí es más simple y efectivo que intentar serializar la
 *  ráfaga de peticiones en el cliente. */
export default function Thumbnail({ src, alt, className = '', objectFit = 'cover', loading = 'lazy' }: ThumbnailProps) {
  const [estado, setEstado] = useState<'cargando' | 'lista' | 'error'>('cargando')
  const [intento, setIntento] = useState(0)
  const [srcAnterior, setSrcAnterior] = useState(src)

  // Nueva miniatura (ej. cambió de página) -- reinicia el ciclo de carga.
  // Ajustado durante el render, no en un efecto: evita el re-render extra
  // que produciría un useEffect solo para sincronizar este estado derivado.
  if (src !== srcAnterior) {
    setSrcAnterior(src)
    setEstado('cargando')
    setIntento(0)
  }

  const handleError = () => {
    if (intento < MAX_REINTENTOS) {
      window.setTimeout(() => setIntento((n) => n + 1), RETRASO_BASE_MS * (intento + 1))
    } else {
      setEstado('error')
    }
  }

  // Cache-busting solo en reintentos -- el primer intento respeta el caché
  // normal del navegador, así no se penaliza el caso común (sin fallos).
  const resolvedSrc = intento === 0 ? src : `${src}${src.includes('?') ? '&' : '?'}retry=${intento}`

  return (
    <div className={`relative overflow-hidden bg-bg-alt ${className}`}>
      {estado !== 'error' && (
        <img
          key={resolvedSrc}
          src={resolvedSrc}
          alt={alt}
          loading={loading}
          onLoad={() => setEstado('lista')}
          onError={handleError}
          className={`w-full h-full transition-opacity duration-300 ${estado === 'lista' ? 'opacity-100' : 'opacity-0'}`}
          style={{ objectFit }}
        />
      )}
      {estado !== 'lista' && (
        <div
          className={`absolute inset-0 flex items-center justify-center ${estado === 'cargando' ? 'animate-pulse bg-bg-alt' : 'bg-bg-alt'}`}
          aria-hidden="true"
        >
          {estado === 'error' && <ImageOff className="w-6 h-6 text-text-muted/40" />}
        </div>
      )}
    </div>
  )
}
