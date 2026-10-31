import { motion } from 'framer-motion'
import { MousePointerClick } from 'lucide-react'
import { fadeUpSm } from '@/lib/animations'
import EstadoCarga from '@/components/admin/actividad/EstadoCarga'
import { useEventosTop, type RangoFechas } from '@/hooks/useAnalitica'

const ETIQUETA_EVENTO: Record<string, string> = {
  descarga_mapa: 'Descargas de mapas',
  descarga_documento: 'Descargas de documentos',
  abrir_geovisor: 'Geovisores abiertos',
  usar_herramienta: 'Herramientas usadas',
  buscar: 'Búsquedas',
  compartir: 'Compartidos',
}

/** Acciones concretas de los visitantes (descargar, abrir un geovisor, usar una herramienta) y lo más solicitado. */
export default function AccionesVisitantes({ rango }: { rango: RangoFechas }) {
  const { data, isLoading, isError } = useEventosTop(rango)
  const eventos = data?.eventos ?? []
  const recursos = data?.recursos ?? []

  return (
    <motion.div {...fadeUpSm(0.12)} className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-5">
      <h3 className="section-title mb-4 flex items-center gap-2">
        <MousePointerClick className="w-4 h-4 text-primary-700" /> Acciones de los Visitantes
      </h3>
      <EstadoCarga isLoading={isLoading} isError={isError} vacio={eventos.length === 0} />
      {!isLoading && !isError && eventos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ul className="space-y-2">
            {eventos.map((e) => (
              <li key={e.nombre} className="flex items-center justify-between text-sm border-b border-border/40 pb-1.5 last:border-0">
                <span className="text-text">{ETIQUETA_EVENTO[e.nombre] ?? e.nombre}</span>
                <span className="flex items-baseline gap-2">
                  <span className="font-semibold text-text">{e.total}</span>
                  <span className="text-[0.65rem] text-text-muted">{e.sesiones} visitantes</span>
                </span>
              </li>
            ))}
          </ul>
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-2">Lo más solicitado</p>
            {recursos.length === 0
              ? <p className="text-xs text-text-faint">Sin datos</p>
              : recursos.slice(0, 8).map((r) => (
                <div key={`${r.nombre}-${r.recurso}`} className="flex justify-between text-xs py-1 border-b border-border/40 last:border-0">
                  <span className="text-text truncate mr-2">{r.recurso}</span>
                  <span className="text-text-muted shrink-0">{r.total}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
