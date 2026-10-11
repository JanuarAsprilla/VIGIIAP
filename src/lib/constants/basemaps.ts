// Mapas base gratuitos, sin API key -- mismo catálogo que se portó de producto6-reportes-vigia.
// Google Maps se descartó ahí por exigir key de pago; CartoDB Positron/Dark Matter por exigir key
// para el tier gratuito real (verificado en vivo, no solo en la documentación).
export interface BasemapDef {
  id: string
  nombre: string
  capas: { url: string; attribution: string; maxZoom: number }[]
}

export const BASEMAPS: BasemapDef[] = [
  {
    id: 'calles', nombre: 'Calles',
    capas: [{ url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap', maxZoom: 19 }],
  },
  {
    id: 'claro', nombre: 'Claro',
    capas: [{ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', attribution: 'Esri', maxZoom: 16 }],
  },
  {
    id: 'oscuro', nombre: 'Oscuro',
    capas: [{ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', attribution: 'Esri', maxZoom: 16 }],
  },
  {
    id: 'satelite', nombre: 'Satélite',
    capas: [{ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Esri, Maxar, Earthstar Geographics', maxZoom: 19 }],
  },
  {
    id: 'hibrido', nombre: 'Híbrido',
    capas: [
      { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Esri, Maxar, Earthstar Geographics', maxZoom: 19 },
      { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', attribution: '', maxZoom: 19 },
    ],
  },
  {
    id: 'topografico', nombre: 'Topográfico',
    capas: [{ url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap · SRTM · OpenTopoMap (CC-BY-SA)', maxZoom: 17 }],
  },
  {
    id: 'relieve', nombre: 'Relieve',
    capas: [{ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}', attribution: 'Esri', maxZoom: 13 }],
  },
]

export const BASEMAP_POR_DEFECTO = 'calles'
