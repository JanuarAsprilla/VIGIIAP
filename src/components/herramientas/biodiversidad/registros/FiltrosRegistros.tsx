import { useMemo } from 'react'
import { X } from 'lucide-react'
import CampoBusqueda from '../CampoBusqueda'
import FiltroConservacion from '../FiltroConservacion'
import { listarDepartamentos } from '../lib/derivar'
import type { Amenaza, MunicipioConteo, TipoConservacion } from '../types'

export interface ValoresFiltro {
  departamento: string | null
  municipio: string | null
  anioDesde: number | null
  anioHasta: number | null
  buscar: string
  conFoto: boolean
  conservacion: TipoConservacion | null
  amenaza: Amenaza | null
  especie: string | null
  nombreEspecie: string | null
}

type Cambios = Record<string, string | number | null>

interface Props {
  municipios: MunicipioConteo[]
  valores: ValoresFiltro
  desde: number
  hasta: number
  onCambio: (cambios: Cambios) => void
  onLimpiar: () => void
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="bio-eyebrow">{etiqueta}</span>
      {children}
    </label>
  )
}

export default function FiltrosRegistros({ municipios, valores, desde, hasta, onCambio, onLimpiar }: Props) {
  const departamentos = useMemo(() => listarDepartamentos(municipios), [municipios])
  const delDepto = useMemo(
    () => municipios.filter((m) => !valores.departamento || m.departamento === valores.departamento)
      .sort((a, b) => a.municipio.localeCompare(b.municipio, 'es')),
    [municipios, valores.departamento],
  )
  const anios = useMemo(() => Array.from({ length: Math.max(0, hasta - desde + 1) }, (_, i) => desde + i), [desde, hasta])
  const hayFiltros = Boolean(
    valores.departamento || valores.municipio || valores.anioDesde || valores.anioHasta || valores.buscar
    || valores.conFoto || valores.conservacion || valores.especie,
  )

  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()} aria-label="Filtros de registros">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_auto_minmax(0,1fr)] items-start">
        <CampoBusqueda etiqueta="Buscar especie" placeholder="Nombre científico" valor={valores.buscar} onCambio={(v) => onCambio({ buscar: v || null })} />
        <div className="flex flex-col gap-1">
          <span className="bio-eyebrow" id="bio-foto-filtro">Fotografías</span>
          <button type="button" role="switch" aria-checked={valores.conFoto} aria-labelledby="bio-foto-filtro" className="bio-interruptor"
            onClick={() => onCambio({ con_foto: valores.conFoto ? null : '1' })}>
            <span className="bio-interruptor-pista" aria-hidden="true"><span /></span>
            Solo con foto
          </button>
        </div>
        <FiltroConservacion conservacion={valores.conservacion} amenaza={valores.amenaza} onCambio={(c, a) => onCambio({ conservacion: c, amenaza: a })} />
      </div>
      {valores.especie && (
        <p className="bio-chip-filtro">
          <span>Especie: <i>{valores.nombreEspecie ?? valores.especie}</i></span>
          <button type="button" aria-label="Quitar el filtro de especie" onClick={() => onCambio({ especie: null, nombre_especie: null })}><X className="w-3.5 h-3.5" aria-hidden="true" /></button>
        </p>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] gap-3 items-end">
        <Campo etiqueta="Departamento">
          <select className="bio-campo" value={valores.departamento ?? ''} onChange={(e) => onCambio({ departamento: e.target.value || null, municipio: null })}>
            <option value="">Todos</option>
            {departamentos.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Municipio">
          <select className="bio-campo" value={valores.municipio ?? ''}
            onChange={(e) => {
              const m = municipios.find((x) => x.codigo_municipal === e.target.value)
              onCambio({ municipio: e.target.value || null, ...(m ? { departamento: m.departamento } : {}) })
            }}>
            <option value="">Todos</option>
            {delDepto.map((m) => <option key={m.codigo_municipal} value={m.codigo_municipal}>{m.municipio}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Año desde">
          <select className="bio-campo" value={valores.anioDesde ?? ''} onChange={(e) => onCambio({ anio_desde: e.target.value || null })}>
            <option value="">{desde}</option>
            {anios.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Año hasta">
          <select className="bio-campo" value={valores.anioHasta ?? ''} onChange={(e) => onCambio({ anio_hasta: e.target.value || null })}>
            <option value="">{hasta}</option>
            {anios.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Campo>
        <button type="button" className="bio-boton col-span-2 lg:col-span-1" disabled={!hayFiltros} onClick={onLimpiar}>
          Limpiar filtros
        </button>
      </div>
    </form>
  )
}
