import { useMemo } from 'react'
import type { MunicipioConteo } from '../types'
import { listarDepartamentos } from '../lib/derivar'

export interface ValoresFiltro {
  departamento: string | null
  municipio: string | null
  anioDesde: number | null
  anioHasta: number | null
}

interface Props {
  municipios: MunicipioConteo[]
  valores: ValoresFiltro
  desde: number
  hasta: number
  onCambio: (cambios: Partial<Record<'departamento' | 'municipio' | 'anio_desde' | 'anio_hasta', string | null>>) => void
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
  const hayFiltros = Boolean(valores.departamento || valores.municipio || valores.anioDesde || valores.anioHasta)

  return (
    <form className="grid grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] gap-3 items-end" onSubmit={(e) => e.preventDefault()} aria-label="Filtros de registros">
      <Campo etiqueta="Departamento">
        <select className="bio-campo" value={valores.departamento ?? ''}
          onChange={(e) => onCambio({ departamento: e.target.value || null, municipio: null })}>
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
    </form>
  )
}
