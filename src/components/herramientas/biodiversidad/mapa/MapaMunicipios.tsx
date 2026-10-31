import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Maximize2, Minus, Plus, Target } from 'lucide-react'
import type { MunicipioConteo } from '../types'
import { claseDe } from '../lib/escala'
import { fmtNum, fmtNumONulo, fmtPct } from '../lib/format'
import { valorMetrica, type Metrica } from '../lib/metrica'
import { puntoInterior } from '../lib/geometria'
import { siguienteEnDireccion, type Direccion, type Punto } from '../lib/navegacion'
import { dibujarBordesDepartamento } from './bordesDepartamento'
import type { GeoMunicipios } from './geoMunicipios'

interface Props {
  geo: GeoMunicipios
  datos: Map<string, MunicipioConteo>
  metrica: Metrica
  cortes: number[]
  seleccionado: string | null
  departamento: string | null
  onSeleccionar: (codigo: string | null) => void
  /** Entrega la instancia del mapa a capas externas (puntos); null al desmontar. */
  onMapa?: (mapa: L.Map | null) => void
}

interface Tooltip {
  raiz: HTMLElement
  nombre: HTMLElement
  depto: HTMLElement
  filas: Record<Metrica, { fila: HTMLElement; valor: HTMLElement }>
}

interface Capa {
  layer: L.Path
  tooltip: Tooltip
  depto: string
  nombre: string
  centro: Punto
}

const TECLAS: Record<string, Direccion> = {
  ArrowLeft: 'izquierda', ArrowRight: 'derecha', ArrowUp: 'arriba', ArrowDown: 'abajo',
}
const ROTULOS: Record<Metrica, string> = { registros: 'Registros', especies: 'Especies', sin_especie: 'Sin especie' }
const MARGEN_AJUSTE: L.PointExpression = [10, 10]

function elemento(tag: string, clase?: string): HTMLElement {
  const el = document.createElement(tag)
  if (clase) el.className = clase
  return el
}

function crearTooltip(): Tooltip {
  const raiz = elemento('div', 'bio-tip')
  const nombre = elemento('strong')
  const depto = elemento('span', 'bio-tip-depto')
  const lista = elemento('div', 'bio-tip-filas')
  const filas = {} as Tooltip['filas']
  for (const m of Object.keys(ROTULOS) as Metrica[]) {
    const fila = elemento('span', 'bio-tip-fila')
    const etiqueta = elemento('span')
    etiqueta.textContent = ROTULOS[m]
    const valor = elemento('b')
    fila.append(etiqueta, valor)
    lista.append(fila)
    filas[m] = { fila, valor }
  }
  raiz.append(nombre, depto, lista)
  return { raiz, nombre, depto, filas }
}

function actualizarTooltip(t: Tooltip, nombre: string, depto: string, m: MunicipioConteo | undefined, metrica: Metrica) {
  t.nombre.textContent = nombre
  t.depto.textContent = depto
  const con = m && m.registros > 0
  t.filas.registros.valor.textContent = con ? fmtNum(m.registros) : 'Sin registros'
  t.filas.especies.valor.textContent = con ? fmtNumONulo(m.especies) : '—'
  t.filas.sin_especie.valor.textContent = con ? fmtPct(m.sin_especie, m.registros) : '—'
  for (const k of Object.keys(t.filas) as Metrica[]) t.filas[k].fila.classList.toggle('bio-tip-activa', k === metrica)
}

function textoDetalle(m: MunicipioConteo | undefined, depto: string): string {
  if (!m || m.registros <= 0) return `${depto} · Sin registros`
  return `${depto} · ${fmtNum(m.registros)} registros · ${fmtNumONulo(m.especies)} especies`
}

function centroEtiqueta(feature: GeoMunicipios['features'][number], capa: L.Polygon): L.LatLng {
  const g = feature.geometry
  const punto = puntoInterior(g.type, g.coordinates)
  return punto ? L.latLng(punto[1], punto[0]) : capa.getBounds().getCenter()
}

