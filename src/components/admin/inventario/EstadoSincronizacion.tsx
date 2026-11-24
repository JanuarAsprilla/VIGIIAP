import { AlertCircle, AlertTriangle, CheckCircle2, CircleDashed, Eye, Info, type LucideIcon } from 'lucide-react'
import type { EstadoSincronizacion as Estado, SincronizacionInventario } from '@/types'
import { AVISO_SOLO_OGC, ETIQUETA_ESTADO, ETIQUETA_FUENTE, haceCuanto, lineasResumen, type LineaResumen } from '@/lib/inventarioGeoserver'
import BotonSincronizar from './BotonSincronizar'

const ESTILO_ESTADO: Record<Estado, { Icono: LucideIcon; pastilla: string; barra: string }> = {
  ok:      { Icono: CheckCircle2,  pastilla: 'bg-green-600/12 text-green-800 dark:text-green-300', barra: 'bg-green-600' },
  parcial: { Icono: AlertTriangle, pastilla: 'bg-amber-500/15 text-amber-800 dark:text-amber-300', barra: 'bg-amber-500' },
  error:   { Icono: AlertCircle,   pastilla: 'bg-red-600/12 text-red-800 dark:text-red-300',       barra: 'bg-red-600' },
}

const FEMENINO: ReadonlySet<string> = new Set(['capas'])

const contar = (n: number, base: string, femenino: boolean) => {
  const palabra = base + (femenino ? 'a' : 'o')
  return `${n} ${palabra}${n === 1 ? '' : 's'}`
}

function Cambios({ linea }: { linea: LineaResumen }) {
  const fem = FEMENINO.has(linea.tipo)
  const partes = [
    linea.nuevos > 0 && { clave: 'n', texto: contar(linea.nuevos, 'nuev', fem), clase: 'text-green-800 dark:text-green-300' },
    linea.cambiados > 0 && { clave: 'c', texto: contar(linea.cambiados, 'cambiad', fem), clase: 'text-text' },
    linea.eliminados > 0 && { clave: 'e', texto: contar(linea.eliminados, 'eliminad', fem), clase: 'text-red-800 dark:text-red-300' },
  ].filter((p): p is { clave: string; texto: string; clase: string } => p !== false)

  return (
    <div role="group" aria-label={`Cambios en ${linea.etiqueta}`} className="rounded-xl border border-border/70 px-3 py-2">
      <p className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted">{linea.etiqueta}</p>
      {partes.length === 0
        ? <p className="mt-0.5 text-xs text-text-muted">Sin cambios</p>
        : <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs font-semibold">
            {partes.map((p) => <span key={p.clave} className={p.clase}>{p.texto}</span>)}
          </p>}
    </div>
  )
}

export default function EstadoSincronizacion({ conexionId, sincronizacion, puedeEditar }: {
  conexionId: string
  sincronizacion: SincronizacionInventario | null
  puedeEditar: boolean
}) {
  const lineas = lineasResumen(sincronizacion?.resumen)
  const estilo = sincronizacion ? ESTILO_ESTADO[sincronizacion.estado] : null
  const referencia = sincronizacion ? (sincronizacion.terminada_en ?? sincronizacion.iniciada_en) : null

  return (
    <section aria-label="Estado de la sincronización" className="flex overflow-hidden rounded-2xl border border-border/70 bg-[var(--card-bg)]">
      <div aria-hidden="true" className={`w-1.5 shrink-0 ${estilo?.barra ?? 'bg-border'}`} />
      <div className="flex-1 min-w-0 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2 min-w-0">
            {sincronizacion && estilo && referencia ? (
              <>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${estilo.pastilla}`}>
                    <estilo.Icono className="w-3.5 h-3.5" aria-hidden="true" />
                    {ETIQUETA_ESTADO[sincronizacion.estado]}
                  </span>
                  <time dateTime={referencia} title={new Date(referencia).toLocaleString('es-CO')} className="text-sm font-semibold text-text">
                    {sincronizacion.terminada_en ? 'Actualizado' : 'Iniciada'} {haceCuanto(referencia)}
                  </time>
                </div>
                <p className="text-xs text-text-muted">
                  Fuente: <span className="font-semibold text-text">{ETIQUETA_FUENTE[sincronizacion.fuente]}</span>
                </p>
              </>
            ) : (
              <p className="flex items-center gap-2 text-sm text-text-muted">
                <CircleDashed className="w-4 h-4 shrink-0" aria-hidden="true" />
                Esta conexión todavía no se ha sincronizado.
              </p>
            )}
          </div>

          {puedeEditar ? <BotonSincronizar conexionId={conexionId} /> : (
            <p className="flex items-start gap-1.5 text-xs text-text-muted sm:max-w-[16rem]">
              <Eye className="w-3.5 h-3.5 shrink-0 mt-px" aria-hidden="true" />
              Solo lectura: sincronizar requiere permiso de edición en Geovisores.
            </p>
          )}
        </div>

        {sincronizacion?.error && (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-600/10 px-3 py-2 text-xs text-red-800 dark:text-red-300">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" aria-hidden="true" />
            {sincronizacion.error}
          </p>
        )}

        {sincronizacion?.fuente === 'ogc' && (
          <p className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/25 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
            <Info className="w-3.5 h-3.5 shrink-0 mt-px" aria-hidden="true" />
            {AVISO_SOLO_OGC}
          </p>
        )}

        {lineas.length > 0 && (
          <div>
            <h2 className="mb-2 text-[0.65rem] font-bold uppercase tracking-wider text-text-muted">Cambios de la última sincronización</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
              {lineas.map((l) => <Cambios key={l.tipo} linea={l} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
