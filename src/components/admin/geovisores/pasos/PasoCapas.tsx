import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { Loader2, Search, MapPinned, ChevronRight, Images } from 'lucide-react'
import Switch from '@/components/ui/Switch'
import { TituloPaso } from '../PasosGeovisor'
import {
  inputCls, labelCls, PALETA_AUTO, type CapaWorkspace, type FormState,
} from '../formState'
import type { TipoGeovisor } from '../tiposGeovisor'
import type { WorkspaceOption } from '@/types'
import type { FormErrors } from '@/types/forms'

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/** Paso 2: de qué conexión salen los datos y qué capas se muestran. */
export default function PasoCapas({
  form, setForm, errors, tipo, conexiones, workspaces, cargando, temasSeleccionados,
  temasExpandidos, onToggleTema, onToggleCapa, onToggleFicha, onSetColor,
}: {
  form: FormState
  setForm: Dispatch<SetStateAction<FormState>>
  errors: FormErrors
  tipo: TipoGeovisor
  conexiones: { id: string; nombre: string }[]
  workspaces: WorkspaceOption[]
  cargando: boolean
  temasSeleccionados: string[]
  temasExpandidos: Set<string>
  onToggleTema: (id: string) => void
  onToggleCapa: (capa: CapaWorkspace) => void
  onToggleFicha: (id: string) => void
  onSetColor: (workspaceId: string, color: string) => void
}) {
  const [filtro, setFiltro] = useState('')

  const grupos = useMemo(() => {
    const q = filtro.trim().toLowerCase()
    return workspaces
      .map((w) => ({
        ...w,
        capas: q ? w.capas.filter((c) => c.nombre.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)) : w.capas,
      }))
      .filter((w) => w.capas.length > 0)
  }, [workspaces, filtro])

  const seleccionadas = form.capasSeleccionadas.length

  return (
    <div className="space-y-4">
      <TituloPaso titulo="Conexión y capas"
        explicacion="Elige el servidor GeoServer y marca las capas que verá la gente. Las capas nuevas que se publiquen en el servidor aparecen aquí señaladas." />

      <div>
        <label htmlFor="gv-conexion" className={labelCls}>Conexión <span className="text-orange-500" aria-hidden="true">*</span></label>
        <select id="gv-conexion" value={form.conexionGeoserverId}
          onChange={(e) => setForm((f) => ({ ...f, conexionGeoserverId: e.target.value, capasSeleccionadas: [], capasConFicha: [], colorPorTema: {} }))}
          className={inputCls(!!errors.conexionGeoserverId)}>
          <option value="">Selecciona una conexión…</option>
          {conexiones.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        {errors.conexionGeoserverId && <p className="text-xs text-red-500 mt-1">{errors.conexionGeoserverId}</p>}
      </div>

      {!form.conexionGeoserverId ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 border border-dashed border-border rounded-xl text-center">
          <MapPinned className="w-6 h-6 text-text-faint" aria-hidden="true" />
          <p className="text-sm text-text-muted">Elige una conexión GeoServer para ver la vista previa en vivo de sus capas.</p>
        </div>
      ) : cargando ? (
        <p className="text-xs text-text-muted flex items-center gap-2 py-4"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Descubriendo capas…</p>
      ) : workspaces.length === 0 ? (
        <p className="text-xs text-text-muted py-4">Esta conexión no publica capas todavía.</p>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-faint" aria-hidden="true" />
            <input type="text" value={filtro} onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar capa por nombre…"
              className="w-full pl-8 pr-3 py-2 bg-[var(--card-bg)] border border-border rounded-lg text-xs focus:outline-none focus:border-primary-800 transition" />
          </div>

          {grupos.length === 0 ? (
            <p className="text-xs text-text-muted py-3 text-center">Ninguna capa coincide con "{filtro}".</p>
          ) : (
            <div className="space-y-2">
              {grupos.map((w, i) => {
                const activo = temasSeleccionados.includes(w.id)
                const color = form.colorPorTema[w.id] ?? PALETA_AUTO[i % PALETA_AUTO.length]
                const nuevas = w.capas.filter((c) => c.nueva).length
                // Con filtro de búsqueda activo se fuerza abierto para que los
                // resultados sean visibles de inmediato, sin un clic extra.
                const abierto = filtro.trim() !== '' || temasExpandidos.has(w.id)
                return (
                  <div key={w.id} className={`border rounded-lg overflow-hidden transition-colors ${activo ? 'border-primary-600 bg-primary-600/5' : 'border-border'}`}>
                    <div
                      role="button" tabIndex={0} aria-expanded={abierto}
                      onClick={() => onToggleTema(w.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleTema(w.id) } }}
                      className="flex items-center gap-2.5 p-2.5 cursor-pointer select-none">
                      <ChevronRight aria-hidden="true"
                        className={`w-3.5 h-3.5 text-text-faint shrink-0 transition-transform ${abierto ? 'rotate-90' : ''}`} />
                      <span className="text-[0.62rem] font-bold uppercase tracking-wider text-text-faint flex-1 truncate">{w.nombre}</span>
                      {nuevas > 0 && (
                        <span className="rounded-full bg-accent/15 text-primary-800 px-1.5 py-0.5 text-[0.55rem] font-bold shrink-0">
                          {nuevas} {nuevas === 1 ? 'nueva' : 'nuevas'}
                        </span>
                      )}
                      <span className="text-[0.58rem] text-text-muted shrink-0">
                        {w.capas.length} capa{w.capas.length === 1 ? '' : 's'}
                      </span>
                      {activo && (
                        <>
                          <input type="color" value={color} onClick={(e) => e.stopPropagation()}
                            onChange={(e) => onSetColor(w.id, e.target.value)}
                            aria-label={`Color de ${w.nombre}`}
                            className="w-5 h-5 rounded-md border border-border cursor-pointer shrink-0" />
                          <span className="text-[0.58rem] text-text-muted font-mono shrink-0">{color}</span>
                        </>
                      )}
                    </div>
                    {abierto && (
                      <div className="space-y-1 px-2.5 pb-2.5">
                        {w.capas.map((c) => {
                          const marcada = form.capasSeleccionadas.includes(c.id)
                          const conFicha = form.capasConFicha.includes(c.id)
                          return (
                            <div key={c.id}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                                marcada ? 'bg-primary-600/8 text-primary-800' : 'hover:bg-bg-alt text-text'
                              }`}>
                              <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                                <input type="checkbox" checked={marcada} onChange={() => onToggleCapa(c)}
                                  className="w-3.5 h-3.5 rounded border-border text-primary-800 focus:ring-primary-800/30 shrink-0" />
                                <span className="truncate flex-1">{c.nombre}</span>
                                {c.nueva && (
                                  <span className="rounded-full bg-accent/15 text-primary-800 px-1.5 py-0.5 text-[0.55rem] font-bold shrink-0">Nueva</span>
                                )}
                              </label>
                              <span className={`text-[0.55rem] font-semibold uppercase px-1.5 py-0.5 rounded-full shrink-0 ${
                                c.tipo === 'raster' ? 'bg-gold-500/12 text-gold-500' : 'bg-primary-500/12 text-primary-500'
                              }`}>{c.tipo === 'raster' ? 'raster' : 'vector'}</span>
                              {tipo === 'fichas' && c.tipo === 'raster' && (
                                <span className="text-[0.58rem] text-text-faint shrink-0">sin fichas</span>
                              )}
                              {tipo === 'fichas' && marcada && c.tipo === 'vectorial' && (
                                <button type="button" onClick={() => onToggleFicha(c.id)} aria-pressed={conFicha}
                                  title={conFicha ? 'Esta capa exige fichas — clic para quitarlas' : 'Exigir fichas en esta capa'}
                                  className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[0.58rem] font-semibold transition-colors ${
                                    conFicha ? 'text-gold-500 bg-gold-500/12' : 'text-text-muted bg-bg-alt hover:text-text'
                                  }`}>
                                  <Images className="w-3 h-3" aria-hidden="true" />
                                  {conFicha ? 'Con fichas' : 'Sin fichas'}
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <p className="text-[0.65rem] text-text-muted" aria-live="polite">
            {seleccionadas === 0
              ? 'Sin selección — el geovisor mostrará todas las capas de esta conexión.'
              : `${plural(seleccionadas, 'capa seleccionada', 'capas seleccionadas')}, de ${plural(temasSeleccionados.length, 'tema distinto', 'temas distintos')}.`}
          </p>

          {tipo === 'fichas' && form.capasConFicha.length === 0 && (
            <p className="text-[0.65rem] text-gold-500 leading-snug">
              Marca al menos una capa vectorial: cada una exigirá foto o video y descripción en todos sus puntos.
            </p>
          )}

          {seleccionadas > 0 && (
            <div className="flex items-start justify-between gap-3 pt-1 border-t border-border">
              <div className="pt-3">
                <span className="text-sm text-text">Mostrar automáticamente las capas nuevas de estos temas</span>
                <p className="text-[0.65rem] text-text-muted leading-snug">
                  Cuando se publique una capa nueva en GeoServer dentro de {temasSeleccionados.length === 1 ? 'este tema' : 'estos temas'}, aparece sola en el visor, sin editar el geovisor. Las capas de comunidades étnicas nunca se muestran.
                </p>
              </div>
              <div className="pt-3">
                <Switch
                  checked={form.incluirCapasNuevas}
                  onChange={(v) => setForm((f) => ({ ...f, incluirCapasNuevas: v }))}
                  label="Mostrar automáticamente las capas nuevas de estos temas"
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
