import { lazy, Suspense } from 'react'
import { Skeleton, RegionCargando } from '@/components/ui/Skeleton'

// Carga perezosa: Chart.js + los datasets territoriales no deben ir en el chunk
// compartido de /herramientas, que las demás herramientas (livianas) sí cargan siempre.
const PanelChocoBiogeografico = lazy(() => import('./panel-choco/PanelChocoBiogeografico'))

function PanelChocoSkeleton() {
  return (
    <RegionCargando etiqueta="Cargando panel territorial" className="space-y-4">
      <Skeleton className="h-4 w-2/3 rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </RegionCargando>
  )
}

// Contenido puro, sin ToolCard/tilt — se muestra a pantalla completa cuando el
// usuario abre la herramienta desde HerramientaLauncherCard, no dentro de la grilla.
export default function PanelChocoTool() {
  return (
    <Suspense fallback={<PanelChocoSkeleton />}>
      <PanelChocoBiogeografico />
    </Suspense>
  )
}
