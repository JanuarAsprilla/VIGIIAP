import { useMemo, useState } from 'react'
import type { MunicipioConteo } from './types'
import { resumenPorDepartamento } from './lib/derivar'
import { ETIQUETA_METRICA, type Metrica } from './lib/metrica'
import { admiteDepartamentos, rankingDepartamentos, rankingMunicipios, TITULO_RANKING } from './lib/ranking'

interface Props {
  municipios: MunicipioConteo[]
  metrica: Metrica
  seleccionado: string | null
  departamento: string | null
  onMunicipio: (codigo: string) => void
  onDepartamento: (nombre: string) => void
}

type Modo = 'municipios' | 'departamentos'
const TOP = 10

export default function RankingPanel({ municipios, metrica, seleccionado, departamento, onMunicipio, onDepartamento }: Props) {
  const [elegido, setModo] = useState<Modo>('municipios')
  const deptosOk = admiteDepartamentos(metrica)
  const modo: Modo = deptosOk ? elegido : 'municipios'

  const filas = useMemo(() => modo === 'municipios'
    ? rankingMunicipios(municipios, metrica, TOP)
    : rankingDepartamentos(resumenPorDepartamento(municipios), metrica, TOP), [modo, municipios, metrica])
  const maximo = Math.max(1, ...filas.map((f) => f.valor))
  const activa = (clave: string) => (modo === 'municipios' ? clave === seleccionado : clave === departamento && !seleccionado)

  return (
    <section className="bio-panel p-4 sm:p-5" aria-labelledby="bio-rank-titulo">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id="bio-rank-titulo" className="section-title">Ranking</h2>
          <p className="text-xs text-text-muted mt-0.5" aria-live="polite">
            {modo === 'municipios' ? TITULO_RANKING[metrica] : `Departamentos por ${ETIQUETA_METRICA[metrica].toLowerCase()}`}
          </p>
        </div>
        <div role="group" aria-label="Agrupar ranking por" className="flex gap-1.5">
          {(['municipios', 'departamentos'] as const).map((m) => (
            <button key={m} type="button" aria-pressed={modo === m} onClick={() => setModo(m)}
              disabled={m === 'departamentos' && !deptosOk}
              title={m === 'departamentos' && !deptosOk ? 'Las especies se repiten entre municipios y no se pueden sumar por departamento.' : undefined}
              className="bio-boton bio-boton-chico">
              {m === 'municipios' ? 'Municipios' : 'Departamentos'}
            </button>
          ))}
        </div>
      </div>
      {filas.length === 0 ? (
        <p className="text-sm text-text-muted mt-4">Este grupo no tiene datos para clasificar con esta medida.</p>
      ) : (
        <ol className="mt-3">
          {filas.map((f, i) => (
            <li key={f.clave}>
              <button type="button" className="bio-fila" aria-pressed={activa(f.clave)}
                onClick={() => (modo === 'municipios' ? onMunicipio(f.clave) : onDepartamento(f.clave))}>
                <span className="bio-fila-puesto">{i + 1}</span>
                <span className="min-w-0">
                  <span className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-text truncate">{f.nombre}</span>
                    <span className="text-[0.6875rem] text-text-muted truncate hidden sm:inline">{f.detalle}</span>
                  </span>
                  <span className="bio-riel block" aria-hidden="true">
                    <span className="bio-barra block" style={{ transform: `scaleX(${f.valor / maximo})` }} />
                  </span>
                </span>
                <span className="text-sm font-bold tabular-nums text-text">{f.texto}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
