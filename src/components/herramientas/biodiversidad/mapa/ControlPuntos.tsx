import { EyeOff, Info, List } from 'lucide-react'
import { PanelError } from '../EstadoConsulta'
import { MENSAJE_RESERVADAS, mensajeMuestra } from '../lib/puntos'
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

interface MensajesProps {
  info: InfoPuntos
  onReintentar: () => void
  /** Alternativa textual al mapa: lleva a la pestaña de registros. */
  onVerLista?: () => void
}

function LineaEstado({ info }: { info: InfoPuntos }) {
  if (!info.listo) return <>Cargando ubicaciones…</>
  if (info.cargando) return <>Actualizando…</>
  if (info.total === 0) return <>No hay ubicaciones visibles en esta zona con los filtros actuales.</>
  return <>{`${new Intl.NumberFormat('es-CO').format(info.mostrados)} ${info.mostrados === 1 ? 'punto' : 'puntos'} en pantalla. Los círculos numerados agrupan puntos cercanos: acerca el mapa para separarlos.`}</>
}

/** Mensajes persistentes de la capa: estado de carga, error, muestra y ubicaciones reservadas. Siempre visibles mientras la capa está activa. */
export function MensajesPuntos({ info, onReintentar, onVerLista }: MensajesProps) {
  const desactualizado = Boolean(info.error) && info.listo
  return (
    <div className="bio-puntos-msgs" role="status" aria-live="polite" aria-busy={info.cargando}>
      {info.error ? <PanelError error={info.error} onReintentar={onReintentar} compacto /> : null}
      {desactualizado && <p className="bio-puntos-linea">Los puntos que ves pueden estar desactualizados: no se pudo cargar esta zona.</p>}
      {(!info.error || info.listo) && (
        <p className="bio-puntos-linea">
          <Info className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span><LineaEstado info={info} /></span>
        </p>
      )}
      {info.listo && !info.cargando && !info.error && info.muestreado && <p className="bio-puntos-linea">{mensajeMuestra(info.mostrados, info.total)}</p>}
      {info.listo && <p className="bio-puntos-linea bio-puntos-reservada"><EyeOff className="w-4 h-4 shrink-0" aria-hidden="true" />{MENSAJE_RESERVADAS}</p>}
      {onVerLista && (
        <button type="button" className="bio-boton bio-boton-chico" onClick={onVerLista}>
          <List className="w-4 h-4" aria-hidden="true" />
          Ver los registros en lista
        </button>
      )}
    </div>
  )
}
