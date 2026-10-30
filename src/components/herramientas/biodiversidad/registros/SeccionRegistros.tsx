import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useBiodiversidadRegistros } from '@/hooks/useBiodiversidad'
import { Cargando, PanelError, PanelVacio } from '../EstadoConsulta'
import { MAX_REGISTROS_CONSULTABLES, TAMANO_PAGINA } from '../lib/parametros'
import { fmtNum } from '../lib/format'
import type { Grupo, MunicipioConteo } from '../types'
import FiltrosRegistros, { type ValoresFiltro } from './FiltrosRegistros'
import TablaRegistros from './TablaRegistros'

interface Props {
  grupo: Grupo
  municipios: MunicipioConteo[]
  valores: ValoresFiltro
  pagina: number
  desde: number
  hasta: number
  onCambio: (cambios: Record<string, string | number | null>) => void
  onLimpiar: () => void
}

export default function SeccionRegistros({ grupo, municipios, valores, pagina, desde, hasta, onCambio, onLimpiar }: Props) {
  const consulta = useBiodiversidadRegistros({
    grupo,
    pagina,
    tamano: TAMANO_PAGINA,
    codigo_municipal: valores.municipio ?? undefined,
    departamento: valores.municipio ? undefined : valores.departamento ?? undefined,
    anio_desde: valores.anioDesde ?? undefined,
    anio_hasta: valores.anioHasta ?? undefined,
  }, true)

  const datos = consulta.data
  const maxPaginas = datos ? Math.max(1, Math.min(Math.ceil(datos.total / TAMANO_PAGINA), MAX_REGISTROS_CONSULTABLES / TAMANO_PAGINA)) : 1
  const primero = datos && datos.total > 0 ? (datos.pagina - 1) * TAMANO_PAGINA + 1 : 0
  const ultimo = datos ? Math.min(datos.pagina * TAMANO_PAGINA, datos.total) : 0

  return (
    <div className="space-y-4">
      <FiltrosRegistros municipios={municipios} valores={valores} desde={desde} hasta={hasta} onCambio={onCambio} onLimpiar={onLimpiar} />
      <p className="text-sm text-text-muted" role="status" aria-live="polite">
        {datos ? (datos.total > 0
          ? `Mostrando ${fmtNum(primero)}–${fmtNum(ultimo)} de ${fmtNum(datos.total)} registros`
          : 'Sin registros con estos filtros') : consulta.isPending ? 'Cargando registros…' : ''}
      </p>
      {consulta.isError && !datos ? (
        <PanelError error={consulta.error} onReintentar={() => void consulta.refetch()} />
      ) : !datos ? (
        <Cargando etiqueta="Cargando registros" className="h-80" />
      ) : datos.total === 0 ? (
        <PanelVacio titulo="Sin registros" detalle="Prueba ampliando el rango de años o quitando el municipio o el departamento." />
      ) : (
        <div className={consulta.isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'} aria-busy={consulta.isFetching}>
          <TablaRegistros registros={datos.registros} />
        </div>
      )}
      {consulta.isError && datos && <PanelError error={consulta.error} onReintentar={() => void consulta.refetch()} compacto />}
      {datos && datos.total > TAMANO_PAGINA && (
        <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="Paginación de registros">
          <div className="flex items-center gap-2">
            <button type="button" className="bio-boton" disabled={pagina <= 1} onClick={() => onCambio({ pagina: pagina - 1 })}>
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />Anterior
            </button>
            <button type="button" className="bio-boton" disabled={pagina >= maxPaginas} onClick={() => onCambio({ pagina: pagina + 1 })}>
              Siguiente<ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <span className="text-sm text-text-muted tabular-nums">Página {fmtNum(pagina)} de {fmtNum(maxPaginas)}</span>
          {datos.total > MAX_REGISTROS_CONSULTABLES && (
            <p className="basis-full text-xs text-text-muted">
              La consulta alcanza como máximo los primeros {fmtNum(MAX_REGISTROS_CONSULTABLES)} registros; acota con municipio, departamento o años para ver el resto.
            </p>
          )}
        </nav>
      )}
    </div>
  )
}
