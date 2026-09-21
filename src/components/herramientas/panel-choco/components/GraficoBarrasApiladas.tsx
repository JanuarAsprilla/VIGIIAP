import { Bar } from 'react-chartjs-2'
import { BASE_CHART_OPTIONS, BAR_SCALES_OPTIONS } from '../palette'

interface SerieBarra {
  label: string
  datos: number[]
  color: string
}

interface GraficoBarrasApiladasProps {
  labels: string[]
  series: SerieBarra[]
  alto?: number
  mostrarLeyenda?: boolean
}

export default function GraficoBarrasApiladas({ labels, series, alto = 300, mostrarLeyenda = true }: GraficoBarrasApiladasProps) {
  return (
    <div style={{ height: alto }}>
      <Bar
        data={{
          labels,
          datasets: series.map((s) => ({ label: s.label, data: s.datos, backgroundColor: s.color })),
        }}
        options={{
          ...BASE_CHART_OPTIONS,
          scales: {
            x: { ...BAR_SCALES_OPTIONS.x, stacked: true },
            y: { ...BAR_SCALES_OPTIONS.y, stacked: true },
          },
          plugins: {
            ...BASE_CHART_OPTIONS.plugins,
            legend: { display: mostrarLeyenda, position: 'bottom', labels: BASE_CHART_OPTIONS.plugins?.legend?.labels },
          },
        }}
      />
    </div>
  )
}
