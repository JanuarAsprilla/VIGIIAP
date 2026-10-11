interface SparklineProps {
  /** Serie de valores, del más viejo al más nuevo. El último punto es el "actual". */
  data: number[]
  /** Color del punto final (el resto de la línea siempre usa el tono atenuado). */
  endColor: string
  width?: number
  height?: number
  className?: string
}

/** Mini-tendencia de 7 puntos para tarjetas KPI — línea atenuada, punto final en el color de estado. */
export default function Sparkline({ data, endColor, width = 64, height = 22, className }: SparklineProps) {
  if (data.length === 0) return null

  const max = Math.max(...data)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const pad = 2
  const step = data.length > 1 ? (width - 2) / (data.length - 1) : 0

  const coords = data.map((v, i) => ({
    x: 1 + i * step,
    y: height - pad - ((v - min) / range) * (height - pad * 2),
  }))
  const points = coords.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const last = coords[coords.length - 1]

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label={`Tendencia de los últimos ${data.length} días: ${data.join(', ')}`}
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-primary-100, #C8E6CE)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r={2.6} fill={endColor} stroke="var(--card-bg)" strokeWidth={1.5} />
    </svg>
  )
}
