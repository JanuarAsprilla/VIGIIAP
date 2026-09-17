import { TileLayer } from 'react-leaflet'
import { BASEMAPS, BASEMAP_POR_DEFECTO } from '@/lib/constants/basemaps'

export default function BasemapCapas({ basemapId }: { basemapId: string }) {
  const basemap = BASEMAPS.find((b) => b.id === basemapId) ?? BASEMAPS.find((b) => b.id === BASEMAP_POR_DEFECTO)!
  return (
    <>
      {basemap.capas.map((capa, i) => (
        <TileLayer key={`${basemap.id}-${i}`} url={capa.url} attribution={capa.attribution} maxZoom={capa.maxZoom} zIndex={i} />
      ))}
    </>
  )
}
