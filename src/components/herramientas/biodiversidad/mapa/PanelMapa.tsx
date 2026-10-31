import { lazy, Suspense, useId } from 'react'
import { Cargando, PanelError } from '../EstadoConsulta'
import { ETIQUETA_METRICA, METRICAS, type Metrica } from '../lib/metrica'
import type { MunicipioConteo } from '../types'
import LeyendaEscala from './LeyendaEscala'
import { useGeoMunicipios } from './geoMunicipios'

const MapaMunicipios = lazy(() => import('./MapaMunicipios'))

interface Props {
  datos: Map<string, MunicipioConteo>
  metrica: Metrica
  cortes: number[]
  maximo: number
  seleccionado: string | null
  departamento: string | null
  cargandoDatos: boolean
  onSeleccionar: (codigo: string | null) => void
  onMetrica: (m: Metrica) => void
}

export default function PanelMapa({ datos, metrica, cortes, maximo, seleccionado, departamento, cargandoDatos, onSeleccionar, onMetrica }: Props) {
  const geo = useGeoMunicipios()
  const titulo = useId()
  return (
    <section className="bio-panel p-3 sm:p-4" aria-labelledby={titulo}>
      <div className="px-1 pb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 id={titulo} className="section-title">Mapa por municipio</h2>
          <p className="text-xs text-text-muted mt-0.5">Toca o haz clic en un municipio para ver su detalle y filtrar el resto de la herramienta.</p>
        </div>
        <div role="radiogroup" aria-label="Qué pintar en el mapa" className="bio-segmentos">
          {METRICAS.map((m) => (
            <button key={m} type="button" role="radio" aria-checked={metrica === m} onClick={() => onMetrica(m)}>
              {ETIQUETA_METRICA[m]}
            </button>
          ))}
        </div>
      </div>
      {geo.isError ? (
        <PanelError error={geo.error} onReintentar={() => void geo.refetch()} compacto />
      ) : !geo.data ? (
        <Cargando etiqueta="Cargando mapa" className="bio-mapa" />
      ) : (
        <div aria-busy={cargandoDatos} className="bio-mapa-cuerpo">
          <Suspense fallback={<Cargando etiqueta="Cargando mapa" className="bio-mapa" />}>
            <MapaMunicipios
              geo={geo.data} datos={datos} metrica={metrica} cortes={cortes}
              seleccionado={seleccionado} departamento={departamento} onSeleccionar={onSeleccionar}
            />
          </Suspense>
          {!cargandoDatos && maximo > 0 && <LeyendaEscala cortes={cortes} maximo={maximo} metrica={metrica} />}
        </div>
      )}
    </section>
  )
}
