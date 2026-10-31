import { Images } from 'lucide-react'
import { useBiodiversidadEspecies } from '@/hooks/useBiodiversidad'
import CampoBusqueda from '../CampoBusqueda'
import { Cargando, PanelError, PanelVacio } from '../EstadoConsulta'
import FiltroConservacion from '../FiltroConservacion'
import InsigniasConservacion from '../InsigniasConservacion'
import Paginacion from '../Paginacion'
import { fmtNum } from '../lib/format'
import { TAMANO_PAGINA_ESPECIES } from '../lib/parametros'
import type { Amenaza, EspecieResumen, Grupo, TipoConservacion } from '../types'

interface Props {
  grupo: Grupo
  esIndividual: boolean
  municipio: string | null
  departamento: string | null
  buscar: string
  conservacion: TipoConservacion | null
  amenaza: Amenaza | null
  orden: 'registros' | 'nombre'
  pagina: number
  onCambio: (cambios: Record<string, string | number | null>) => void
  onVerRegistros: (e: EspecieResumen) => void
}

function Taxonomia({ e }: { e: EspecieResumen }) {
  const partes = [e.clase, e.orden, e.familia].filter(Boolean)
  return partes.length ? <p className="text-xs text-text-muted">{partes.join(' · ')}</p> : null
}

export default function SeccionEspecies({ grupo, esIndividual, municipio, departamento, buscar, conservacion, amenaza, orden, pagina, onCambio, onVerRegistros }: Props) {
  const consulta = useBiodiversidadEspecies({
    grupo, pagina, tamano: TAMANO_PAGINA_ESPECIES, orden,
    codigo_municipal: municipio ?? undefined,
    departamento: municipio ? undefined : departamento ?? undefined,
    buscar: buscar || undefined, conservacion: conservacion ?? undefined, amenaza: amenaza ?? undefined,
  })
  const datos = consulta.data
  const maxPaginas = datos ? Math.max(1, Math.ceil(datos.total / TAMANO_PAGINA_ESPECIES)) : 1
  const hayFiltros = Boolean(buscar || conservacion)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)_auto] items-start">
        <CampoBusqueda etiqueta="Buscar especie" placeholder="Nombre científico" valor={buscar} onCambio={(v) => onCambio({ buscar: v || null })} />
        <FiltroConservacion conservacion={conservacion} amenaza={amenaza} onCambio={(c, a) => onCambio({ conservacion: c, amenaza: a })} />
        <div className="flex flex-col gap-1">
          <span className="bio-eyebrow" id="bio-orden-esp">Ordenar por</span>
          <div role="group" aria-labelledby="bio-orden-esp" className="flex gap-1.5">
            {(['registros', 'nombre'] as const).map((o) => (
              <button key={o} type="button" className="bio-boton bio-boton-chico" aria-pressed={orden === o} onClick={() => onCambio({ orden: o === 'registros' ? null : o })}>
                {o === 'registros' ? 'Más registros' : 'Nombre'}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="text-sm text-text-muted" role="status" aria-live="polite">
        {datos ? (datos.total > 0 ? `${fmtNum(datos.total)} ${datos.total === 1 ? 'especie' : 'especies'}` : 'Sin especies con estos filtros')
          : consulta.isPending ? 'Cargando especies…' : ''}
        {!esIndividual && datos && datos.total > 0 && ' · Inventario agregado: se muestran conteos, sin registros individuales.'}
      </p>
      {consulta.isError && !datos ? (
        <PanelError error={consulta.error} onReintentar={() => void consulta.refetch()} />
      ) : !datos ? (
        <Cargando etiqueta="Cargando especies" className="h-80" />
      ) : datos.total === 0 ? (
        <PanelVacio titulo="Sin especies" detalle={hayFiltros ? 'Prueba con otro nombre o quita el filtro de conservación.' : 'No hay especies documentadas en este alcance.'} />
      ) : (
        <ol className={`bio-especies ${consulta.isFetching ? 'bio-cargando' : 'bio-entra'}`} aria-busy={consulta.isFetching}>
          {datos.especies.map((e) => (
            <li key={e.especie_clave} className="bio-especie">
              <div className="min-w-0 space-y-1.5">
                <p className="font-semibold text-text [overflow-wrap:anywhere]"><i>{e.especie}</i></p>
                <Taxonomia e={e} />
                <InsigniasConservacion c={e} />
              </div>
              <dl className="bio-especie-cifras">
                <div><dt>Registros</dt><dd>{fmtNum(e.registros)}</dd></div>
                <div><dt>Municipios</dt><dd>{fmtNum(e.municipios)}</dd></div>
              </dl>
              {esIndividual && (
                <button type="button" className="bio-boton bio-boton-chico" onClick={() => onVerRegistros(e)}>
                  <Images className="w-4 h-4" aria-hidden="true" />Ver registros
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
      <Paginacion etiqueta="Paginación de especies" pagina={pagina} maxPaginas={maxPaginas} onCambio={(p) => onCambio({ pagina: p })} />
    </div>
  )
}
