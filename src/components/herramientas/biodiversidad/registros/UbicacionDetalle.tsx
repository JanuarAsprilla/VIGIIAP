import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Check, Copy, EyeOff, MapPin } from 'lucide-react'
import { Cargando } from '../EstadoConsulta'
import { ubicacionPublica } from '../lib/puntos'
import { useGeoMunicipios } from '../mapa/geoMunicipios'
import type { RegistroBiodiversidad } from '../types'

const MiniMapa = lazy(() => import('../mapa/MiniMapa'))
const COORD = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 5, maximumFractionDigits: 5 })
const AVISO_MS = 2200

interface Props {
  r: RegistroBiodiversidad
  onVerEnMapa?: (r: RegistroBiodiversidad) => void
}

type Copia = 'ninguna' | 'copiado' | 'fallo'

function Copiar({ texto }: { texto: string }) {
  const [estado, setEstado] = useState<Copia>('ninguna')
  const temporizador = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(temporizador.current), [])
  async function copiar() {
    let resultado: Copia = 'fallo'
    try {
      await navigator.clipboard.writeText(texto)
      resultado = 'copiado'
    } catch {
      resultado = 'fallo'
    }
    setEstado(resultado)
    window.clearTimeout(temporizador.current)
    temporizador.current = window.setTimeout(() => setEstado('ninguna'), AVISO_MS)
  }
  return (
    <>
      <button type="button" className="bio-boton bio-boton-chico" onClick={() => void copiar()}>
        {estado === 'copiado' ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
        Copiar coordenadas
      </button>
      <span className="sr-only" role="status">
        {estado === 'copiado' ? 'Coordenadas copiadas' : estado === 'fallo' ? 'No se pudieron copiar las coordenadas' : ''}
      </span>
      {estado === 'fallo' && <span className="text-[0.6875rem] text-text-muted">No se pudo copiar; selecciona el texto.</span>}
    </>
  )
}

/** Ubicación del registro en el detalle: mini-mapa y coordenadas cuando son públicas; si no, un panel que explica la reserva. */
export default function UbicacionDetalle({ r, onVerEnMapa }: Props) {
  const geo = useGeoMunicipios()
  const publica = ubicacionPublica(r)
  if (!publica) {
    return (
      <section className="bio-ubicacion-reservada" aria-labelledby="bio-det-ubicacion">
        <EyeOff className="w-5 h-5 shrink-0" aria-hidden="true" />
        <div>
          <h3 id="bio-det-ubicacion" className="font-bold text-sm">Ubicación reservada</h3>
          <p className="text-sm text-text-light mt-0.5">
            {r.coordenadas_ocultas
              ? 'Las especies amenazadas y los registros sin especie determinada no muestran su ubicación para evitar daños. El municipio sí es público.'
              : 'El publicador no entregó coordenadas para este registro. El municipio sí es público.'}
          </p>
        </div>
      </section>
    )
  }
  const texto = `${COORD.format(publica.lat)}, ${COORD.format(publica.lon)}`
  const incertidumbre = r.incertidumbre_m !== null ? ` ± ${new Intl.NumberFormat('es-CO').format(r.incertidumbre_m)} m` : ''
  return (
    <section className="bio-ubicacion" aria-labelledby="bio-det-ubicacion">
      <h3 id="bio-det-ubicacion" className="bio-eyebrow mb-2">Ubicación</h3>
      <Suspense fallback={<Cargando etiqueta="Cargando mapa del registro" className="bio-minimapa" />}>
        <MiniMapa
          lat={publica.lat} lon={publica.lon} incertidumbreM={r.incertidumbre_m} codigoMunicipal={r.codigo_municipal} geo={geo.data}
          descripcion={`Mapa de ${r.municipio}, ${r.departamento}, con el punto del registro en ${texto}${incertidumbre}`}
        />
      </Suspense>
      <p className="mt-2 text-sm tabular-nums">{texto}{incertidumbre}</p>
      {r.incertidumbre_m === null && <p className="text-[0.6875rem] text-text-muted">El publicador no informó la incertidumbre de la coordenada.</p>}
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <Copiar texto={`${publica.lat}, ${publica.lon}`} />
        {onVerEnMapa && (
          <button type="button" className="bio-boton bio-boton-chico" onClick={() => onVerEnMapa(r)}>
            <MapPin className="w-4 h-4" aria-hidden="true" />Ver en el mapa general
          </button>
        )}
      </div>
    </section>
  )
}
