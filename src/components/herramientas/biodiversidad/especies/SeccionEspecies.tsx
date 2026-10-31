import { useBiodiversidadEspecies } from '@/hooks/useBiodiversidad'
import CampoBusqueda from '../CampoBusqueda'
import ConmutadorVista from '../ConmutadorVista'
import { Cargando, PanelError, PanelVacio } from '../EstadoConsulta'
import FiltroConservacion from '../FiltroConservacion'
import Paginacion from '../Paginacion'
import { fmtNum } from '../lib/format'
import { TAMANO_PAGINA_ESPECIES, type ModoRegistros } from '../lib/parametros'
import type { Amenaza, EspecieResumen, Grupo, TipoConservacion } from '../types'
import TablaEspecies from './TablaEspecies'
import TarjetaEspecie from './TarjetaEspecie'

interface Props {
  grupo: Grupo
  esIndividual: boolean
  municipio: string | null
  departamento: string | null
  buscar: string
  conservacion: TipoConservacion | null
  amenaza: Amenaza | null
  conFoto: boolean
  orden: 'registros' | 'nombre'
  modo: ModoRegistros
  pagina: number
  onCambio: (cambios: Record<string, string | number | null>) => void
  onVerRegistros: (e: EspecieResumen) => void
}

export default function SeccionEspecies({ grupo, esIndividual, municipio, departamento, buscar, conservacion, amenaza, conFoto, orden, modo, pagina, onCambio, onVerRegistros }: Props) {
  const soloConFoto = conFoto && esIndividual
  const consulta = useBiodiversidadEspecies({
    grupo, pagina, tamano: TAMANO_PAGINA_ESPECIES, orden,
    codigo_municipal: municipio ?? undefined,
    departamento: municipio ? undefined : departamento ?? undefined,
    buscar: buscar || undefined, conservacion: conservacion ?? undefined, amenaza: amenaza ?? undefined,
    con_foto: soloConFoto ? 'true' : undefined,
  })
  const datos = consulta.data
  const maxPaginas = datos ? Math.max(1, Math.ceil(datos.total / TAMANO_PAGINA_ESPECIES)) : 1
  const hayFiltros = Boolean(buscar || conservacion || soloConFoto)
  const cambiarOrden = (o: 'registros' | 'nombre') => onCambio({ orden: o === 'registros' ? null : o })

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)_auto] items-start">
        <CampoBusqueda etiqueta="Buscar especie" placeholder="Nombre científico" valor={buscar} onCambio={(v) => onCambio({ buscar: v || null })} />
        <FiltroConservacion conservacion={conservacion} amenaza={amenaza} onCambio={(c, a) => onCambio({ conservacion: c, amenaza: a })} />
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
          {esIndividual && (
            <div className="flex flex-col gap-1">
              <span className="bio-eyebrow" id="bio-foto-filtro-esp">Fotografías</span>
              <button type="button" role="switch" aria-checked={soloConFoto} aria-labelledby="bio-foto-filtro-esp" className="bio-interruptor"
                onClick={() => onCambio({ con_foto: soloConFoto ? null : '1' })}>
                <span className="bio-interruptor-pista" aria-hidden="true"><span /></span>
                Solo con foto
              </button>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span className="bio-eyebrow" id="bio-orden-esp">Ordenar por</span>
            <div role="group" aria-labelledby="bio-orden-esp" className="flex gap-1.5">
              {(['registros', 'nombre'] as const).map((o) => (
                <button key={o} type="button" className="bio-boton bio-boton-chico" aria-pressed={orden === o} onClick={() => cambiarOrden(o)}>
                  {o === 'registros' ? 'Más registros' : 'Nombre'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-muted" role="status" aria-live="polite">
          {datos ? (datos.total > 0 ? `${fmtNum(datos.total)} ${datos.total === 1 ? 'especie' : 'especies'}` : 'Sin especies con estos filtros')
            : consulta.isPending ? 'Cargando especies…' : ''}
          {!esIndividual && datos && datos.total > 0 && ' · Inventario agregado: se muestran conteos, sin registros individuales ni fotografías.'}
        </p>
        <ConmutadorVista etiqueta="Forma de ver las especies" modo={modo} onCambio={(m) => onCambio({ modo: m === 'tarjetas' ? null : m })} />
      </div>
      {consulta.isError && !datos ? (
        <PanelError error={consulta.error} onReintentar={() => void consulta.refetch()} />
      ) : !datos ? (
        <Cargando etiqueta="Cargando especies" className="h-80" />
      ) : datos.total === 0 ? (
        <PanelVacio titulo="Sin especies" detalle={hayFiltros ? 'Prueba con otro nombre o quita los filtros de conservación y de fotografía.' : 'No hay especies documentadas en este alcance.'} />
      ) : (
        <div className={consulta.isFetching ? 'bio-cargando' : 'bio-entra'} aria-busy={consulta.isFetching}>
          {modo === 'tabla' ? (
            <TablaEspecies especies={datos.especies} esIndividual={esIndividual} orden={orden} onOrden={cambiarOrden} onVerRegistros={onVerRegistros} />
          ) : (
            <ul className="bio-rejilla-tarjetas">
              {datos.especies.map((e) => (
                <li key={e.especie_clave}><TarjetaEspecie e={e} grupo={grupo} esIndividual={esIndividual} onVerRegistros={onVerRegistros} /></li>
              ))}
            </ul>
          )}
        </div>
      )}
      <Paginacion etiqueta="Paginación de especies" pagina={pagina} maxPaginas={maxPaginas} onCambio={(p) => onCambio({ pagina: p })} />
    </div>
  )
}
