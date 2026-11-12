import { lazy, Suspense } from 'react'
import { Skeleton, RegionCargando } from '@/components/ui/Skeleton'

// Carga perezosa: el mapa, el GeoJSON y las tablas no deben engordar el chunk compartido
// de /herramientas, que las demás herramientas (livianas) sí cargan siempre.
const Biodiversidad = lazy(() => import('./biodiversidad/Biodiversidad'))

function BiodiversidadSkeleton() {
  return (
    <RegionCargando etiqueta="Cargando observatorio de biodiversidad" className="space-y-4">
      <Skeleton className="h-40 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid lg:grid-cols-[5fr_6fr] gap-6">
        <Skeleton className="h-[560px] rounded-xl" />
        <Skeleton className="h-[560px] rounded-xl" />
      </div>
    </RegionCargando>
  )
}

export default function BiodiversidadTool() {
  return (
    <Suspense fallback={<BiodiversidadSkeleton />}>
      <Biodiversidad />
    </Suspense>
  )
}
