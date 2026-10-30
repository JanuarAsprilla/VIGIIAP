import { useState } from 'react'
import type { MunicipioConteo } from './types'
import { resumenPorDepartamento, topMunicipios } from './lib/derivar'
import { fmtNum } from './lib/format'

interface Props {
  municipios: MunicipioConteo[]
  seleccionado: string | null
  departamento: string | null
  onMunicipio: (codigo: string) => void
  onDepartamento: (nombre: string) => void
}

type Modo = 'municipios' | 'departamentos'
const TOP = 10

interface Fila {
  clave: string
  nombre: string
  detalle: string
  valor: number
  activa: boolean
  elegir: () => void
}

export default function RankingPanel({ municipios, seleccionado, departamento, onMunicipio, onDepartamento }: Props) {
  const [modo, setModo] = useState<Modo>('municipios')

  const filas: Fila[] = modo === 'municipios'
    ? topMunicipios(municipios, TOP).map((m) => ({
        clave: m.codigo_municipal, nombre: m.municipio, detalle: m.departamento, valor: m.registros,
        activa: m.codigo_municipal === seleccionado, elegir: () => onMunicipio(m.codigo_municipal),
      }))
    : resumenPorDepartamento(municipios).filter((d) => d.registros > 0).slice(0, TOP).map((d) => ({
        clave: d.departamento, nombre: d.departamento, detalle: `${d.municipiosConRegistros} de ${d.totalMunicipios} municipios`,
        valor: d.registros, activa: d.departamento === departamento && !seleccionado, elegir: () => onDepartamento(d.departamento),
      }))
  const maximo = Math.max(1, ...filas.map((f) => f.valor))

  return (
    <section className="bio-panel p-4 sm:p-5" aria-labelledby="bio-rank-titulo">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="bio-rank-titulo" className="section-title">Ranking</h2>
        <div role="group" aria-label="Agrupar ranking por" className="flex gap-1.5">
          {(['municipios', 'departamentos'] as const).map((m) => (
            <button key={m} type="button" aria-pressed={modo === m} onClick={() => setModo(m)}
              className="bio-boton bio-boton-chico">
              {m === 'municipios' ? 'Municipios' : 'Departamentos'}
            </button>
          ))}
        </div>
      </div>
      {filas.length === 0 ? (
        <p className="text-sm text-text-muted mt-4">Este grupo no tiene registros para clasificar.</p>
      ) : (
        <ol className="mt-3">
          {filas.map((f, i) => (
            <li key={f.clave}>
              <button type="button" className="bio-fila" aria-pressed={f.activa} onClick={f.elegir}>
                <span className="text-xs font-bold text-text-muted tabular-nums">{i + 1}</span>
                <span className="min-w-0">
                  <span className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-text truncate">{f.nombre}</span>
                    <span className="text-[0.6875rem] text-text-muted truncate hidden sm:inline">{f.detalle}</span>
                  </span>
                  <span className="bio-riel block" aria-hidden="true">
                    <span className="bio-barra block" style={{ transform: `scaleX(${f.valor / maximo})` }} />
                  </span>
                </span>
                <span className="text-sm font-bold tabular-nums text-text">{fmtNum(f.valor)}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
