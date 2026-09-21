import { Pie } from 'react-chartjs-2'
import type { TooltipItem } from 'chart.js'
import { BASE_CHART_OPTIONS, colorDepto } from '../../palette'
import GraficoBarrasApiladas from '../../components/GraficoBarrasApiladas'
import TablaDatos, { type ColumnaTabla } from '../../components/TablaDatos'
import type { CategoriaDeptoSerie } from '../../types'

interface SeccionCategoriaPorDeptoProps {
  deptos: string[]
  series: CategoriaDeptoSerie[]
  unidad?: string
  etiquetaMetrica?: string
}

interface FilaCategoria {
  nombre: string
  total: number
  pct: number
}

/** Vista compartida para datasets con varias categorías por departamento (RUNAP,
 * humedales, páramos) — barras apiladas por depto + torta de totales por categoría +
 * tabla. Distinta de SeccionEntidadSimple a propósito: aquí cada depto tiene N valores
 * (uno por categoría), no uno solo. `etiquetaMetrica` evita que "Área" quede hardcodeado
 * cuando la métrica no es área (ej. población en habitantes) — ver PoblacionEtnias.tsx. */
export default function SeccionCategoriaPorDepto({ deptos, series, unidad = 'Ha', etiquetaMetrica = 'Área' }: SeccionCategoriaPorDeptoProps) {
  const totalesPorCategoria = series.map((s) => s.datos.reduce((acc, v) => acc + v, 0))
  const totalGeneral = totalesPorCategoria.reduce((acc, v) => acc + v, 0)
  const colores = series.map((s, i) => s.color ?? colorDepto(i))

  const filasTabla: FilaCategoria[] = series.map((s, i) => ({
    nombre: s.nombre,
    total: totalesPorCategoria[i],
    pct: totalGeneral > 0 ? (totalesPorCategoria[i] / totalGeneral) * 100 : 0,
  })).sort((a, b) => b.total - a.total)

  const columnas: ColumnaTabla<FilaCategoria>[] = [
    { key: 'nombre', label: 'Categoría', render: (f) => f.nombre },
    {
      key: 'total', label: `${etiquetaMetrica} (${unidad})`, align: 'right',
      render: (f) => f.total.toLocaleString('es-CO', { maximumFractionDigits: 1 }),
      valorOrden: (f) => f.total,
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
          <h3 className="text-sm font-bold text-text mb-3">{etiquetaMetrica} por departamento y categoría ({unidad})</h3>
          <GraficoBarrasApiladas
            labels={deptos}
            series={series.map((s, i) => ({ label: s.nombre, datos: s.datos, color: colores[i] }))}
            mostrarLeyenda={series.length <= 6}
          />
        </div>
        <div className="bg-[var(--card-bg)] border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-text mb-3">Porcentaje de {etiquetaMetrica.toLowerCase()} por categoría</h3>
          <div style={{ height: 300 }}>
            <Pie
              data={{
                labels: series.map((s) => s.nombre),
                datasets: [{ data: totalesPorCategoria, backgroundColor: colores, borderColor: '#FFFFFF', borderWidth: 2 }],
              }}
              options={{
                ...BASE_CHART_OPTIONS,
                plugins: {
                  ...BASE_CHART_OPTIONS.plugins,
                  legend: { display: series.length <= 6, position: 'bottom', labels: BASE_CHART_OPTIONS.plugins?.legend?.labels },
                  tooltip: {
                    ...BASE_CHART_OPTIONS.plugins?.tooltip,
                    callbacks: {
                      label: (ctx: TooltipItem<'pie'>) =>
                        ` ${ctx.label}: ${Number(ctx.parsed).toLocaleString('es-CO', { maximumFractionDigits: 1 })} ${unidad}`,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
      <TablaDatos columnas={columnas} filas={filasTabla} claveFila={(f) => f.nombre} />
    </div>
  )
}
