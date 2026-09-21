import { lazy, Suspense } from 'react'
import { BarChart3 } from 'lucide-react'
import ToolCard from './ToolCard'

// Carga perezosa: Chart.js + los datasets territoriales no deben ir en el chunk
// compartido de /herramientas, que las demás herramientas (livianas) sí cargan siempre.
const PanelChocoBiogeografico = lazy(() => import('./panel-choco/PanelChocoBiogeografico'))

function PanelChocoSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" role="status" aria-label="Cargando panel territorial">
      <div className="h-4 w-2/3 bg-bg-alt rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-bg-alt rounded-xl" />
        <div className="h-64 bg-bg-alt rounded-xl" />
      </div>
    </div>
  )
}

export default function PanelChocoTool() {
  return (
    <ToolCard
      tag="Reportes"
      title="Panel de Análisis Territorial — Chocó Biogeográfico"
      icon={BarChart3}
      color="gold"
      index={6}
    >
      <Suspense fallback={<PanelChocoSkeleton />}>
        <PanelChocoBiogeografico />
      </Suspense>
    </ToolCard>
  )
}
