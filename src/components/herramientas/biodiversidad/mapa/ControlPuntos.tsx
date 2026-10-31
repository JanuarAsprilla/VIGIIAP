import { EyeOff, Info } from 'lucide-react'
import { PanelError } from '../EstadoConsulta'
import { mensajeMuestra, mensajeOcultos } from '../lib/puntos'
import type { InfoPuntos } from './tiposPuntos'

interface Props {
  activo: boolean
  disponible: boolean
  onCambio: (activo: boolean) => void
}

export function InterruptorPuntos({ activo, disponible, onCambio }: Props) {
  return (
    <button
      type="button" role="switch" aria-checked={activo} className="bio-interruptor" disabled={!disponible}
      title={disponible ? undefined : 'Los inventarios agregados no tienen registros individuales con ubicación.'}
      onClick={() => onCambio(!activo)}
    >
      <span className="bio-interruptor-pista" aria-hidden="true"><span /></span>
      Puntos de registros
    </button>
  )
}

/** Mensajes persistentes de la capa: estado de carga, muestra y ubicaciones reservadas. Siempre visibles mientras la capa está activa. */
export function MensajesPuntos({ info, onReintentar }: { info: InfoPuntos; onReintentar: () => void }) {
  const ocultos = mensajeOcultos(info.ocultos)
  return (
    <div className="bio-puntos-msgs" role="status" aria-live="polite">
      {info.error && !info.listo ? <PanelError error={info.error} onReintentar={onReintentar} compacto /> : (
        <>
          <p className="bio-puntos-linea">
            <Info className="w-4 h-4 shrink-0" aria-hidden="true" />
            {!info.listo ? 'Cargando ubicaciones…'
              : info.total === 0 ? 'No hay ubicaciones visibles en esta zona con los filtros actuales.'
                : `${new Intl.NumberFormat('es-CO').format(info.mostrados)} ${info.mostrados === 1 ? 'punto' : 'puntos'} en pantalla. Los círculos numerados agrupan puntos cercanos: acerca el mapa para separarlos.`}
          </p>
          {info.listo && info.muestreado && <p className="bio-puntos-linea">{mensajeMuestra(info.mostrados, info.total)}</p>}
          {ocultos && <p className="bio-puntos-linea bio-puntos-reservada"><EyeOff className="w-4 h-4 shrink-0" aria-hidden="true" />{ocultos}</p>}
        </>
      )}
    </div>
  )
}
