import { useBiodiversidadEspecies } from '@/hooks/useBiodiversidad'
import InsigniasConservacion from '../InsigniasConservacion'
import { fmtNum } from '../lib/format'
import { CreditoFoto, ImagenGbif } from '../registros/FotoRegistro'
import { fotoValida } from '../lib/especie'
import type { EspecieResumen, Grupo, ParamsApi } from '../types'

interface Props {
  grupo: Grupo
  /** Filtros de `/especies`; aquí se fija además «amenazadas con foto». */
  params: ParamsApi
  activo: boolean
  onVer: (e: EspecieResumen) => void
}

const CUANTAS = 4

/** Especies amenazadas con fotografía: el rostro de la cifra de conservación. Solo grupos individuales. */
export default function EspeciesDestacadas({ grupo, params, activo, onVer }: Props) {
  const consulta = useBiodiversidadEspecies(grupo, {
    ...params, conservacion: 'amenazada', con_foto: 'true', orden: 'registros', pagina: 1, tamano: CUANTAS,
  }, activo)
  const lista = (consulta.data?.especies ?? []).filter((e) => fotoValida(e) !== null)
  if (!activo || lista.length === 0) return null
  return (
    <section className="space-y-3" aria-labelledby="bio-destacadas-titulo">
      <div>
        <h3 id="bio-destacadas-titulo" className="section-title">Especies amenazadas con fotografía</h3>
        <p className="text-xs text-text-muted mt-0.5">Las más registradas del alcance. Abre una para ver todos sus registros.</p>
      </div>
      <ul className="bio-destacadas">
        {lista.map((e) => {
          const foto = fotoValida(e)
          return (
            <li key={e.especie_clave} className="bio-destacada">
              <ImagenGbif foto={foto} grupo={grupo} ancho={400} proporcion="3 / 2" alt={`Fotografía representativa de ${e.especie}`} />
              <div className="bio-tarjeta-cuerpo">
                <button type="button" className="bio-destacada-nombre italic text-left hover:underline" onClick={() => onVer(e)}>{e.especie}</button>
                <p className="bio-tarjeta-meta">{fmtNum(e.registros)} {e.registros === 1 ? 'registro' : 'registros'} · {fmtNum(e.municipios)} {e.municipios === 1 ? 'municipio' : 'municipios'}</p>
              </div>
              <div className="bio-tarjeta-pie">
                {foto && <CreditoFoto foto={foto} />}
                <InsigniasConservacion c={e} compacto />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
