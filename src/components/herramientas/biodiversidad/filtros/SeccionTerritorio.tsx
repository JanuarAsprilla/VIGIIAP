import { useMemo } from 'react'
import { listarDepartamentos } from '../lib/derivar'
import type { CambiosUrl, Filtros } from '../lib/filtros'
import type { MunicipioConteo } from '../types'

interface Props {
  filtros: Filtros
  municipios: MunicipioConteo[]
  onCambio: (cambios: CambiosUrl) => void
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="bio-eyebrow">{etiqueta}</span>
      {children}
    </label>
  )
}

export default function SeccionTerritorio({ filtros, municipios, onCambio }: Props) {
  const departamentos = useMemo(() => listarDepartamentos(municipios), [municipios])
  const delDepto = useMemo(
    () => municipios.filter((m) => !filtros.departamento || m.departamento === filtros.departamento)
      .sort((a, b) => a.municipio.localeCompare(b.municipio, 'es')),
    [municipios, filtros.departamento],
  )
  return (
    <div className="grid gap-3">
      <Campo etiqueta="Departamento">
        <select className="bio-campo" value={filtros.departamento ?? ''} onChange={(e) => onCambio({ departamento: e.target.value || null, municipio: null })}>
          <option value="">Todos</option>
          {departamentos.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </Campo>
      <Campo etiqueta="Municipio">
        <select
          className="bio-campo" value={filtros.municipio ?? ''}
          onChange={(e) => {
            const m = municipios.find((x) => x.codigo_municipal === e.target.value)
            onCambio({ municipio: m ? m.codigo_municipal : null, ...(m ? { departamento: m.departamento } : {}) })
          }}
        >
          <option value="">Todos</option>
          {delDepto.map((m) => <option key={m.codigo_municipal} value={m.codigo_municipal}>{m.municipio}</option>)}
        </select>
      </Campo>
    </div>
  )
}
