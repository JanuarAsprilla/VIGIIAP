import L from 'leaflet'
import type { GeoMunicipios } from './geoMunicipios'

const ID_FILTRO = 'bio-filtro-borde'
const NS = 'http://www.w3.org/2000/svg'

/** Filtro SVG que cierra los huecos entre municipios del mismo departamento y dibuja solo el contorno
 *  de la unión: así el borde departamental sale de los mismos polígonos, sin geometría adicional. */
function asegurarFiltro(raiz: HTMLElement): SVGSVGElement {
  const previo = raiz.querySelector<SVGSVGElement>(`svg[data-bio-defs]`)
  if (previo) return previo
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('data-bio-defs', '')
  svg.setAttribute('width', '0')
  svg.setAttribute('height', '0')
  svg.setAttribute('aria-hidden', 'true')
  svg.style.position = 'absolute'
  const defs = document.createElementNS(NS, 'defs')
  const f = document.createElementNS(NS, 'filter')
  f.setAttribute('id', ID_FILTRO)
  f.setAttribute('x', '-5%'); f.setAttribute('y', '-5%'); f.setAttribute('width', '110%'); f.setAttribute('height', '110%')
  f.setAttribute('color-interpolation-filters', 'sRGB')
  const pasos: [string, Record<string, string>][] = [
    ['feMorphology', { in: 'SourceAlpha', operator: 'dilate', radius: '1.8', result: 'a' }],
    ['feMorphology', { in: 'a', operator: 'erode', radius: '1.8', result: 'cerrado' }],
    ['feMorphology', { in: 'cerrado', operator: 'dilate', radius: '1.4', result: 'ext' }],
    ['feComposite', { in: 'ext', in2: 'cerrado', operator: 'out', result: 'anillo' }],
    ['feFlood', { result: 'tinta', style: 'flood-color: var(--bio-borde-depto); flood-opacity: 1' }],
    ['feComposite', { in: 'tinta', in2: 'anillo', operator: 'in' }],
  ]
  for (const [nombre, attrs] of pasos) {
    const el = document.createElementNS(NS, nombre)
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
    f.appendChild(el)
  }
  defs.appendChild(f)
  svg.appendChild(defs)
  raiz.appendChild(svg)
  return svg
}

/** Dibuja el contorno de cada departamento por encima del relleno. Devuelve la función de limpieza. */
export function dibujarBordesDepartamento(mapa: L.Map, geo: GeoMunicipios, raiz: HTMLElement): () => void {
  const capas: L.Layer[] = []
  const renderers: L.Renderer[] = []
  let aplicar: () => void = () => undefined
  try {
    asegurarFiltro(raiz)
    if (!mapa.getPane('deptos')) {
      const pane = mapa.createPane('deptos')
      pane.style.zIndex = '430'
      pane.style.pointerEvents = 'none'
    }
    const porDepto = new Map<string, typeof geo.features>()
    for (const f of geo.features) porDepto.set(f.properties.d, [...(porDepto.get(f.properties.d) ?? []), f])
    for (const features of porDepto.values()) {
      const renderer = L.svg({ pane: 'deptos', padding: 0.5 })
      const opciones: L.GeoJSONOptions & { renderer: L.Renderer } = {
        renderer, interactive: false, style: () => ({ stroke: false, fill: true, fillColor: '#000', fillOpacity: 1 }),
      }
      const capa = L.geoJSON({ type: 'FeatureCollection', features } as GeoMunicipios, opciones).addTo(mapa)
      renderers.push(renderer)
      capas.push(capa)
    }
    // El renderizador crea su <g> solo cuando el mapa ya tiene vista: se aplica al cargar y tras cada movimiento.
    aplicar = () => {
      for (const r of renderers) {
        const grupo = (r as unknown as { _container?: SVGSVGElement })._container?.querySelector('g')
        if (grupo && !grupo.style.filter) grupo.style.filter = `url(#${ID_FILTRO})`
      }
    }
    mapa.on('layeradd moveend zoomend viewreset', aplicar)
    mapa.whenReady(aplicar)
  } catch {
    // El contorno es un refuerzo visual: si el navegador no soporta el filtro, queda el trazo municipal.
  }
  return () => {
    mapa.off('layeradd moveend zoomend viewreset', aplicar)
    capas.forEach((c) => c.remove())
    raiz.querySelector('svg[data-bio-defs]')?.remove()
  }
}
