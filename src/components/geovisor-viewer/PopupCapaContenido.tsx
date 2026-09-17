import { Loader2, ImageOff } from 'lucide-react'
import { metricaDeGeometria } from '@/lib/geo/areaUtils'
import type { CapaGeoserver, PresentacionGeovisor } from '@/types'

export interface ResultadoCapaClick {
  capa: CapaGeoserver
  color: string
  features: GeoJSON.Feature[]
  error?: string
}

const CLAVES_TECNICAS = /^(shape_|fid_|objectid|the_geom|geom)/i
const MAX_FEATURES_POR_CAPA = 3

function atributosDeFeature(feature: GeoJSON.Feature, presentacion: PresentacionGeovisor) {
  const props = (feature.properties ?? {}) as Record<string, unknown>
  if (presentacion.camposPopup.length > 0) {
    return presentacion.camposPopup
      .filter(({ campo }) => props[campo] !== undefined && props[campo] !== null)
      .map(({ campo, alias }) => ({ alias, valor: String(props[campo]) }))
  }
  return Object.entries(props)
    .filter(([clave, valor]) => valor !== null && valor !== undefined && !CLAVES_TECNICAS.test(clave))
    .map(([clave, valor]) => ({ alias: clave, valor: String(valor) }))
}

function TarjetaFeature({ feature, presentacion, nombreCapa }: { feature: GeoJSON.Feature; presentacion: PresentacionGeovisor; nombreCapa: string }) {
  const atributos = atributosDeFeature(feature, presentacion)
  const props = (feature.properties ?? {}) as Record<string, unknown>
  const urlImagen = presentacion.mostrarImagenes && presentacion.campoImagenUrl
    ? props[presentacion.campoImagenUrl]
    : null
  const metrica = presentacion.mostrarMetricas && feature.geometry ? metricaDeGeometria(feature.geometry) : null

  return (
    <div className="space-y-1.5">
      {typeof urlImagen === 'string' && urlImagen ? (
        <img src={urlImagen} alt={`Foto de ${nombreCapa}`} className="w-full h-24 object-cover rounded-lg" loading="lazy" />
      ) : presentacion.mostrarImagenes ? (
        <div className="w-full h-16 rounded-lg bg-bg-alt flex items-center justify-center text-text-muted/50">
          <ImageOff className="w-4 h-4" aria-hidden="true" />
        </div>
      ) : null}

      {metrica && (
        <p className="text-[0.65rem] font-bold text-primary-700">{metrica}</p>
      )}

      {atributos.length > 0 ? (
        <dl className="text-xs space-y-0.5">
          {atributos.map(({ alias, valor }) => (
            <div key={alias} className="flex gap-2">
              <dt className="text-text-muted shrink-0">{alias}:</dt>
              <dd className="text-text font-medium truncate">{valor}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-xs text-text-muted italic">Sin atributos para mostrar</p>
      )}
    </div>
  )
}

export default function PopupCapaContenido({ resultados, cargando, presentacion }: {
  resultados: ResultadoCapaClick[] | null
  cargando: boolean
  presentacion: PresentacionGeovisor
}) {
  if (cargando) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-text-muted">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Consultando…
      </div>
    )
  }

  if (!resultados || resultados.every((r) => r.features.length === 0)) {
    return <p className="text-xs text-text-muted py-1">Sin datos en este punto.</p>
  }

  return (
    <div className="space-y-3 max-h-72 overflow-y-auto">
      {resultados.filter((r) => r.features.length > 0).map((resultado) => (
        <div key={resultado.capa.id} className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-bold text-text">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: resultado.color }} aria-hidden="true" />
            {resultado.capa.nombre}
          </p>
          <div className="space-y-2 pl-3.5 border-l-2" style={{ borderColor: `${resultado.color}40` }}>
            {resultado.features.slice(0, MAX_FEATURES_POR_CAPA).map((feature, i) => (
              <TarjetaFeature key={feature.id ?? i} feature={feature} presentacion={presentacion} nombreCapa={resultado.capa.nombre} />
            ))}
            {resultado.features.length > MAX_FEATURES_POR_CAPA && (
              <p className="text-[0.65rem] text-text-muted">
                +{resultado.features.length - MAX_FEATURES_POR_CAPA} más en este punto
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
