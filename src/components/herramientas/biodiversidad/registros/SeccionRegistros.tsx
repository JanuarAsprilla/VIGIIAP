import { useRef } from 'react'
import { LayoutGrid, Table2 } from 'lucide-react'
import { useBiodiversidadRegistros } from '@/hooks/useBiodiversidad'
import { Cargando, PanelError, PanelVacio } from '../EstadoConsulta'
import Paginacion from '../Paginacion'
import { fmtNum } from '../lib/format'
import { MAX_REGISTROS_CONSULTABLES, TAMANO_PAGINA, type ModoRegistros } from '../lib/parametros'
import type { Grupo, MunicipioConteo, RegistroBiodiversidad } from '../types'
import DetalleRegistro from './DetalleRegistro'
import FiltrosRegistros, { type ValoresFiltro } from './FiltrosRegistros'
import TablaRegistros from './TablaRegistros'
import TarjetaRegistro from './TarjetaRegistro'

interface Props {
  grupo: Grupo
  municipios: MunicipioConteo[]
  valores: ValoresFiltro
  pagina: number
  modo: ModoRegistros
  abierto: string | null
  desde: number
  hasta: number
  onCambio: (cambios: Record<string, string | number | null>) => void
  onLimpiar: () => void
}

export default function SeccionRegistros({ grupo, municipios, valores, pagina, modo, abierto, desde, hasta, onCambio, onLimpiar }: Props) {
  const origen = useRef<HTMLElement | null>(null)
  const consulta = useBiodiversidadRegistros({
    grupo,
    pagina,
    tamano: TAMANO_PAGINA,
    codigo_municipal: valores.municipio ?? undefined,
    departamento: valores.municipio ? undefined : valores.departamento ?? undefined,
    anio_desde: valores.anioDesde ?? undefined,
    anio_hasta: valores.anioHasta ?? undefined,
    buscar: valores.buscar || undefined,
    con_foto: valores.conFoto ? 'true' : undefined,
    conservacion: valores.conservacion ?? undefined,
    amenaza: valores.amenaza ?? undefined,
    especie_clave: valores.especie ?? undefined,
  }, true)

  const datos = consulta.data
  const maxPaginas = datos ? Math.max(1, Math.min(Math.ceil(datos.total / TAMANO_PAGINA), Math.floor(MAX_REGISTROS_CONSULTABLES / TAMANO_PAGINA))) : 1
  const primero = datos && datos.total > 0 ? (datos.pagina - 1) * TAMANO_PAGINA + 1 : 0
  const ultimo = datos ? Math.min(datos.pagina * TAMANO_PAGINA, datos.total) : 0

  function abrir(r: RegistroBiodiversidad, el: HTMLElement) {
    origen.current = el
    onCambio({ registro: r.gbif_id, pagina })
  }

  return (
    <div className="space-y-4">
      <FiltrosRegistros municipios={municipios} valores={valores} desde={desde} hasta={hasta} onCambio={onCambio} onLimpiar={onLimpiar} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-muted" role="status" aria-live="polite">
          {datos ? (datos.total > 0
            ? `Mostrando ${fmtNum(primero)}–${fmtNum(ultimo)} de ${fmtNum(datos.total)} registros`
            : 'Sin registros con estos filtros') : consulta.isPending ? 'Cargando registros…' : ''}
        </p>
        <div role="group" aria-label="Forma de ver los registros" className="bio-segmentos">
          <button type="button" aria-pressed={modo === 'tarjetas'} onClick={() => onCambio({ modo: null })}><LayoutGrid className="w-4 h-4" aria-hidden="true" />Tarjetas</button>
          <button type="button" aria-pressed={modo === 'tabla'} onClick={() => onCambio({ modo: 'tabla' })}><Table2 className="w-4 h-4" aria-hidden="true" />Tabla</button>
        </div>
      </div>
      {consulta.isError && !datos ? (
        <PanelError error={consulta.error} onReintentar={() => void consulta.refetch()} />
      ) : !datos ? (
        <Cargando etiqueta="Cargando registros" className="h-80" />
      ) : datos.total === 0 ? (
        <PanelVacio titulo="Sin registros" detalle="Prueba ampliando el rango de años o quitando filtros como «Solo con foto»." />
      ) : (
        <div className={consulta.isFetching ? 'bio-cargando' : ''} aria-busy={consulta.isFetching}>
          {modo === 'tabla' ? (
            <TablaRegistros registros={datos.registros} onAbrir={abrir} />
          ) : (
            <ul className="bio-rejilla-tarjetas">
              {datos.registros.map((r) => <li key={r.gbif_id}><TarjetaRegistro r={r} onAbrir={abrir} /></li>)}
            </ul>
          )}
        </div>
      )}
      {consulta.isError && datos && <PanelError error={consulta.error} onReintentar={() => void consulta.refetch()} compacto />}
      <Paginacion
        etiqueta="Paginación de registros" pagina={pagina} maxPaginas={maxPaginas} onCambio={(p) => onCambio({ pagina: p })}
        nota={datos && datos.total > MAX_REGISTROS_CONSULTABLES
          ? `La consulta alcanza como máximo los primeros ${fmtNum(MAX_REGISTROS_CONSULTABLES)} registros; acota con municipio, departamento o años para ver el resto.` : undefined}
      />
      {abierto && (
        <DetalleRegistro grupo={grupo} gbifId={abierto} origen={origen} onCerrar={() => onCambio({ registro: null, pagina })} />
      )}
    </div>
  )
}
