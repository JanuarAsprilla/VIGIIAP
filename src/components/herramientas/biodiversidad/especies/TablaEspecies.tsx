import { ArrowDown, ArrowUp, Images } from 'lucide-react'
import InsigniasConservacion from '../InsigniasConservacion'
import { fmtNum } from '../lib/format'
import type { EspecieResumen } from '../types'
import { insigniasDe } from '../lib/conservacion'
import { fotoValida } from '../lib/especie'
import type { OrdenEspecies } from '../lib/orden'

const tieneMarca = (e: EspecieResumen) => insigniasDe(e).length > 0

type Orden = OrdenEspecies

interface Props {
  especies: EspecieResumen[]
  esIndividual: boolean
  orden: Orden
  onOrden: (o: Orden) => void
  onVerRegistros: (e: EspecieResumen) => void
}

function Encabezado({ titulo, orden, actual, onOrden, numerica = false }: { titulo: string; orden?: Orden; actual: Orden; onOrden: (o: Orden) => void; numerica?: boolean }) {
  if (!orden) return <th scope="col" className={numerica ? 'bio-num' : ''}>{titulo}</th>
  const activo = orden === actual
  return (
    <th scope="col" className={numerica ? 'bio-num' : ''} aria-sort={activo ? (orden === 'nombre' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="bio-orden" onClick={() => onOrden(orden)} title="El orden se aplica a todas las especies, no solo a esta página">
        {titulo}
        {activo && (orden === 'nombre' ? <ArrowUp className="w-3 h-3" aria-hidden="true" /> : <ArrowDown className="w-3 h-3" aria-hidden="true" />)}
      </button>
    </th>
  )
}

/** Vista detallada: todas las columnas de la especie. «Especie» y «Registros» ordenan en el servidor. */
export default function TablaEspecies({ especies, esIndividual, orden, onOrden, onVerRegistros }: Props) {
  return (
    <div className="bio-tabla-caja" tabIndex={0} role="region" aria-label="Tabla de especies, desplazable">
      <table className="bio-tabla bio-reg">
        <caption className="sr-only">Especies de la página actual. Activa «Especie», «Registros» o «Municipios» para ordenar todas las especies.</caption>
        <thead>
          <tr>
            <Encabezado titulo="Especie" orden="nombre" actual={orden} onOrden={onOrden} />
            <Encabezado titulo="Clase" actual={orden} onOrden={onOrden} />
            <Encabezado titulo="Orden" actual={orden} onOrden={onOrden} />
            <Encabezado titulo="Familia" actual={orden} onOrden={onOrden} />
            <Encabezado titulo="Registros" orden="registros" actual={orden} onOrden={onOrden} numerica />
            <Encabezado titulo="Municipios" orden="municipios" actual={orden} onOrden={onOrden} numerica />
            <Encabezado titulo="Fotos" actual={orden} onOrden={onOrden} numerica />
            <Encabezado titulo="Conservación" actual={orden} onOrden={onOrden} />
            {esIndividual && <th scope="col"><span className="sr-only">Acciones</span></th>}
          </tr>
        </thead>
        <tbody>
          {especies.map((e) => (
            <tr key={e.especie_clave}>
              <td data-etiqueta="Especie"><i className="font-semibold">{e.especie}</i></td>
              <td data-etiqueta="Clase">{e.clase ?? '—'}</td>
              <td data-etiqueta="Orden">{e.orden ?? '—'}</td>
              <td data-etiqueta="Familia">{e.familia ?? '—'}</td>
              <td data-etiqueta="Registros" className="bio-num font-semibold">{fmtNum(e.registros)}</td>
              <td data-etiqueta="Municipios" className="bio-num">{fmtNum(e.municipios)}</td>
              <td data-etiqueta="Fotos" className="bio-num">{fotoValida(e) ? fmtNum(e.fotos_total ?? 1) : esIndividual ? '0' : '—'}</td>
              <td data-etiqueta="Conservación">{tieneMarca(e) ? <InsigniasConservacion c={e} compacto /> : <span className="text-text-muted" title="Sin marca en las listas consultadas: no significa que no esté amenazada ni que sea nativa">—</span>}</td>
              {esIndividual && (
                <td data-etiqueta="Acción">
                  <button type="button" className="bio-boton bio-boton-chico" onClick={() => onVerRegistros(e)} aria-label={`Ver registros de ${e.especie}`}>
                    <Images className="w-4 h-4" aria-hidden="true" />Ver
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
