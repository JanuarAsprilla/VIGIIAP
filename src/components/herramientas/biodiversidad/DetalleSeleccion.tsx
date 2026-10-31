import { X } from 'lucide-react'
import type { MunicipioConteo } from './types'
import type { ResumenDepartamento } from './lib/derivar'
import { fmtNum, fmtPct } from './lib/format'

interface Props {
  municipio: MunicipioConteo | null
  puesto: number | null
  totalGrupo: number
  departamento: ResumenDepartamento | null
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

export default function DetalleSeleccion({ municipio, puesto, totalGrupo, departamento, onLimpiar }: Props) {
  const titulo = municipio?.municipio ?? departamento?.departamento ?? null
  return (
    <section className="bio-panel p-4 sm:p-5" aria-labelledby="bio-sel-titulo" aria-live="polite">
      {!titulo ? (
        <>
          <p id="bio-sel-titulo" className="bio-eyebrow">Selección</p>
          <p className="text-sm text-text-muted mt-2">Elige un municipio en el mapa, en el ranking o en la tabla para ver su detalle y filtrar los registros.</p>
        </>
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
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
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
