import { EyeOff } from 'lucide-react'
import type { RegistroBiodiversidad } from '../types'

const COORD = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 4, maximumFractionDigits: 4 })

/** Ubicación: si el servidor marca las coordenadas como ocultas jamás se muestra ni se infiere un lugar;
 *  solo la insignia de reserva, aunque llegaran valores de latitud o longitud. */
export function Ubicacion({ r }: { r: Pick<RegistroBiodiversidad, 'coordenadas_ocultas' | 'latitud' | 'longitud' | 'incertidumbre_m'> }) {
  if (r.coordenadas_ocultas) {
    return (
      <span className="bio-insignia bio-insignia-reservada" title="Especie amenazada o sin determinar: se protege su localización.">
        <EyeOff className="w-3 h-3" aria-hidden="true" />
        Ubicación reservada
      </span>
    )
  }
  if (r.latitud === null || r.longitud === null) return <span className="text-text-muted">Sin coordenadas</span>
  return (
    <span className="tabular-nums">
      {COORD.format(r.latitud)}, {COORD.format(r.longitud)}
      {r.incertidumbre_m !== null && <span className="block text-[0.6875rem] text-text-muted">± {new Intl.NumberFormat('es-CO').format(r.incertidumbre_m)} m</span>}
    </span>
  )
}
