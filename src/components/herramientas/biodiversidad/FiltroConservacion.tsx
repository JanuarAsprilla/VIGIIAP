import { AYUDA_ENDEMICA, CATEGORIAS_AMENAZA, NOMBRE_AMENAZA, NOMBRE_TIPO, TIPOS_CONSERVACION } from './lib/conservacion'
import type { Amenaza, TipoConservacion } from './types'

interface Props {
  conservacion: TipoConservacion | null
  amenaza: Amenaza | null
  onCambio: (c: TipoConservacion | null, a: Amenaza | null) => void
  deshabilitado?: boolean
}

/** Filtro de conservación en dos niveles: tipo y, para amenazadas, categoría UICN. */
export default function FiltroConservacion({ conservacion, amenaza, onCambio, deshabilitado = false }: Props) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <span className="bio-eyebrow" id="bio-cons-filtro">Conservación</span>
      <div role="group" aria-labelledby="bio-cons-filtro" className="flex flex-wrap gap-1.5">
        <button type="button" className="bio-boton bio-boton-chico" disabled={deshabilitado} aria-pressed={conservacion === null} onClick={() => onCambio(null, null)}>Todas</button>
        {TIPOS_CONSERVACION.map((t) => (
          <button key={t} type="button" className="bio-boton bio-boton-chico" disabled={deshabilitado} aria-pressed={conservacion === t} title={t === 'endemica' ? AYUDA_ENDEMICA : undefined} onClick={() => onCambio(conservacion === t ? null : t, null)}>
            {NOMBRE_TIPO[t]}
          </button>
        ))}
      </div>
      {conservacion === 'amenazada' && (
        <div role="group" aria-label="Categoría de amenaza" className="flex flex-wrap gap-1.5">
          {CATEGORIAS_AMENAZA.map((c) => (
            <button key={c} type="button" disabled={deshabilitado} className={`bio-insignia bio-insignia-boton bio-uicn-${c}`} aria-pressed={amenaza === c}
              onClick={() => onCambio('amenazada', amenaza === c ? null : c)}>
              {c} · {NOMBRE_AMENAZA[c]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
