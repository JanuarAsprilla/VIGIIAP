import { motion } from 'framer-motion'
import { GitCompareArrows } from 'lucide-react'
import { fadeUpSm } from '@/lib/animations'
import EstadoCarga from '@/components/admin/actividad/EstadoCarga'
import { useComparativa, type RangoFechas } from '@/hooks/useAnalitica'
import { formatoVariacion } from '@/lib/analiticaFormato'

interface FilaMetrica {
  clave: string
  etiqueta: string
  actual: string
  anterior: string
  variacion: string
  /** El rebote es la excepción: que suba es malo. */
  tono: 'bueno' | 'malo' | 'neutro'
}

function tonoDe(valor: number, subirEsBueno: boolean): FilaMetrica['tono'] {
  if (valor === 0) return 'neutro'
  return (valor > 0) === subirEsBueno ? 'bueno' : 'malo'
}

const CLASE_TONO: Record<FilaMetrica['tono'], string> = {
  bueno: 'bg-primary-700/10 text-primary-700',
  malo: 'bg-red-500/10 text-red-500',
  neutro: 'bg-bg-alt text-text-muted',
}

/** Métricas del sitio público frente al período anterior de igual duración. */
export default function ComparativaPeriodo({ rango }: { rango: RangoFechas }) {
  const { data, isLoading, isError } = useComparativa(rango)

  const completa = Boolean(data?.actual && data.anterior && data.variacion)
  const filas: FilaMetrica[] = data && completa ? [
    { clave: 'vistas', etiqueta: 'Páginas vistas', actual: String(data.actual.vistas), anterior: String(data.anterior.vistas), variacion: formatoVariacion(data.variacion.vistas, '%'), tono: tonoDe(data.variacion.vistas, true) },
    { clave: 'sesiones', etiqueta: 'Visitas (sesiones)', actual: String(data.actual.sesiones), anterior: String(data.anterior.sesiones), variacion: formatoVariacion(data.variacion.sesiones, '%'), tono: tonoDe(data.variacion.sesiones, true) },
    { clave: 'acciones', etiqueta: 'Acciones de los visitantes', actual: String(data.actual.acciones), anterior: String(data.anterior.acciones), variacion: formatoVariacion(data.variacion.acciones, '%'), tono: tonoDe(data.variacion.acciones, true) },
    { clave: 'rebote', etiqueta: 'Tasa de rebote', actual: `${data.actual.rebotePct} %`, anterior: `${data.anterior.rebotePct} %`, variacion: formatoVariacion(data.variacion.rebotePuntos, 'pts'), tono: tonoDe(data.variacion.rebotePuntos, false) },
  ] : []

  return (
    <motion.div {...fadeUpSm(0.1)} className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-5">
      <h3 className="section-title mb-1 flex items-center gap-2">
        <GitCompareArrows className="w-4 h-4 text-primary-700" /> Comparación con el Período Anterior
      </h3>
      <p className="text-xs text-text-muted mb-4">Compara el sitio público con el período anterior de igual duración; no incluye el panel de administración.</p>
      <EstadoCarga isLoading={isLoading} isError={isError} vacio={false} />
      {!isLoading && !isError && completa && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {filas.map((fila) => (
            <div key={fila.clave}>
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted">{fila.etiqueta}</p>
              <p className="text-2xl font-bold text-text mt-1">{fila.actual}</p>
              <p className="text-xs text-text-muted mt-0.5">{`antes: ${fila.anterior}`}</p>
              <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${CLASE_TONO[fila.tono]}`}>
                {fila.variacion}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
