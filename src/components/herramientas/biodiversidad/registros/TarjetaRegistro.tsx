import InsigniasConservacion from '../InsigniasConservacion'
import { traducirEvidencia } from '../lib/evidencia'
import type { Grupo, RegistroBiodiversidad } from '../types'
import AccionVerEnMapa from './AccionVerEnMapa'
import { CreditoFoto, ImagenGbif } from './FotoRegistro'
import FuenteRegistro from './FuenteRegistro'
import { textoAlt } from './textoAlt'
import { Ubicacion } from './UbicacionRegistro'

interface Props {
  r: RegistroBiodiversidad
  grupo?: Grupo
  onAbrir: (r: RegistroBiodiversidad, origen: HTMLElement) => void
  onVerEnMapa?: (r: RegistroBiodiversidad) => void
}

export default function TarjetaRegistro({ r, grupo, onAbrir, onVerEnMapa }: Props) {
  const nombre = r.especie ?? 'Sin especie determinada'
  return (
    <article className="bio-tarjeta">
      <button
        type="button" className="bio-tarjeta-abrir" onClick={(e) => onAbrir(r, e.currentTarget)}
        aria-label={`Ver detalle del registro: ${nombre}, ${r.municipio}${r.anio ? `, ${r.anio}` : ''}`}
      >
        <ImagenGbif foto={r.foto} alt={textoAlt(r)} ancho={480} grupo={grupo} />
        {r.fotos_total > 1 && <span className="bio-tarjeta-fotos" aria-label={`${r.fotos_total} fotografías`}>{r.fotos_total} fotos</span>}
        <span className="bio-tarjeta-cuerpo">
          <span className={`bio-tarjeta-nombre ${r.especie ? 'italic' : 'text-text-muted'}`}>{nombre}</span>
          <span className="bio-tarjeta-meta">{r.municipio} · {r.anio ?? 'año sin dato'}</span>
          <span className="bio-tarjeta-meta">{traducirEvidencia(r.tipo_evidencia)}</span>
          {r.registrado_por && <span className="bio-tarjeta-meta">Observó: {r.registrado_por}</span>}
          {r.identificado_por && <span className="bio-tarjeta-meta">Identificó: {r.identificado_por}</span>}
        </span>
      </button>
      <div className="bio-tarjeta-pie">
        <FuenteRegistro r={r} />
        {r.foto && <CreditoFoto foto={r.foto} />}
        <InsigniasConservacion c={r} compacto />
        {r.coordenadas_ocultas && <Ubicacion r={r} />}
        {onVerEnMapa && <AccionVerEnMapa r={r} onVerEnMapa={onVerEnMapa} />}
      </div>
    </article>
  )
}
