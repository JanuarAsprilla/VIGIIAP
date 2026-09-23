import { lazy, Suspense } from 'react'

// Carga perezosa: leaflet.markercluster + turf + el GeoJSON de los 92
// municipios (~76 KB) no deben ir en el chunk compartido de /herramientas,
// que las demás herramientas (livianas) sí cargan siempre.
const ValidadorCoordenadas = lazy(() => import('./validador-coordenadas/ValidadorCoordenadas'))

function ValidadorSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" role="status" aria-label="Cargando validador de coordenadas">
      <div className="h-10 bg-bg-alt rounded-lg" />
      <div className="grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-16 bg-bg-alt rounded-xl" />)}
      </div>
      <div className="h-[440px] bg-bg-alt rounded-xl" />
    </div>
  )
}

interface ValidadorCoordenadasToolProps {
  onToast?: (msg: string) => void
}

// Contenido puro, sin ToolCard/tilt — se muestra a pantalla completa cuando el
// usuario abre la herramienta desde HerramientaLauncherCard, no dentro de la grilla.
export default function ValidadorCoordenadasTool({ onToast }: ValidadorCoordenadasToolProps) {
  return (
    <Suspense fallback={<ValidadorSkeleton />}>
      <ValidadorCoordenadas onToast={onToast} />
    </Suspense>
  )
}
