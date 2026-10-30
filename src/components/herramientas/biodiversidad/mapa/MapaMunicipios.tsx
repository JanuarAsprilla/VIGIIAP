import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { MunicipioConteo } from '../types'
import { claseDe } from '../lib/escala'
import { fmtNum } from '../lib/format'
import { siguienteEnDireccion, type Direccion, type Punto } from '../lib/navegacion'
import type { GeoMunicipios } from './geoMunicipios'

interface Props {
  geo: GeoMunicipios
  datos: Map<string, MunicipioConteo>
  cortes: number[]
  seleccionado: string | null
  departamento: string | null
  onSeleccionar: (codigo: string | null) => void
}

interface Capa {
  layer: L.Path
  tooltip: { nombre: HTMLElement; detalle: HTMLElement }
  depto: string
  nombre: string
  centro: Punto
}

const TECLAS: Record<string, Direccion> = {
  ArrowLeft: 'izquierda', ArrowRight: 'derecha', ArrowUp: 'arriba', ArrowDown: 'abajo',
}

function crearTooltip() {
  const raiz = document.createElement('div')
  const nombre = document.createElement('strong')
  const detalle = document.createElement('span')
  raiz.append(nombre, detalle)
  return { raiz, nombre, detalle }
}

function textoDetalle(m: MunicipioConteo | undefined, depto: string): string {
  return `${depto} · ${m && m.registros > 0 ? `${fmtNum(m.registros)} registros` : 'Sin registros'}`
}

/** Mapa coroplético sin mapa base externo: solo la capa GeoJSON propia. El color lo pone el CSS
 *  (clases bio-c0..bio-c5) para que el cambio de tema no requiera repintar en JS. */
export default function MapaMunicipios({ geo, datos, cortes, seleccionado, departamento, onSeleccionar }: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const capas = useRef(new Map<string, Capa>())
  const alSeleccionar = useRef(onSeleccionar)
  const [foco, setFoco] = useState<string | null>(null)

  useEffect(() => { alSeleccionar.current = onSeleccionar }, [onSeleccionar])

  useEffect(() => {
    const el = contenedor.current
    if (!el) return
    const mapa = L.map(el, {
      zoomControl: false, attributionControl: false, dragging: false, touchZoom: false, doubleClickZoom: false,
      scrollWheelZoom: false, boxZoom: false, keyboard: false, zoomSnap: 0, minZoom: 3, maxZoom: 12,
    })
    const registro = capas.current
    const capa = L.geoJSON(geo, {
      style: () => ({ className: 'bio-m bio-c0', weight: 0.7, fill: true, fillOpacity: 1 }),
      onEachFeature: (f, layer) => {
        const { c, n, d } = f.properties
        const t = crearTooltip()
        layer.bindTooltip(t.raiz, { sticky: true, direction: 'top', className: 'bio-tooltip', opacity: 1 })
        layer.on('click', () => alSeleccionar.current(c))
        const b = (layer as L.Polygon).getBounds().getCenter()
        registro.set(c, { layer: layer as L.Path, tooltip: t, depto: d, nombre: n, centro: { id: c, x: b.lng, y: b.lat } })
      },
    }).addTo(mapa)
    const ajustar = () => {
      mapa.invalidateSize()
      mapa.fitBounds(capa.getBounds(), { padding: [8, 8], animate: false })
    }
    ajustar()
    const ro = new ResizeObserver(ajustar)
    ro.observe(el)
    return () => {
      ro.disconnect()
      mapa.remove()
      registro.clear()
    }
  }, [geo])

  useEffect(() => {
    capas.current.forEach((capa, codigo) => {
      const m = datos.get(codigo)
      const clase = claseDe(m?.registros ?? 0, cortes)
      const el = capa.layer.getElement() as SVGPathElement | null
      capa.tooltip.nombre.textContent = capa.nombre
      capa.tooltip.detalle.textContent = textoDetalle(m, capa.depto)
      if (!el) return
      el.setAttribute('class', [
        'leaflet-interactive', 'bio-m', `bio-c${clase}`,
        codigo === seleccionado ? 'bio-sel' : '',
        codigo === foco ? 'bio-foco' : '',
        departamento && capa.depto !== departamento ? 'bio-fuera' : '',
      ].filter(Boolean).join(' '))
    })
    const sel = seleccionado ? capas.current.get(seleccionado) : null
    sel?.layer.bringToFront()
  }, [datos, cortes, seleccionado, departamento, foco, geo])

  function alTeclear(e: KeyboardEvent<HTMLDivElement>) {
    const dir = TECLAS[e.key]
    if (dir) {
      e.preventDefault()
      const todos = [...capas.current.values()].map((c) => c.centro)
      const base = foco ?? seleccionado
      if (!base) {
        const masAlto = [...datos.values()].sort((a, b) => b.registros - a.registros)[0]
        setFoco(masAlto?.codigo_municipal ?? todos[0]?.id ?? null)
        return
      }
      const actual = capas.current.get(base)?.centro
      const sig = actual ? siguienteEnDireccion(actual, todos, dir) : null
      if (sig) setFoco(sig)
    } else if ((e.key === 'Enter' || e.key === ' ') && foco) {
      e.preventDefault()
      onSeleccionar(foco)
    } else if (e.key === 'Escape') {
      setFoco(null)
      onSeleccionar(null)
    }
  }

  const propsFoco = foco ? geo.features.find((f) => f.properties.c === foco)?.properties : undefined
  const anuncio = propsFoco ? `${propsFoco.n}. ${textoDetalle(datos.get(propsFoco.c), propsFoco.d)}` : ''

  return (
    <div
      className="bio-mapa-caja"
      tabIndex={0}
      role="group"
      aria-label="Mapa de registros por municipio. Usa las flechas para recorrer los municipios, Enter para seleccionar y Escape para quitar la selección."
      onKeyDown={alTeclear}
      onBlur={() => setFoco(null)}
    >
      <div ref={contenedor} className="bio-mapa" aria-hidden="true" />
      <p className="sr-only" aria-live="polite">{anuncio}</p>
    </div>
  )
}
