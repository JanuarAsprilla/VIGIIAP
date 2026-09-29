import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  X, Loader2, Search, CircleCheck, CircleAlert, Circle, Trash2, AlertTriangle,
} from 'lucide-react'
import { panelAnim } from '@/lib/animations'
import { useFeaturesFichas, useDeleteFicha } from '@/hooks/useFichasPunto'
import FichaPuntoEditor from './FichaPuntoEditor'
import type { FeatureFichaEstado, EstadoFeatureFicha } from '@/types'

type Filtro = 'pendientes' | 'todas' | 'completas' | 'huerfanas' | 'sin_identificador'

const TABS: { id: Filtro; label: string }[] = [
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'todas', label: 'Todas' },
  { id: 'completas', label: 'Completas' },
  { id: 'huerfanas', label: 'Huérfanas' },
  { id: 'sin_identificador', label: 'Sin identificador' },
]

const ESTADO_ICONO: Record<EstadoFeatureFicha, { Icon: typeof CircleCheck; className: string }> = {
  completa:   { Icon: CircleCheck, className: 'text-primary-600' },
  incompleta: { Icon: CircleAlert, className: 'text-gold-500' },
  sin_ficha:  { Icon: Circle,      className: 'text-text-faint' },
}

/**
 * Checklist de fichas de una capa: lista todos sus puntos/polígonos con su
 * estado de completitud (izquierda) y el editor de la ficha seleccionada
 * (derecha). Llenar 200 fichas una por una es el mayor riesgo de UX de toda
 * esta funcionalidad -- por eso "Guardar y siguiente pendiente" avanza sin
 * tener que volver a hacer clic en la lista cada vez.
 */
