import type { ComponentType } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import Sparkline from '@/components/ui/Sparkline'
import DeltaBadge from '@/components/ui/DeltaBadge'

export interface Metric {
  label: string
  value: number | string
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  loading?: boolean
  /** Omitido cuando la métrica no tiene un período anterior contra el que compararse. */
  deltaPct?: number
  /** Serie diaria -- solo para métricas que de verdad tienen ese desglose. */
  sparkline?: number[]
  sparklineColor?: string
}

/**
 * Franja editorial de métricas -- un solo panel con columnas separadas por
 * líneas finas, en vez de N tarjetas idénticas con su propio borde, sombra e
 * ícono de color (el patrón "grid de cards iguales" que hace ver genérico
 * cualquier panel de KPIs). El color vive solo en el DeltaBadge y en el punto
 * final del sparkline -- el ícono es monocromo, es un rótulo, no decoración.
 */
export default function MetricPanel({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="bg-[var(--card-bg)] border border-border/70 rounded-xl flex flex-col divide-y divide-border/70 sm:flex-row sm:divide-y-0 sm:divide-x">
      {metrics.map((m) => {
        const Icon = m.icon
        return (
          <div key={m.label} className="p-5 flex flex-col gap-3 min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              {Icon && <Icon className="w-3.5 h-3.5 text-text-muted" aria-hidden />}
              {m.deltaPct !== undefined && <DeltaBadge pct={m.deltaPct} />}
            </div>
            <div className="stat-figure">
              {m.loading ? <Skeleton className="h-8 w-14" /> : m.value}
            </div>
            <div className="flex items-end justify-between gap-2">
              <p className="data-label truncate">{m.label}</p>
              {m.sparkline && m.sparkline.length > 0 && (
                <Sparkline data={m.sparkline} endColor={m.sparklineColor ?? 'var(--color-primary-600)'} className="shrink-0" />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
