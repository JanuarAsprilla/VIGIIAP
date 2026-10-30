import { ExternalLink, EyeOff } from 'lucide-react'
import type { RegistroBiodiversidad } from '../types'
import { traducirEvidencia } from '../lib/evidencia'
import { etiquetarLicencia } from '../lib/licencia'
import { urlDoi, urlRegistroGbif } from '../lib/enlaces'

const ENLACE_EXTERNO = { target: '_blank', rel: 'noopener noreferrer' } as const

/** Ubicación: si el servidor marca las coordenadas como ocultas (o no las envía) jamás se muestra
 *  ni se infiere un lugar; solo la insignia de reserva. */
export function Ubicacion({ r }: { r: RegistroBiodiversidad }) {
  if (r.coordenadas_ocultas) {
    return (
      <span className="bio-insignia bio-insignia-reservada" title="Especie amenazada o sin determinar: se protege su localización.">
        <EyeOff className="w-3 h-3" aria-hidden="true" />
        Ubicación reservada
      </span>
    )
  }
  if (r.latitud === null || r.longitud === null) return <span className="text-text-muted">Sin coordenadas</span>
  const fmt = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
  return (
    <span className="tabular-nums">
      {fmt.format(r.latitud)}, {fmt.format(r.longitud)}
      {r.incertidumbre_m !== null && <span className="block text-[0.6875rem] text-text-muted">± {new Intl.NumberFormat('es-CO').format(r.incertidumbre_m)} m</span>}
    </span>
  )
}

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

export default function TablaRegistros({ registros }: { registros: RegistroBiodiversidad[] }) {
  return (
    <div className="bio-tabla-caja" tabIndex={0} role="region" aria-label="Tabla de registros, desplazable">
      <table className="bio-tabla bio-reg">
        <caption className="sr-only">Registros individuales de la página actual</caption>
        <thead>
          <tr>
            {['Especie', 'Año', 'Evidencia', 'Municipio', 'Conjunto de datos', 'Licencia', 'Ubicación', 'GBIF'].map((t) => <th key={t} scope="col">{t}</th>)}
          </tr>
        </thead>
        <tbody>
          {registros.map((r) => {
            const gbif = urlRegistroGbif(r.gbif_id)
            return (
              <tr key={r.gbif_id}>
                <td data-etiqueta="Especie">
                  {r.especie ? <i className="font-semibold">{r.especie}</i> : <span className="text-text-muted">Sin especie determinada</span>}
                </td>
                <td data-etiqueta="Año" className="tabular-nums">{r.anio ?? '—'}</td>
                <td data-etiqueta="Evidencia">{traducirEvidencia(r.tipo_evidencia)}</td>
                <td data-etiqueta="Municipio">{r.municipio}<span className="block text-[0.6875rem] text-text-muted">{r.departamento}</span></td>
                <td data-etiqueta="Conjunto"><Conjunto r={r} /></td>
                <td data-etiqueta="Licencia"><Licencia url={r.licencia} /></td>
                <td data-etiqueta="Ubicación"><Ubicacion r={r} /></td>
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
