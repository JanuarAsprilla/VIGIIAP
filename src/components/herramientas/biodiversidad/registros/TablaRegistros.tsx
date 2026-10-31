import { ExternalLink } from 'lucide-react'
import InsigniasConservacion from '../InsigniasConservacion'
import { traducirEvidencia } from '../lib/evidencia'
import { urlDoi, urlRegistroGbif } from '../lib/enlaces'
import { etiquetarLicencia } from '../lib/licencia'
import type { RegistroBiodiversidad } from '../types'
import AccionVerEnMapa from './AccionVerEnMapa'
import { Ubicacion } from './UbicacionRegistro'

export { Ubicacion }

const ENLACE_EXTERNO = { target: '_blank', rel: 'noopener noreferrer' } as const

function Conjunto({ r }: { r: RegistroBiodiversidad }) {
  const doi = urlDoi(r.doi_conjunto)
  return (
    <span className="block max-w-[22rem]">
      <span className="line-clamp-2">{r.conjunto ?? 'Conjunto sin título'}</span>
      {doi && (
        <a className="bio-enlace text-[0.6875rem]" href={doi} {...ENLACE_EXTERNO} aria-label={`DOI del conjunto de datos ${r.doi_conjunto} (se abre en una pestaña nueva)`}>
          DOI {r.doi_conjunto}
        </a>
      )}
    </span>
  )
}

function Licencia({ url }: { url: string | null }) {
  const l = etiquetarLicencia(url)
  return l.href
    ? <a className="bio-enlace whitespace-nowrap" href={l.href} {...ENLACE_EXTERNO}>{l.etiqueta}</a>
    : <span className="whitespace-nowrap">{l.etiqueta}</span>
}

interface Props {
  registros: RegistroBiodiversidad[]
  onAbrir?: (r: RegistroBiodiversidad, origen: HTMLElement) => void
  onVerEnMapa?: (r: RegistroBiodiversidad) => void
}

export default function TablaRegistros({ registros, onAbrir, onVerEnMapa }: Props) {
  return (
    <div className="bio-tabla-caja" tabIndex={0} role="region" aria-label="Tabla de registros, desplazable">
      <table className="bio-tabla bio-reg">
        <caption className="sr-only">Registros individuales de la página actual</caption>
        <thead>
          <tr>
            {['Especie', 'Año', 'Evidencia', 'Personas', 'Municipio', 'Conjunto de datos', 'Licencia', 'Ubicación', 'GBIF'].map((t) => <th key={t} scope="col">{t}</th>)}
          </tr>
        </thead>
        <tbody>
          {registros.map((r) => {
            const gbif = urlRegistroGbif(r.gbif_id)
            return (
              <tr key={r.gbif_id}>
                <td data-etiqueta="Especie">
                  <span className="block">
                    {onAbrir ? (
                      <button type="button" className="text-left hover:underline min-h-8" onClick={(e) => onAbrir(r, e.currentTarget)}
                        aria-label={`Ver detalle: ${r.especie ?? 'sin especie determinada'}, ${r.municipio}`}>
                        {r.especie ? <i className="font-semibold">{r.especie}</i> : <span className="text-text-muted">Sin especie determinada</span>}
                      </button>
                    ) : r.especie ? <i className="font-semibold">{r.especie}</i> : <span className="text-text-muted">Sin especie determinada</span>}
                  </span>
                  <InsigniasConservacion c={r} compacto />
                </td>
                <td data-etiqueta="Año" className="tabular-nums">{r.anio ?? '—'}</td>
                <td data-etiqueta="Evidencia">{traducirEvidencia(r.tipo_evidencia)}{r.fotos_total > 0 && <span className="block text-[0.6875rem] text-text-muted">{r.fotos_total} {r.fotos_total === 1 ? 'foto' : 'fotos'}</span>}</td>
                <td data-etiqueta="Personas">
                  {r.registrado_por ? <span className="block">Observó: {r.registrado_por}</span> : null}
                  {r.identificado_por ? <span className="block text-[0.6875rem] text-text-muted">Identificó: {r.identificado_por}</span> : null}
                  {!r.registrado_por && !r.identificado_por && <span className="text-text-muted">Sin indicar</span>}
                </td>
                <td data-etiqueta="Municipio">{r.municipio}<span className="block text-[0.6875rem] text-text-muted">{r.departamento}</span></td>
                <td data-etiqueta="Conjunto"><Conjunto r={r} /></td>
                <td data-etiqueta="Licencia"><Licencia url={r.licencia} /></td>
                <td data-etiqueta="Ubicación">
                  <Ubicacion r={r} />
                  {onVerEnMapa && <AccionVerEnMapa r={r} onVerEnMapa={onVerEnMapa} />}
                </td>
                <td data-etiqueta="GBIF">
                  {gbif ? (
                    <a className="bio-enlace inline-flex items-center gap-1" href={gbif} {...ENLACE_EXTERNO} aria-label={`Ver el registro ${r.gbif_id} en GBIF (se abre en una pestaña nueva)`}>
                      Ver <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  ) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
