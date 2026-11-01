import { useRef, useState } from 'react'
import { useBiodiversidadEspecies } from '@/hooks/useBiodiversidad'
import ConmutadorVista from '../ConmutadorVista'
import { Cargando, PanelError } from '../EstadoConsulta'
import type { AyudaFiltros } from '../filtros/ayuda'
import SelectorOrden from '../filtros/SelectorOrden'
import SinResultados from '../filtros/SinResultados'
import Paginacion from '../Paginacion'
import { fmtNum } from '../lib/format'
import { ORDENES_ESPECIES, ORDEN_ESPECIES_INICIAL, type OrdenEspecies } from '../lib/orden'
import { TAMANO_PAGINA_ESPECIES, type ModoRegistros } from '../lib/parametros'
import type { EspecieResumen, Grupo, ParamsApi } from '../types'
import DetalleEspecie from './DetalleEspecie'
import TablaEspecies from './TablaEspecies'
import TarjetaEspecie from './TarjetaEspecie'

interface Props {
  grupo: Grupo
  esIndividual: boolean
  /** Filtros de la ruta `/especies` ya validados para el método del grupo. */
  params: ParamsApi
  orden: OrdenEspecies
  modo: ModoRegistros
  pagina: number
  ayuda: AyudaFiltros
  onCambio: (cambios: Record<string, string | number | null>) => void
  onVerRegistros: (e: EspecieResumen) => void
  /** Inventarios agregados: lleva a los municipios donde aparece la especie. */
  onVerMunicipios?: (e: EspecieResumen) => void
}

export default function SeccionEspecies({ grupo, esIndividual, params, orden, modo, pagina, ayuda, onCambio, onVerRegistros, onVerMunicipios }: Props) {
  const [abierta, setAbierta] = useState<EspecieResumen | null>(null)
  const origenDetalle = useRef<HTMLElement | null>(null)
  const abrirDetalle = (e: EspecieResumen, origen: HTMLElement) => { origenDetalle.current = origen; setAbierta(e) }
  const consulta = useBiodiversidadEspecies(grupo, { ...params, orden, pagina, tamano: TAMANO_PAGINA_ESPECIES })
  const datos = consulta.data
  const maxPaginas = datos ? Math.max(1, Math.ceil(datos.total / TAMANO_PAGINA_ESPECIES)) : 1
  const cambiarOrden = (o: OrdenEspecies) => onCambio({ ordenar: o === ORDEN_ESPECIES_INICIAL ? null : o })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-muted" role="status" aria-live="polite">
          {datos ? (datos.total > 0 ? `${fmtNum(datos.total)} ${datos.total === 1 ? 'especie' : 'especies'}` : 'Sin especies con estos filtros')
            : consulta.isPending ? 'Cargando especies…' : ''}
          {!esIndividual && datos && datos.total > 0 && ' · Inventario agregado: se muestran conteos, sin registros individuales ni fotografías.'}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <SelectorOrden etiqueta="Ordenar por" valor={orden} opciones={ORDENES_ESPECIES} onCambio={cambiarOrden} />
          <ConmutadorVista etiqueta="Forma de ver las especies" modo={modo} onCambio={(m) => onCambio({ modo: m === 'tarjetas' ? null : m })} />
        </div>
      </div>
      {consulta.isError && !datos ? (
        <PanelError error={consulta.error} onReintentar={() => void consulta.refetch()} />
      ) : !datos ? (
        <Cargando etiqueta="Cargando especies" className="h-80" />
      ) : datos.total === 0 ? (
        <SinResultados titulo="Sin especies" sinFiltros="No hay especies documentadas en este alcance." {...ayuda} />
      ) : (
        <div className={consulta.isFetching ? 'bio-cargando' : 'bio-entra'} aria-busy={consulta.isFetching}>
          {modo === 'tabla' ? (
            <TablaEspecies especies={datos.especies} esIndividual={esIndividual} orden={orden} onOrden={cambiarOrden} onVerRegistros={onVerRegistros} />
          ) : (
            <ul className="bio-rejilla-tarjetas">
              {datos.especies.map((e) => (
                <li key={e.especie_clave}><TarjetaEspecie e={e} grupo={grupo} esIndividual={esIndividual} onVerRegistros={onVerRegistros} onVerMunicipios={onVerMunicipios} onVerMas={abrirDetalle} /></li>
              ))}
            </ul>
          )}
        </div>
      )}
      {consulta.isError && datos && <PanelError error={consulta.error} onReintentar={() => void consulta.refetch()} compacto />}
      {abierta && (
        <DetalleEspecie
          e={abierta} grupo={grupo} esIndividual={esIndividual} origen={origenDetalle} onCerrar={() => setAbierta(null)}
          onVerRegistros={(e) => { setAbierta(null); onVerRegistros(e) }}
          onVerMunicipios={onVerMunicipios && ((e) => { setAbierta(null); onVerMunicipios(e) })}
        />
      )}
      <Paginacion etiqueta="Paginación de especies" pagina={pagina} maxPaginas={maxPaginas} onCambio={(p) => onCambio({ pagina: p })} />
    </div>
  )
}
