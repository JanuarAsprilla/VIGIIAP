import InsigniasConservacion from '../InsigniasConservacion'
import { traducirEvidencia } from '../lib/evidencia'
import type { Grupo, RegistroBiodiversidad } from '../types'
import { CreditoFoto, ImagenGbif } from './FotoRegistro'
import { textoAlt } from './textoAlt'
import { Ubicacion } from './UbicacionRegistro'

interface Props {
  r: RegistroBiodiversidad
  grupo?: Grupo
  onAbrir: (r: RegistroBiodiversidad, origen: HTMLElement) => void
}

export default function TarjetaRegistro({ r, grupo, onAbrir }: Props) {
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
        </span>
      </button>
      <div className="bio-tarjeta-pie">
        {r.foto && <CreditoFoto foto={r.foto} />}
        <InsigniasConservacion c={r} compacto />
        {r.coordenadas_ocultas && <Ubicacion r={r} />}
      </div>
    </article>
  )
}