export default function FichasCapaModal({ configId, capaNombre, onClose }: {
  configId: string
  capaNombre: string
  onClose: () => void
}) {
  const { data, isLoading } = useFeaturesFichas(configId)
  const deleteFicha = useDeleteFicha(configId)

  const [filtro, setFiltro] = useState<Filtro>('pendientes')
  const [busqueda, setBusqueda] = useState('')
  const [seleccionado, setSeleccionado] = useState<string | null>(
    () => data?.features.find((f) => f.estado !== 'completa')?.valor ?? null,
  )
  const [dataAnterior, setDataAnterior] = useState(data)

  // Preselecciona la primera pendiente en cuanto llega la respuesta -- para no
  // obligar a un clic extra antes de poder empezar a llenar fichas. Ajustado
  // durante el render, no en un efecto (evita el re-render extra); guardado
  // detrás de `!seleccionado` para que solo pase al llegar la primera
  // respuesta, no en cada refetch posterior.
  if (data !== dataAnterior) {
    setDataAnterior(data)
    if (data && !seleccionado) {
      const primeraPendiente = data.features.find((f) => f.estado !== 'completa')
      if (primeraPendiente) setSeleccionado(primeraPendiente.valor)
    }
  }

  const todosPendientes = useMemo(() => data?.features.filter((f) => f.estado !== 'completa') ?? [], [data])

  const conteos = useMemo(() => {
    if (!data) return { todas: 0, pendientes: 0, completas: 0 }
    const completas = data.features.filter((f) => f.estado === 'completa').length
    return { todas: data.features.length, completas, pendientes: data.features.length - completas }
  }, [data])

  const filtrados = useMemo(() => {
    if (!data) return []
    const q = busqueda.trim().toLowerCase()
    const coincide = (f: FeatureFichaEstado) => !q || f.valor.toLowerCase().includes(q) || (f.etiqueta ?? '').toLowerCase().includes(q)
    switch (filtro) {
      case 'todas':      return data.features.filter(coincide)
      case 'completas':  return data.features.filter((f) => f.estado === 'completa').filter(coincide)
      case 'pendientes': return todosPendientes.filter(coincide)
      default:           return []
    }
  }, [data, filtro, busqueda, todosPendientes])

  const featureSeleccionada = data?.features.find((f) => f.valor === seleccionado) ?? null

  // Cíclico: al llegar a la última pendiente, vuelve a la primera en vez de
  // dejar la selección en null -- con 200 fichas por llenar, un callejón sin
  // salida sin decir cuáles faltan sería peor que simplemente dar la vuelta.
  const irASiguientePendiente = () => {
    if (todosPendientes.length === 0) { setSeleccionado(null); return }
    const idx = todosPendientes.findIndex((f) => f.valor === seleccionado)
    const siguiente = todosPendientes[(idx + 1) % todosPendientes.length]
    setSeleccionado(siguiente.valor)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div {...panelAnim}
        className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-4xl my-8 flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h3 className="text-base font-bold text-text">Fichas de "{capaNombre}"</h3>
            {data && (
              <p className="text-xs text-text-muted mt-0.5">
                {conteos.completas}/{conteos.todas} completas
                {data.huerfanas.length > 0 && ` · ${data.huerfanas.length} huérfana${data.huerfanas.length === 1 ? '' : 's'}`}
                {data.sinIdentificador.length > 0 && ` · ${data.sinIdentificador.length} sin identificador`}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
          </div>
        ) : !data ? null : (
          <div className="flex-1 min-h-0 flex flex-col sm:flex-row">
            {/* ── Panel izquierdo: lista ── */}
            <div className="sm:w-[22rem] shrink-0 flex flex-col min-h-0 border-b sm:border-b-0 sm:border-r border-border">
              <div className="p-3 space-y-2 border-b border-border shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-faint" aria-hidden="true" />
                  <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por identificador o etiqueta…"
                    className="w-full pl-8 pr-3 py-2 bg-bg-alt border border-border rounded-lg text-xs focus:outline-none focus:border-primary-800 transition" />
                </div>
                <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filtrar fichas">
                  {TABS.map((t) => (
                    <button key={t.id} type="button" role="tab" aria-selected={filtro === t.id}
                      onClick={() => setFiltro(t.id)}
                      className={`px-2.5 py-1 rounded-full text-[0.65rem] font-semibold transition-colors ${
                        filtro === t.id ? 'bg-primary-800 text-white' : 'bg-bg-alt text-text-muted hover:text-text'
                      }`}>
                      {t.label}
                      {t.id === 'pendientes' && ` (${conteos.pendientes})`}
                      {t.id === 'todas' && ` (${conteos.todas})`}
                      {t.id === 'completas' && ` (${conteos.completas})`}
                      {t.id === 'huerfanas' && ` (${data.huerfanas.length})`}
                      {t.id === 'sin_identificador' && ` (${data.sinIdentificador.length})`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filtro === 'huerfanas' ? (
                  data.huerfanas.length === 0 ? (
                    <p className="text-xs text-text-muted text-center py-8 px-4">Ninguna ficha huérfana.</p>
                  ) : (
                    <ul>
                      {data.huerfanas.map((h) => (
                        <li key={h.valor} className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-border/60">
                          <div className="min-w-0">
                            <p className="text-xs font-mono text-text truncate">{h.valor}</p>
                            <p className="text-[0.6rem] text-text-muted">{h.nMedios} medio{h.nMedios === 1 ? '' : 's'} — ya no existe en la capa</p>
                          </div>
                          <button type="button" onClick={() => deleteFicha.mutate(h.valor)} title="Eliminar ficha huérfana"
                            className="shrink-0 p-1.5 rounded-md text-text-muted hover:text-red-dark hover:bg-red/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )
                ) : filtro === 'sin_identificador' ? (
                  data.sinIdentificador.length === 0 ? (
                    <p className="text-xs text-text-muted text-center py-8 px-4">Todas las features tienen identificador.</p>
                  ) : (
                    <ul>
                      {data.sinIdentificador.map((s) => (
                        <li key={s.fid} className="flex items-center gap-2 px-3 py-2.5 border-b border-border/60">
                          <AlertTriangle className="w-3.5 h-3.5 text-gold-500 shrink-0" aria-hidden="true" />
                          <div className="min-w-0">
                            <p className="text-xs text-text truncate">{s.etiqueta || 'Sin etiqueta'}</p>
                            <p className="text-[0.6rem] text-text-muted font-mono truncate">{s.fid} — corrige el atributo en GeoServer</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )
                ) : filtrados.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-8 px-4">
                    {busqueda ? `Ninguna coincide con "${busqueda}".` : 'Nada en este filtro.'}
                  </p>
                ) : (
                  <ul>
                    {filtrados.map((f) => {
                      const { Icon, className } = ESTADO_ICONO[f.estado]
                      const activo = f.valor === seleccionado
                      return (
                        <li key={f.valor}>
                          <button type="button" onClick={() => setSeleccionado(f.valor)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 border-b border-border/60 text-left transition-colors ${
                              activo ? 'bg-primary-600/8' : 'hover:bg-bg-alt'
                            }`}>
                            <Icon className={`w-4 h-4 shrink-0 ${className}`} aria-hidden="true" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-text truncate">{f.etiqueta || f.valor}</p>
                              {f.etiqueta && <p className="text-[0.6rem] text-text-muted font-mono truncate">{f.valor}</p>}
                            </div>
                            <span className="text-[0.6rem] text-text-muted shrink-0 font-mono">{f.nImagenes}📷 {f.nVideos}▶</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* ── Panel derecho: editor ── */}
            {featureSeleccionada ? (
              <FichaPuntoEditor
                key={featureSeleccionada.valor}
                configId={configId}
                feature={featureSeleccionada}
                onGuardado={() => {}}
                onGuardarYSiguiente={irASiguientePendiente}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <p className="text-sm text-text-muted">
                  {todosPendientes.length === 0 ? '¡Todas las fichas están completas!' : 'Elige un punto de la lista para editarlo.'}
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