function prefiereMovimientoReducido(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

/** Mapa coroplético sin mapa base externo: solo la capa GeoJSON propia. El color lo pone el CSS
 *  (clases bio-c0..bio-c5) para que el cambio de tema no requiera repintar en JS. */
export default function MapaMunicipios({ geo, datos, metrica, cortes, seleccionado, departamento, onSeleccionar, onMapa }: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const mapaRef = useRef<L.Map | null>(null)
  const capas = useRef(new Map<string, Capa>())
  const limites = useRef<L.LatLngBounds | null>(null)
  const vigente = useRef({ seleccionado, departamento })
  const alSeleccionar = useRef(onSeleccionar)
  const adornos = useRef<L.Layer[]>([])
  const [foco, setFoco] = useState<string | null>(null)
  const [pista, setPista] = useState(false)
  const temporizador = useRef<number | undefined>(undefined)

  const alMapa = useRef(onMapa)

  useEffect(() => { alSeleccionar.current = onSeleccionar }, [onSeleccionar])
  useEffect(() => { alMapa.current = onMapa }, [onMapa])
  useEffect(() => { vigente.current = { seleccionado, departamento } }, [seleccionado, departamento])

  const encuadrar = useCallback((animar: boolean) => {
    const mapa = mapaRef.current
    if (!mapa || !limites.current) return
    const { seleccionado: sel, departamento: dep } = vigente.current
    let destino = limites.current
    if (sel) {
      const capa = capas.current.get(sel)?.layer as L.Polygon | undefined
      if (capa) destino = capa.getBounds()
    } else if (dep) {
      const grupo = L.latLngBounds([])
      capas.current.forEach((c) => { if (c.depto === dep) grupo.extend((c.layer as L.Polygon).getBounds()) })
      if (grupo.isValid()) destino = grupo
    }
    mapa.fitBounds(destino, { padding: MARGEN_AJUSTE, animate: animar && !prefiereMovimientoReducido(), maxZoom: sel ? 10 : 12 })
  }, [])

  useEffect(() => {
    const el = contenedor.current
    if (!el) return
    const movil = L.Browser.mobile
    const mapa = L.map(el, {
      zoomControl: false, attributionControl: false, dragging: !movil, touchZoom: true, doubleClickZoom: true,
      scrollWheelZoom: false, boxZoom: false, keyboard: false, zoomSnap: 0.25, zoomDelta: 0.5, minZoom: 3, maxZoom: 13,
    })
    mapaRef.current = mapa
    alMapa.current?.(mapa)
    const registro = capas.current
    const capa = L.geoJSON(geo, {
      style: () => ({ className: 'bio-m bio-c0', weight: 0.8, fill: true, fillOpacity: 1 }),
      onEachFeature: (f, layer) => {
        const { c, n, d } = f.properties
        const t = crearTooltip()
        layer.bindTooltip(t.raiz, { sticky: true, direction: 'top', offset: [0, -6], className: 'bio-tooltip', opacity: 1 })
        layer.on('click', () => alSeleccionar.current(c))
        const b = (layer as L.Polygon).getBounds().getCenter()
        registro.set(c, { layer: layer as L.Path, tooltip: t, depto: d, nombre: n, centro: { id: c, x: b.lng, y: b.lat } })
      },
    }).addTo(mapa)
    limites.current = capa.getBounds()
    const quitarBordes = dibujarBordesDepartamento(mapa, geo, el)
    const pane = mapa.createPane('seleccion')
    pane.style.zIndex = '460'
    pane.style.pointerEvents = 'none'

    // La rueda solo acerca con Ctrl/⌘: sin ellas la página sigue desplazándose.
    const alRueda = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        mapa.setZoom(mapa.getZoom() - Math.sign(e.deltaY) * 0.5, { animate: false })
      } else {
        setPista(true)
        window.clearTimeout(temporizador.current)
        temporizador.current = window.setTimeout(() => setPista(false), 1800)
      }
    }
    el.addEventListener('wheel', alRueda, { passive: false })

    const ajustar = () => { mapa.invalidateSize(); encuadrar(false) }
    ajustar()
    const ro = new ResizeObserver(ajustar)
    ro.observe(el)
    return () => {
      ro.disconnect()
      el.removeEventListener('wheel', alRueda)
      window.clearTimeout(temporizador.current)
      quitarBordes()
      adornos.current = []
      alMapa.current?.(null)
      mapa.remove()
      mapaRef.current = null
      registro.clear()
    }
  }, [geo, encuadrar])

  // Color, atenuación y tooltip de cada municipio.
  useEffect(() => {
    const hayFoco = Boolean(seleccionado || departamento)
    capas.current.forEach((capa, codigo) => {
      const m = datos.get(codigo)
      const clase = claseDe(valorMetrica(m, metrica), cortes)
      const el = capa.layer.getElement() as SVGPathElement | null
      actualizarTooltip(capa.tooltip, capa.nombre, capa.depto, m, metrica)
      if (!el) return
      const dentro = seleccionado ? codigo === seleccionado : departamento ? capa.depto === departamento : true
      el.setAttribute('class', [
        'leaflet-interactive', 'bio-m', `bio-c${clase}`,
        hayFoco && !dentro ? 'bio-fuera' : '',
        codigo === foco ? 'bio-foco' : '',
      ].filter(Boolean).join(' '))
    })
  }, [datos, metrica, cortes, seleccionado, departamento, foco, geo])

  // Contorno triple neutro (luz, sombra, luz) y etiqueta del municipio seleccionado; encuadre sobre la selección.
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa) return
    adornos.current.forEach((l) => l.remove())
    adornos.current = []
    const sel = seleccionado ? capas.current.get(seleccionado) : null
    const feature = seleccionado ? geo.features.find((f) => f.properties.c === seleccionado) : null
    if (sel && feature) {
      const dibujar = (clase: string, weight: number) =>
        L.geoJSON(feature, { pane: 'seleccion', interactive: false, style: () => ({ className: clase, weight, fill: false }) }).addTo(mapa)
      const etiqueta = elemento('span')
      etiqueta.textContent = sel.nombre
      const tip = L.tooltip({ permanent: true, direction: 'center', className: 'bio-etiqueta', pane: 'seleccion', interactive: false, opacity: 1 })
        .setContent(etiqueta).setLatLng(centroEtiqueta(feature, sel.layer as L.Polygon)).addTo(mapa)
      adornos.current = [dibujar('bio-halo', 8), dibujar('bio-sel', 3), tip]
    }
    encuadrar(true)
  }, [seleccionado, departamento, geo, encuadrar])

  function alTeclear(e: KeyboardEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return
    if (e.key === '+' || e.key === '=') { mapaRef.current?.zoomIn(0.5); return }
    if (e.key === '-') { mapaRef.current?.zoomOut(0.5); return }
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
      aria-label="Mapa de municipios. Usa las flechas para recorrer los municipios, Enter para seleccionar, más y menos para acercar y Escape para quitar la selección."
      onKeyDown={alTeclear}
      onBlur={() => setFoco(null)}
    >
      <div ref={contenedor} className="bio-mapa" aria-hidden="true" />
      <div className="bio-controles" role="group" aria-label="Controles del mapa">
        <button type="button" className="bio-ctl" aria-label="Acercar" onClick={() => mapaRef.current?.zoomIn(0.5)}><Plus className="w-4 h-4" aria-hidden="true" /></button>
        <button type="button" className="bio-ctl" aria-label="Alejar" onClick={() => mapaRef.current?.zoomOut(0.5)}><Minus className="w-4 h-4" aria-hidden="true" /></button>
        <button type="button" className="bio-ctl" aria-label="Restablecer la vista completa" onClick={() => { if (mapaRef.current && limites.current) mapaRef.current.fitBounds(limites.current, { padding: MARGEN_AJUSTE, animate: !prefiereMovimientoReducido() }) }}>
          <Maximize2 className="w-4 h-4" aria-hidden="true" />
        </button>
        {(seleccionado || departamento) && (
          <button type="button" className="bio-ctl" aria-label="Centrar en la selección" onClick={() => encuadrar(true)}><Target className="w-4 h-4" aria-hidden="true" /></button>
        )}
      </div>
      <p className={`bio-pista ${pista ? 'bio-pista-visible' : ''}`} aria-hidden="true">
        Mantén Ctrl (⌘ en Mac) y gira la rueda para acercar
      </p>
      <p className="sr-only" aria-live="polite">{anuncio}</p>
    </div>
  )
}
