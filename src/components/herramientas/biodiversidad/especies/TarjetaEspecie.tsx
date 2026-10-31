import { Images } from 'lucide-react'
import InsigniasConservacion from '../InsigniasConservacion'
import { fmtNum } from '../lib/format'
import { fotoValida, taxonomiaBreve } from '../lib/especie'
import { CreditoFoto, ImagenGbif } from '../registros/FotoRegistro'
import type { EspecieResumen, Grupo } from '../types'

interface Props {
  e: EspecieResumen
  grupo: Grupo
  esIndividual: boolean
  onVerRegistros: (e: EspecieResumen) => void
}

export default function TarjetaEspecie({ e, grupo, esIndividual, onVerRegistros }: Props) {
  const foto = fotoValida(e)
  const taxo = taxonomiaBreve(e)
  const fotos = e.fotos_total ?? 0
  return (
    <article className="bio-tarjeta bio-tarjeta-especie">
      <div className="relative">
        <ImagenGbif
          foto={foto} grupo={grupo} ancho={480} alt={`Fotografía representativa de ${e.especie}`}
          sinFotoTexto={esIndividual ? 'Aún sin fotografía' : undefined}
        />
        {fotos > 1 && <span className="bio-tarjeta-fotos" aria-label={`${fotos} fotografías`}>{fotos} fotos</span>}
      </div>
      <div className="bio-tarjeta-cuerpo">
        <h4 className="bio-tarjeta-nombre"><i>{e.especie}</i></h4>
        {taxo && <p className="bio-tarjeta-meta">{taxo}</p>}
        <dl className="bio-especie-mini">
          <div><dt>Registros</dt><dd>{fmtNum(e.registros)}</dd></div>
          <div><dt>Municipios</dt><dd>{fmtNum(e.municipios)}</dd></div>
        </dl>
      </div>
      <div className="bio-tarjeta-pie">
        {foto && <CreditoFoto foto={foto} />}
        <InsigniasConservacion c={e} />
        {esIndividual && (
          <button type="button" className="bio-boton bio-boton-chico" onClick={() => onVerRegistros(e)}>
            <Images className="w-4 h-4" aria-hidden="true" />Ver registros
          </button>
        )}
      </div>
    </article>
  )
}
