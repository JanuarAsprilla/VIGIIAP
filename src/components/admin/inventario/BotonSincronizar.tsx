import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react'
import { useSincronizarConexionGeoserver } from '@/hooks/useConexionesGeoserver'
import { ETIQUETA_ESTADO } from '@/lib/inventarioGeoserver'

const formatoDuracion = (ms: number) => `${(ms / 1000).toFixed(1).replace('.', ',')} s`

/** Botón «Sincronizar ahora» con su propio estado: en curso, resultado y error, anunciados a lectores de pantalla. */
export default function BotonSincronizar({ conexionId }: { conexionId: string }) {
  const { mutate, isPending, error, data } = useSincronizarConexionGeoserver()

  return (
    <div className="flex flex-col items-start sm:items-end gap-2 min-w-0">
      <button type="button" onClick={() => mutate(conexionId)} disabled={isPending} aria-busy={isPending}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700">
        <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
        {isPending ? 'Sincronizando…' : 'Sincronizar ahora'}
      </button>

      {isPending && (
        <p role="status" aria-label="Sincronización en curso" className="flex items-center gap-1.5 text-xs text-text-muted">
          <Loader2 className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          Leyendo lo publicado en GeoServer; puede tardar unos segundos.
        </p>
      )}
      {!isPending && data && !error && (
        <p role="status" aria-label="Resultado de la sincronización" className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Sincronización {ETIQUETA_ESTADO[data.estado].toLowerCase()} en {formatoDuracion(data.duracion_ms)}.
        </p>
      )}
      {!isPending && error && (
        <p role="alert" aria-label="Error al sincronizar" className="flex items-start gap-1.5 text-xs text-red-700 dark:text-red-300 sm:text-right max-w-sm">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" aria-hidden="true" />
          {error.message}
        </p>
      )}
    </div>
  )
}
