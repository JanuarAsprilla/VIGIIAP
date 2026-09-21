import GraficoBarras from '../../components/GraficoBarras'
import GraficoTorta from '../../components/GraficoTorta'
import TablaDatos, { type ColumnaTabla } from '../../components/TablaDatos'
import type { EntidadArea } from '../../types'

interface SeccionEntidadSimpleProps {
  entidades: EntidadArea[]
  unidad?: string
  etiquetaMetrica?: string
  etiquetaColumnaNombre: string
}

/** Vista compartida "barras + torta + tabla" para cualquier listado de entidades con
 * una métrica/porcentaje — departamentos, cuencas, o cualquier otra categoría territorial
 * que comparta esta forma. Real DRY: la misma vista se repite tal cual en 3+ secciones.
 * `etiquetaMetrica` evita que "Área" quede hardcodeado cuando la métrica no es área
 * (ej. población en habitantes) — ver PoblacionEtnias.tsx. */
export default function SeccionEntidadSimple({ entidades, unidad = 'Ha', etiquetaMetrica = 'Área', etiquetaColumnaNombre }: SeccionEntidadSimpleProps) {
  const ordenadas = [...entidades].sort((a, b) => b.area - a.area)
  const columnas: ColumnaTabla<EntidadArea>[] = [
    { key: 'name', label: etiquetaColumnaNombre, render: (f) => f.name },
    {
      key: 'area', label: `${etiquetaMetrica} (${unidad})`, align: 'right',
      render: (f) => f.area.toLocaleString('es-CO', { maximumFractionDigits: 1 }),
      valorOrden: (f) => f.area,
    },
    {
      key: 'pct', label: '% del total', align: 'right',
      render: (f) => `${f.pct.toLocaleString('es-CO', { maximumFractionDigits: 1 })}%`,
      valorOrden: (f) => f.pct,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--card-bg)] border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-text mb-3">{etiquetaMetrica} por {etiquetaColumnaNombre.toLowerCase()}</h3>
          <GraficoBarras labels={ordenadas.map((e) => e.name)} valores={ordenadas.map((e) => e.area)} unidad={unidad} />
        </div>
        <div className="bg-[var(--card-bg)] border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-text mb-3">Distribución porcentual</h3>
          <GraficoTorta labels={ordenadas.map((e) => e.name)} valores={ordenadas.map((e) => e.pct)} />
        </div>
      </div>
      <TablaDatos columnas={columnas} filas={ordenadas} claveFila={(f) => f.id} />
    </div>
  )
}
