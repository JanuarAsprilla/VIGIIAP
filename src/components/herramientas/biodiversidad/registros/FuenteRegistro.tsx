import { urlDoi } from '../lib/enlaces'
import type { RegistroBiodiversidad } from '../types'

const ENLACE = { target: '_blank', rel: 'noopener noreferrer' } as const

/** Conjunto de datos del registro con su DOI (solo si cumple el patrón). */
export default function FuenteRegistro({ r }: { r: Pick<RegistroBiodiversidad, 'conjunto' | 'doi_conjunto'> }) {
  const doi = urlDoi(r.doi_conjunto)
  return (
    <p className="bio-tarjeta-fuente">
      <span className="line-clamp-2" title={r.conjunto ?? undefined}>{r.conjunto ?? 'Conjunto sin título'}</span>
      {doi && (
        <a className="bio-enlace" href={doi} {...ENLACE} aria-label={`DOI del conjunto de datos ${r.doi_conjunto} (se abre en una pestaña nueva)`}>
          DOI {r.doi_conjunto}
        </a>
      )}
    </p>
  )
}
