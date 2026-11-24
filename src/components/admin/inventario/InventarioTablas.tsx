import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { Search } from 'lucide-react'
import type { InventarioGeoserver } from '@/types'
import { coincideBusqueda } from '@/lib/inventarioGeoserver'
import Switch from '@/components/ui/Switch'
import TablaDatos, { type ColumnaTabla } from './TablaDatos'
import { columnasCapas, columnasEspacios, columnasEstilos, columnasGrupos } from './columnasInventario'

type Pestana = 'espacios' | 'capas' | 'grupos' | 'estilos'

const PESTANAS: ReadonlyArray<{ id: Pestana; etiqueta: string; tabla: string; vacio: string }> = [
  { id: 'espacios', etiqueta: 'Espacios de trabajo', tabla: 'Espacios de trabajo', vacio: 'espacios de trabajo' },
  { id: 'capas',    etiqueta: 'Capas',               tabla: 'Capas',               vacio: 'capas' },
  { id: 'grupos',   etiqueta: 'Grupos',              tabla: 'Grupos de capas',     vacio: 'grupos de capas' },
  { id: 'estilos',  etiqueta: 'Estilos',             tabla: 'Estilos',             vacio: 'estilos' },
]

interface Vista<T> {
  filas: T[]
  columnas: ColumnaTabla<T>[]
  clave: (f: T) => string
  claseFila?: (f: T) => string
  campos: (f: T) => Array<string | null | undefined>
}

const borrarTipo = <T,>(v: Vista<T>) => v as unknown as Vista<unknown>

function vistaDe(pestana: Pestana, inv: InventarioGeoserver, conEliminadas: boolean): Vista<unknown> {
  switch (pestana) {
    case 'espacios': return borrarTipo({ filas: inv.espacios, columnas: columnasEspacios, clave: (e) => e.nombre,
      campos: (e) => [e.nombre, e.titulo, e.resumen] })
    case 'capas': return borrarTipo({ filas: inv.capas.filter((c) => conEliminadas || !c.eliminado_en), columnas: columnasCapas,
      clave: (c) => c.capa_id, claseFila: (c) => (c.eliminado_en ? 'bg-red-600/[0.05] text-text-muted' : ''),
      campos: (c) => [c.capa_id, c.titulo, c.nombre, c.espacio, c.estilo_defecto, c.resumen, ...(c.palabras_clave ?? [])] })
    case 'grupos': return borrarTipo({ filas: inv.grupos, columnas: columnasGrupos, clave: (g) => g.grupo_id,
      campos: (g) => [g.grupo_id, g.titulo, g.nombre, g.espacio, g.modo, ...(g.miembros ?? [])] })
    case 'estilos': return borrarTipo({ filas: inv.estilos, columnas: columnasEstilos, clave: (e) => `${e.espacio ?? ''}:${e.nombre}`,
      campos: (e) => [e.nombre, e.espacio, e.formato] })
  }
}

const cantidad = (p: Pestana, inv: InventarioGeoserver, conEliminadas: boolean) =>
  p === 'capas' && !conEliminadas ? inv.capas.filter((c) => !c.eliminado_en).length : inv[p].length

export default function InventarioTablas({ inventario }: { inventario: InventarioGeoserver }) {
  const [activa, setActiva] = useState<Pestana>('espacios')
  const [busqueda, setBusqueda] = useState('')
  const [conEliminadas, setConEliminadas] = useState(false)
  const idBase = useId()
  const refs = useRef<Partial<Record<Pestana, HTMLButtonElement | null>>>({})

  const config = PESTANAS.find((p) => p.id === activa)!
  const vista = vistaDe(activa, inventario, conEliminadas)
  const visibles = vista.filas.filter((f) => coincideBusqueda(vista.campos(f), busqueda))
  const buscando = busqueda.trim().length > 0
  const totalEliminadas = inventario.capas.filter((c) => c.eliminado_en).length

  const moverFoco = (e: KeyboardEvent, indice: number) => {
    const destino = e.key === 'ArrowRight' ? (indice + 1) % PESTANAS.length
      : e.key === 'ArrowLeft' ? (indice - 1 + PESTANAS.length) % PESTANAS.length
      : e.key === 'Home' ? 0 : e.key === 'End' ? PESTANAS.length - 1 : -1
    if (destino < 0) return
    e.preventDefault()
    const siguiente = PESTANAS[destino].id
    setActiva(siguiente)
    refs.current[siguiente]?.focus()
  }

  return (
    <section aria-label="Inventario" className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div role="tablist" aria-label="Tipos de inventario" className="flex flex-wrap gap-1 border-b border-border/70 lg:border-b-0">
          {PESTANAS.map((p, i) => {
            const seleccionada = p.id === activa
            return (
              <button key={p.id} type="button" role="tab" id={`${idBase}-${p.id}`} aria-selected={seleccionada} aria-controls={`${idBase}-panel`}
                tabIndex={seleccionada ? 0 : -1} ref={(el) => { refs.current[p.id] = el }}
                onClick={() => setActiva(p.id)} onKeyDown={(e) => moverFoco(e, i)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 ${
                  seleccionada ? 'border-primary-700 text-primary-800' : 'border-transparent text-text-muted hover:text-text'
                }`}>
                <span>{p.etiqueta}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold tabular-nums ${seleccionada ? 'bg-primary-700/12 text-primary-800' : 'bg-bg-alt text-text-muted'}`}>{cantidad(p.id, inventario, conEliminadas)}</span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {activa === 'capas' && totalEliminadas > 0 && (
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-text">
              <Switch checked={conEliminadas} onChange={setConEliminadas} label="Incluir eliminados" />
              Incluir eliminados ({totalEliminadas})
            </label>
          )}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" aria-hidden="true" />
            <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar en el inventario"
              placeholder={`Buscar en ${config.vacio}`}
              className="w-full sm:w-64 pl-8 pr-3 py-2 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 focus:border-primary-800 transition" />
          </div>
          {buscando && <p role="status" className="text-xs text-text-muted tabular-nums">{visibles.length} de {vista.filas.length}</p>}
        </div>
      </div>

      <div role="tabpanel" id={`${idBase}-panel`} aria-labelledby={`${idBase}-${activa}`}>
        {vista.filas.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-[var(--card-bg)] px-4 py-10 text-center text-sm text-text-muted">
            Esta conexión no tiene {config.vacio} sincronizados.
          </p>
        ) : visibles.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-[var(--card-bg)] px-4 py-10 text-center text-sm text-text-muted">
            Nada coincide con «{busqueda.trim()}» en {config.vacio}.
          </p>
        ) : (
          <TablaDatos nombre={config.tabla} columnas={vista.columnas as ColumnaTabla<unknown>[]} filas={visibles} clave={vista.clave} claseFila={vista.claseFila} />
        )}
      </div>
    </section>
  )
}
