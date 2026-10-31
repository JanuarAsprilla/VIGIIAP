import { useId } from 'react'
import type { CambiosUrl, Filtros } from '../lib/filtros'

interface Props {
  filtros: Filtros
  onCambio: (cambios: CambiosUrl) => void
}

function Interruptor({ activo, texto, ayuda, onClick }: { activo: boolean; texto: string; ayuda: string; onClick: () => void }) {
  const id = useId()
  return (
    <div>
      <button type="button" role="switch" aria-checked={activo} aria-describedby={id} className="bio-interruptor" onClick={onClick}>
        <span className="bio-interruptor-pista" aria-hidden="true"><span /></span>
        {texto}
      </button>
      <p id={id} className="text-[0.6875rem] text-text-muted ml-[3.1rem] -mt-1">{ayuda}</p>
    </div>
  )
}

export default function SeccionCalidad({ filtros, onCambio }: Props) {
  return (
    <div className="grid gap-2">
      <Interruptor activo={filtros.conFoto} texto="Solo con foto" ayuda="Registros o especies con fotografía publicada en GBIF."
        onClick={() => onCambio({ con_foto: filtros.conFoto ? null : '1' })} />
      <Interruptor activo={filtros.conUbicacion} texto="Solo con ubicación visible" ayuda="Excluye los registros cuya ubicación se reserva para proteger la especie."
        onClick={() => onCambio({ con_ubicacion: filtros.conUbicacion ? null : '1' })} />
    </div>
  )
}
