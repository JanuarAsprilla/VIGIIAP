import { Images, Info, MapPinned } from 'lucide-react'
import InsigniasConservacion from '../InsigniasConservacion'
import { fmtNum } from '../lib/format'
import { fotoValida, linajeCompleto, taxonomiaBreve } from '../lib/especie'
import { CreditoFoto, ImagenGbif } from '../registros/FotoRegistro'
import type { EspecieResumen, Grupo } from '../types'

interface Props {
  e: EspecieResumen
  grupo: Grupo
  esIndividual: boolean
  onVerRegistros: (e: EspecieResumen) => void
  /** Solo inventarios agregados: no hay registros que listar, pero sí los municipios donde aparece la especie. */
  onVerMunicipios?: (e: EspecieResumen) => void
  /** Abre el diálogo con todo lo que se sabe de la especie; recibe el botón para devolverle el foco al cerrar. */
  onVerMas?: (e: EspecieResumen, origen: HTMLElement) => void
}

/** En inventarios agregados nunca hay foto: el icono del grupo ocupa una franja, no media tarjeta. */
const PROPORCION_SIN_FOTOS = '16 / 6'

export default function TarjetaEspecie({ e, grupo, esIndividual, onVerRegistros, onVerMunicipios, onVerMas }: Props) {
  const foto = fotoValida(e)
  const taxo = taxonomiaBreve(e)
  const fotos = e.fotos_total ?? 0
  return (
    <article className="bio-tarjeta bio-tarjeta-especie">
      <div className="relative">
        <ImagenGbif
          foto={foto} grupo={grupo} ancho={480} alt={`Fotografía representativa de ${e.especie}`} proporcion={esIndividual ? undefined : PROPORCION_SIN_FOTOS}
          sinFotoTexto={esIndividual ? 'Aún sin fotografía' : undefined}
        />
        {fotos > 1 && <span className="bio-tarjeta-fotos" aria-label={`${fotos} fotografías`}>{fotos} fotos</span>}
      </div>
      <div className="bio-tarjeta-cuerpo">
        <h4 className="bio-tarjeta-nombre"><i>{e.especie}</i></h4>
        {taxo && <p className="bio-tarjeta-meta" title={linajeCompleto(e)}>{taxo}</p>}
        <dl className="bio-especie-mini">
          <div><dt>Registros</dt><dd>{fmtNum(e.registros)}</dd></div>
          <div><dt>Municipios</dt><dd>{fmtNum(e.municipios)}</dd></div>
        </dl>
        <InsigniasConservacion c={e} />
      </div>
      <div className="bio-tarjeta-pie">
        {foto && <CreditoFoto foto={foto} />}
        <div className="flex gap-2">
          {onVerMas && (
            <button type="button" className="bio-boton bio-boton-chico flex-1" onClick={(ev) => onVerMas(e, ev.currentTarget)} aria-label={`Ver más de ${e.especie}`}>
              <Info className="w-4 h-4" aria-hidden="true" />Ver más
            </button>
          )}
          {esIndividual ? (
            <button type="button" className="bio-boton bio-boton-chico flex-1" onClick={() => onVerRegistros(e)} aria-label={`Ver registros de ${e.especie}`}>
              <Images className="w-4 h-4" aria-hidden="true" />Registros
            </button>
          ) : onVerMunicipios && (
            <button type="button" className="bio-boton bio-boton-chico flex-1" onClick={() => onVerMunicipios(e)} aria-label={`Ver municipios de ${e.especie}`}>
              <MapPinned className="w-4 h-4" aria-hidden="true" />Municipios
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
