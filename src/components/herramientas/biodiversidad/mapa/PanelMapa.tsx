import { lazy, Suspense, useCallback, useId, useState } from 'react'
import type { Map as MapaLeaflet } from 'leaflet'
import { Cargando, PanelError } from '../EstadoConsulta'
import { ETIQUETA_METRICA, METRICAS, type Metrica } from '../lib/metrica'
import type { Grupo, MunicipioConteo, ParamsApi } from '../types'
import { InterruptorPuntos, MensajesPuntos } from './ControlPuntos'
import LeyendaEscala from './LeyendaEscala'
import { useGeoMunicipios } from './geoMunicipios'
import { INFO_INICIAL, type Enfoque, type InfoPuntos } from './tiposPuntos'

const MapaMunicipios = lazy(() => import('./MapaMunicipios'))
const CapaPuntos = lazy(() => import('./CapaPuntos'))

interface Props {
  grupo: Grupo
  datos: Map<string, MunicipioConteo>
  metrica: Metrica
  cortes: number[]
  maximo: number
  seleccionado: string | null
  departamento: string | null
  cargandoDatos: boolean
  /** Solo grupos individuales tienen puntos. */
  puntosDisponibles: boolean
  puntosActivos: boolean
  paramsPuntos: ParamsApi
  enfoque: Enfoque | null
  onSeleccionar: (codigo: string | null) => void
  onMetrica: (m: Metrica) => void
  onPuntos: (activo: boolean) => void
  onAbrirRegistro: (id: string, origen: HTMLElement) => void
}

export default function PanelMapa({
  grupo, datos, metrica, cortes, maximo, seleccionado, departamento, cargandoDatos, puntosDisponibles, puntosActivos, paramsPuntos,
  enfoque, onSeleccionar, onMetrica, onPuntos, onAbrirRegistro,
}: Props) {
  const geo = useGeoMunicipios()
  const titulo = useId()
  const [mapa, setMapa] = useState<MapaLeaflet | null>(null)
  const [info, setInfo] = useState<InfoPuntos>(INFO_INICIAL)
  const capaActiva = puntosActivos && puntosDisponibles
  const alInfo = useCallback((i: InfoPuntos) => setInfo(i), [])
  return (
    <section id="bio-mapa-seccion" className="bio-panel p-3 sm:p-4" aria-labelledby={titulo}>
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
      <div className="px-1 pb-3">
        <InterruptorPuntos activo={capaActiva} disponible={puntosDisponibles} onCambio={onPuntos} />
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
              seleccionado={seleccionado} departamento={departamento} onSeleccionar={onSeleccionar} onMapa={setMapa}
            />
          </Suspense>
          {!cargandoDatos && maximo > 0 && <LeyendaEscala cortes={cortes} maximo={maximo} metrica={metrica} />}
        </div>
      )}
      {capaActiva && mapa && (
        <Suspense fallback={null}>
          <CapaPuntos mapa={mapa} grupo={grupo} params={paramsPuntos} enfoque={enfoque} onAbrir={onAbrirRegistro} onInfo={alInfo} />
        </Suspense>
      )}
      {capaActiva && <MensajesPuntos info={info} onReintentar={info.reintentar} />}
    </section>
  )
}
