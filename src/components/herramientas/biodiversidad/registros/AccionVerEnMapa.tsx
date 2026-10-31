import { MapPin } from 'lucide-react'
import { ubicacionPublica } from '../lib/puntos'
import type { RegistroBiodiversidad } from '../types'

interface Props {
  r: RegistroBiodiversidad
  onVerEnMapa: (r: RegistroBiodiversidad) => void
  chico?: boolean
}

/** «Ver en el mapa»: solo existe cuando la ubicación es pública; con ubicación reservada no se renderiza nada. */
export default function AccionVerEnMapa({ r, onVerEnMapa, chico = true }: Props) {
  if (!ubicacionPublica(r)) return null
  return (
    <button
      type="button" className={`bio-boton ${chico ? 'bio-boton-chico' : ''}`} onClick={() => onVerEnMapa(r)}
      aria-label={`Ver en el mapa: ${r.especie ?? 'registro sin especie determinada'}, ${r.municipio}`}
    >
      <MapPin className="w-4 h-4" aria-hidden="true" />Ver en el mapa
    </button>
  )
}
