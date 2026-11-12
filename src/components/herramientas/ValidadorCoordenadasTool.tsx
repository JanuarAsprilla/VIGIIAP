import { lazy, Suspense } from 'react'
import { Skeleton, RegionCargando } from '@/components/ui/Skeleton'

// Carga perezosa: leaflet.markercluster + turf + el GeoJSON de los 92
// municipios (~76 KB) no deben ir en el chunk compartido de /herramientas,
// que las demás herramientas (livianas) sí cargan siempre.
const ValidadorCoordenadas = lazy(() => import('./validador-coordenadas/ValidadorCoordenadas'))

function ValidadorSkeleton() {
  return (
    <RegionCargando etiqueta="Cargando validador de coordenadas" className="space-y-4">
      <Skeleton className="h-10" />
      <div className="grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
      <Skeleton className="h-[440px] rounded-xl" />
    </RegionCargando>
  )
}

// Contenido puro, sin ToolCard/tilt — se muestra a pantalla completa cuando el
// usuario abre la herramienta desde HerramientaLauncherCard, no dentro de la grilla.
export default function ValidadorCoordenadasTool() {
  return (
    <Suspense fallback={<ValidadorSkeleton />}>
      <ValidadorCoordenadas />
    </Suspense>
  )
}
