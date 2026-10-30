import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import type { MunicipioConteo } from './types'
import { ordenarMunicipios, type ColumnaMunicipios } from './lib/derivar'
import { fmtNum, fmtPct } from './lib/format'

interface Props {
  municipios: MunicipioConteo[]
  seleccionado: string | null
  onSeleccionar: (codigo: string) => void
}

const COLUMNAS: { clave: ColumnaMunicipios; titulo: string; numerica: boolean }[] = [
  { clave: 'municipio', titulo: 'Municipio', numerica: false },
  { clave: 'departamento', titulo: 'Departamento', numerica: false },
  { clave: 'registros', titulo: 'Registros', numerica: true },
  { clave: 'sin_especie', titulo: 'Sin especie', numerica: true },
]

export default function TablaMunicipios({ municipios, seleccionado, onSeleccionar }: Props) {
  const [columna, setColumna] = useState<ColumnaMunicipios>('registros')
  const [descendente, setDescendente] = useState(true)
  const filas = useMemo(() => ordenarMunicipios(municipios, columna, descendente), [municipios, columna, descendente])

  function alOrdenar(c: ColumnaMunicipios) {
    if (c === columna) setDescendente((d) => !d)
    else { setColumna(c); setDescendente(c === 'registros' || c === 'sin_especie') }
  }

  return (
    <div className="bio-tabla-caja" tabIndex={0} role="region" aria-label="Tabla de municipios, desplazable">
      <table className="bio-tabla">
        <caption className="sr-only">Registros por municipio. Activa un encabezado para ordenar.</caption>
        <thead>
          <tr>
            {COLUMNAS.map((c) => (
              <th key={c.clave} scope="col" className={c.numerica ? 'bio-num' : ''}
                aria-sort={c.clave === columna ? (descendente ? 'descending' : 'ascending') : 'none'}>
                <button type="button" className="bio-orden" onClick={() => alOrdenar(c.clave)}>
                  {c.titulo}
                  {c.clave !== columna ? <ArrowUpDown className="w-3 h-3 opacity-50" aria-hidden="true" />
                    : descendente ? <ArrowDown className="w-3 h-3" aria-hidden="true" /> : <ArrowUp className="w-3 h-3" aria-hidden="true" />}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((m) => (
            <tr key={m.codigo_municipal}>
              <td>
                <button type="button" aria-pressed={m.codigo_municipal === seleccionado}
                  className={`font-semibold text-left min-h-8 hover:underline ${m.codigo_municipal === seleccionado ? 'text-[var(--bio-sel)]' : 'text-text'}`}
                  onClick={() => onSeleccionar(m.codigo_municipal)}>
                  {m.municipio}
                </button>
              </td>
              <td className="text-text-muted">{m.departamento}</td>
              <td className="bio-num font-semibold">{fmtNum(m.registros)}</td>
              <td className="bio-num text-text-muted">
                {fmtNum(m.sin_especie)} <span className="text-[0.6875rem]">({fmtPct(m.sin_especie, m.registros)})</span>
              </td>
            </tr>
          ))}
          {filas.length === 0 && (
            <tr><td colSpan={4} className="text-center text-text-muted py-6">No hay municipios para mostrar.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
