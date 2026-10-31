import { useBiodiversidadRegistros } from '@/hooks/useBiodiversidad'
import ConmutadorVista from '../ConmutadorVista'
import { Cargando, PanelError } from '../EstadoConsulta'
import type { AyudaFiltros } from '../filtros/ayuda'
import SelectorOrden from '../filtros/SelectorOrden'
import SinResultados from '../filtros/SinResultados'
import Paginacion from '../Paginacion'
import { fmtNum } from '../lib/format'
import { ORDENES_REGISTROS, ORDEN_REGISTROS_INICIAL, type OrdenRegistros } from '../lib/orden'
import { MAX_REGISTROS_CONSULTABLES, TAMANO_PAGINA, type ModoRegistros } from '../lib/parametros'
import type { Grupo, ParamsApi, RegistroBiodiversidad } from '../types'
import TablaRegistros from './TablaRegistros'
import TarjetaRegistro from './TarjetaRegistro'

interface Props {
  grupo: Grupo
  /** Filtros de la ruta `/registros` ya validados. */
  params: ParamsApi
  orden: OrdenRegistros
  pagina: number
  modo: ModoRegistros
  ayuda: AyudaFiltros
  onCambio: (cambios: Record<string, string | number | null>) => void
  onAbrir: (r: RegistroBiodiversidad, origen: HTMLElement) => void
  onVerEnMapa: (r: RegistroBiodiversidad) => void
}

export default function SeccionRegistros({ grupo, params, orden, pagina, modo, ayuda, onCambio, onAbrir, onVerEnMapa }: Props) {
  const consulta = useBiodiversidadRegistros(grupo, { ...params, orden, pagina, tamano: TAMANO_PAGINA }, true)
  const datos = consulta.data
  const maxPaginas = datos ? Math.max(1, Math.min(Math.ceil(datos.total / TAMANO_PAGINA), Math.floor(MAX_REGISTROS_CONSULTABLES / TAMANO_PAGINA))) : 1
  const primero = datos && datos.total > 0 ? (datos.pagina - 1) * TAMANO_PAGINA + 1 : 0
  const ultimo = datos ? Math.min(datos.pagina * TAMANO_PAGINA, datos.total) : 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-muted" role="status" aria-live="polite">
          {datos ? (datos.total > 0
            ? `Mostrando ${fmtNum(primero)}–${fmtNum(ultimo)} de ${fmtNum(datos.total)} registros`
            : 'Sin registros con estos filtros') : consulta.isPending ? 'Cargando registros…' : ''}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <SelectorOrden
            etiqueta="Ordenar por" valor={orden} opciones={ORDENES_REGISTROS}
            onCambio={(o) => onCambio({ ordenar: o === ORDEN_REGISTROS_INICIAL ? null : o })}
          />
          <ConmutadorVista etiqueta="Forma de ver los registros" modo={modo} onCambio={(m) => onCambio({ modo: m === 'tarjetas' ? null : m })} />
        </div>
      </div>
      {consulta.isError && !datos ? (
        <PanelError error={consulta.error} onReintentar={() => void consulta.refetch()} />
      ) : !datos ? (
        <Cargando etiqueta="Cargando registros" className="h-80" />
      ) : datos.total === 0 ? (
        <SinResultados titulo="Sin registros" sinFiltros="No hay registros en este grupo para el periodo consultado." {...ayuda} />
      ) : (
        <div className={consulta.isFetching ? 'bio-cargando' : ''} aria-busy={consulta.isFetching}>
          {modo === 'tabla' ? (
            <TablaRegistros registros={datos.registros} onAbrir={onAbrir} onVerEnMapa={onVerEnMapa} />
          ) : (
            <ul className="bio-rejilla-tarjetas">
              {datos.registros.map((r) => <li key={r.gbif_id}><TarjetaRegistro r={r} grupo={grupo} onAbrir={onAbrir} onVerEnMapa={onVerEnMapa} /></li>)}
            </ul>
          )}
        </div>
      )}
      {consulta.isError && datos && <PanelError error={consulta.error} onReintentar={() => void consulta.refetch()} compacto />}
      <Paginacion
        etiqueta="Paginación de registros" pagina={pagina} maxPaginas={maxPaginas} onCambio={(p) => onCambio({ pagina: p })}
        nota={datos && datos.total > MAX_REGISTROS_CONSULTABLES
          ? `La consulta alcanza como máximo los primeros ${fmtNum(MAX_REGISTROS_CONSULTABLES)} registros; acota con los filtros para ver el resto.` : undefined}
      />
    </div>
  )
}
