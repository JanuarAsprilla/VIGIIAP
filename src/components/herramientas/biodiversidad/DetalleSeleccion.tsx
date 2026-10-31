import { Sparkles, X } from 'lucide-react'
import type { MunicipioConteo } from './types'
import type { ResumenDepartamento } from './lib/derivar'
import { fmtNum, fmtPct } from './lib/format'

interface Props {
  municipio: MunicipioConteo | null
  puesto: number | null
  totalGrupo: number
  departamento: ResumenDepartamento | null
  destacado: MunicipioConteo | null
  onElegir: (codigo: string) => void
  onLimpiar: () => void
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="bio-eyebrow">{etiqueta}</dt>
      <dd className="bio-cifra text-xl mt-1.5">{valor}</dd>
    </div>
  )
}

export default function DetalleSeleccion({ municipio, puesto, totalGrupo, departamento, destacado, onElegir, onLimpiar }: Props) {
  const titulo = municipio?.municipio ?? departamento?.departamento ?? null
  return (
    <section className="bio-panel p-4 sm:p-5" aria-labelledby="bio-sel-titulo" aria-live="polite">
      {!titulo ? (
        <div className="bio-sel-vacia">
          <div>
            <p id="bio-sel-titulo" className="bio-eyebrow">Selección</p>
            <p className="font-display text-lg font-bold text-text mt-1">Aún no hay un municipio elegido</p>
            <p className="text-sm text-text-muted mt-1">Elige uno en el mapa, en el ranking o en la tabla para ver su detalle y filtrar registros y especies.</p>
          </div>
          {destacado && (
            <button type="button" className="bio-sel-atajo" onClick={() => onElegir(destacado.codigo_municipal)}>
              <Sparkles className="w-4 h-4 text-[var(--bio-acento)]" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-xs text-text-muted">Para empezar: el municipio con más registros</span>
                <span className="block text-sm font-semibold text-text truncate">{destacado.municipio} <span className="text-text-muted font-normal">· {destacado.departamento}</span></span>
              </span>
              <b className="text-sm text-text">{fmtNum(destacado.registros)}</b>
            </button>
          )}
          <p className="bio-teclas text-xs text-text-muted">Con el teclado: enfoca el mapa, <kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd> para recorrerlo y <kbd>Enter</kbd> para elegir.</p>
        </div>
      ) : (
        <div className="bio-entra">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="bio-eyebrow">{municipio ? 'Municipio seleccionado' : 'Departamento seleccionado'}</p>
              <h3 id="bio-sel-titulo" className="section-title mt-1 truncate">{titulo}</h3>
              {municipio && <p className="text-xs text-text-muted">{municipio.departamento}</p>}
            </div>
            <button type="button" className="bio-boton shrink-0" onClick={onLimpiar} aria-label="Quitar selección">
              <X className="w-4 h-4" aria-hidden="true" />
              Quitar
            </button>
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 min-[90rem]:grid-cols-4 gap-4 mt-4">
            {municipio ? (
              <>
                <Dato etiqueta="Registros" valor={fmtNum(municipio.registros)} />
                <Dato etiqueta="Especies" valor={fmtNum(municipio.especies)} />
                <Dato etiqueta="Del grupo" valor={fmtPct(municipio.registros, totalGrupo)} />
                <Dato etiqueta="Puesto" valor={puesto ? `#${puesto}` : '—'} />
              </>
            ) : departamento ? (
              <>
                <Dato etiqueta="Registros" valor={fmtNum(departamento.registros)} />
                <Dato etiqueta="Del grupo" valor={fmtPct(departamento.registros, totalGrupo)} />
                <Dato etiqueta="Municipios" valor={`${departamento.municipiosConRegistros}/${departamento.totalMunicipios}`} />
              </>
            ) : null}
          </dl>
        </div>
      )}
    </section>
  )
}
