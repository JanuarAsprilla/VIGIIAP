import { Bar } from 'react-chartjs-2'
import type { TooltipItem } from 'chart.js'
import { BASE_CHART_OPTIONS, BAR_SCALES_OPTIONS, colorDepto } from '../palette'

interface GraficoBarrasProps {
  labels: string[]
  valores: number[]
  unidad?: string
  alto?: number
}

export default function GraficoBarras({ labels, valores, unidad = 'Ha', alto = 280 }: GraficoBarrasProps) {
  const data = {
    labels,
    datasets: [{
      data: valores,
      backgroundColor: labels.map((_, i) => colorDepto(i)),
      borderRadius: 6,
      maxBarThickness: 44,
    }],
  }

  return (
    <div style={{ height: alto }}>
      <Bar
        data={data}
        options={{
          ...BASE_CHART_OPTIONS,
          scales: BAR_SCALES_OPTIONS,
          plugins: {
            ...BASE_CHART_OPTIONS.plugins,
            legend: { display: false },
            tooltip: {
              ...BASE_CHART_OPTIONS.plugins?.tooltip,
              callbacks: {
                label: (ctx: TooltipItem<'bar'>) =>
                  `${Number(ctx.parsed.y).toLocaleString('es-CO', { maximumFractionDigits: 1 })} ${unidad}`,
              },
            },
          },
        }}
      />
    </div>
  )
}
