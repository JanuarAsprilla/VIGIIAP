import type { CapaInventario, EspacioInventario, EstiloInventario, GrupoInventario } from '@/types'
import type { ColumnaTabla } from './TablaDatos'
import { Codigo, EstadoCapa, Guion } from './CeldasInventario'

const orGuion = (v: string | null | undefined) => v?.trim() || <Guion />

export const columnasEspacios: ColumnaTabla<EspacioInventario>[] = [
  { clave: 'nombre', titulo: 'Espacio de trabajo', render: (e) => <span className="font-semibold text-text">{e.nombre}</span> },
  { clave: 'titulo', titulo: 'Título del servicio', render: (e) => orGuion(e.titulo) },
  { clave: 'capas', titulo: 'Capas', clase: 'tabular-nums', render: (e) => e.capas },
  { clave: 'grupos', titulo: 'Grupos', clase: 'tabular-nums', render: (e) => e.grupos },
]

export const columnasCapas: ColumnaTabla<CapaInventario>[] = [
  { clave: 'capa', titulo: 'Capa', render: (c) => (
    <div className="space-y-0.5">
      <p className="font-semibold text-text">{c.titulo?.trim() || c.nombre}</p>
      <Codigo>{c.capa_id}</Codigo>
    </div>
  ) },
  { clave: 'tipo', titulo: 'Tipo', render: (c) => (c.tipo === 'raster' ? 'Raster' : c.tipo === 'vectorial' ? 'Vectorial' : <Guion />) },
  { clave: 'estilo', titulo: 'Estilo por defecto', render: (c) => (c.estilo_defecto ? <Codigo>{c.estilo_defecto}</Codigo> : <Guion />) },
  { clave: 'estado', titulo: 'Estado', render: (c) => <EstadoCapa capa={c} /> },
]

export const columnasGrupos: ColumnaTabla<GrupoInventario>[] = [
  { clave: 'grupo', titulo: 'Grupo', render: (g) => (
    <div className="space-y-0.5">
      <p className="font-semibold text-text">{g.titulo?.trim() || g.nombre}</p>
      <Codigo>{g.grupo_id}</Codigo>
    </div>
  ) },
  { clave: 'espacio', titulo: 'Espacio', render: (g) => orGuion(g.espacio) },
  { clave: 'modo', titulo: 'Modo', render: (g) => (g.modo ? <Codigo>{g.modo}</Codigo> : <Guion />) },
  { clave: 'miembros', titulo: 'Miembros', render: (g) => {
    const miembros = g.miembros ?? []
    if (miembros.length === 0) return <Guion />
    return (
      <div className="space-y-0.5">
        <p className="text-xs font-semibold text-text">{miembros.length === 1 ? '1 capa' : `${miembros.length} capas`}</p>
        <Codigo>{miembros.join(', ')}</Codigo>
      </div>
    )
  } },
]

export const columnasEstilos: ColumnaTabla<EstiloInventario>[] = [
  { clave: 'nombre', titulo: 'Estilo', render: (e) => <span className="font-semibold text-text">{e.nombre}</span> },
  { clave: 'espacio', titulo: 'Espacio', render: (e) => orGuion(e.espacio) },
  { clave: 'formato', titulo: 'Formato', render: (e) => (e.formato ? <Codigo>{e.formato}</Codigo> : <Guion />) },
]
