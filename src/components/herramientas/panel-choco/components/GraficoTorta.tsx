import { Pie } from 'react-chartjs-2'
import type { TooltipItem } from 'chart.js'
import { BASE_CHART_OPTIONS, colorDepto } from '../palette'

interface GraficoTortaProps {
  labels: string[]
  valores: number[]
  unidad?: string
  alto?: number
}

export default function GraficoTorta({ labels, valores, unidad = '%', alto = 250 }: GraficoTortaProps) {
  const data = {
    labels,
    datasets: [{
      data: valores,
      backgroundColor: labels.map((_, i) => colorDepto(i)),
      borderColor: '#FFFFFF',
      borderWidth: 2,
    }],
  }

  return (
    <div style={{ height: alto }}>
      <Pie
        data={data}
        options={{
          ...BASE_CHART_OPTIONS,
          plugins: {
            ...BASE_CHART_OPTIONS.plugins,
            legend: { position: 'bottom', labels: BASE_CHART_OPTIONS.plugins?.legend?.labels },
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
  )
}
