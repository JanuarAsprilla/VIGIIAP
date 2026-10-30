import { lazy, Suspense } from 'react'
import { Cargando, PanelError } from '../EstadoConsulta'
import type { MunicipioConteo } from '../types'
import LeyendaEscala from './LeyendaEscala'
import { useGeoMunicipios } from './geoMunicipios'

const MapaMunicipios = lazy(() => import('./MapaMunicipios'))

interface Props {
  datos: Map<string, MunicipioConteo>
  cortes: number[]
  maximo: number
  seleccionado: string | null
  departamento: string | null
  cargandoDatos: boolean
  onSeleccionar: (codigo: string | null) => void
}

export default function PanelMapa({ datos, cortes, maximo, seleccionado, departamento, cargandoDatos, onSeleccionar }: Props) {
  const geo = useGeoMunicipios()
  return (
    <section className="bio-panel p-3 sm:p-4" aria-labelledby="bio-mapa-titulo">
      <div className="px-1 pb-3">
        <h2 id="bio-mapa-titulo" className="section-title">Mapa por municipio</h2>
        <p className="text-xs text-text-muted mt-0.5">Selecciona un municipio con clic o con las flechas del teclado. La tabla ofrece lo mismo en formato de lista.</p>
      </div>
      {geo.isError ? (
        <PanelError error={geo.error} onReintentar={() => void geo.refetch()} compacto />
      ) : !geo.data ? (
        <Cargando etiqueta="Cargando mapa" className="bio-mapa" />
      ) : (
        <div className="relative" aria-busy={cargandoDatos}>
          <Suspense fallback={<Cargando etiqueta="Cargando mapa" className="bio-mapa" />}>
            <MapaMunicipios
              geo={geo.data}
              datos={datos}
              cortes={cortes}
              seleccionado={seleccionado}
              departamento={departamento}
              onSeleccionar={onSeleccionar}
            />
          </Suspense>
          {!cargandoDatos && maximo > 0 && <LeyendaEscala cortes={cortes} maximo={maximo} />}
        </div>
      )}
    </section>
  )
}
