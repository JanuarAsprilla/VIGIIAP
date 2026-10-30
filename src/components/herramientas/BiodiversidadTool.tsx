import { lazy, Suspense } from 'react'

// Carga perezosa: el mapa, el GeoJSON y las tablas no deben engordar el chunk compartido
// de /herramientas, que las demás herramientas (livianas) sí cargan siempre.
const Biodiversidad = lazy(() => import('./biodiversidad/Biodiversidad'))

function BiodiversidadSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" role="status" aria-label="Cargando observatorio de biodiversidad">
      <div className="h-40 bg-bg-alt rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 bg-bg-alt rounded-xl" />)}
      </div>
      <div className="grid lg:grid-cols-[5fr_6fr] gap-6">
        <div className="h-[560px] bg-bg-alt rounded-xl" />
        <div className="h-[560px] bg-bg-alt rounded-xl" />
      </div>
    </div>
  )
}

export default function BiodiversidadTool() {
  return (
    <Suspense fallback={<BiodiversidadSkeleton />}>
      <Biodiversidad />
    </Suspense>
  )
}
