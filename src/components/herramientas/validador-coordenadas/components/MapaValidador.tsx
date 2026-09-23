import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import type { FilaExcel, FilaResultado, ItemFiltrado, FormatoCoordenadas } from '../types'
import { limpiarCoord, formatearLat, formatearLon, formatearUtm, haversineKm } from '../lib/coordenadas'
import { buscarMunicipio, esDuplicadaPendiente, type MunicipioFeature } from '../lib/validacion'

const COLOR_ESTADO: Record<string, string> = { 'VÁLIDA': '#1BAF7A', 'SOSPECHOSA': '#EDA100', 'INVÁLIDA': '#E34948' }
function colorEstado(estado: string): string { return COLOR_ESTADO[estado] ?? '#888780' }

export interface MapaValidadorHandle {
  focusFila: (idx: number) => void
}

export interface MapaValidadorProps {
  filtrados: ItemFiltrado[]
  rows: FilaExcel[]
  colLat: string
  colLon: string
  formato: FormatoCoordenadas
  features: MunicipioFeature[]
  modoAgregar: boolean
  modoMedir: boolean
  modoMover: boolean
  puntoAMover: number | null
  onSetPuntoAMover: (idx: number | null) => void
  onAgregarPunto: (lat: number, lon: number) => void
  onMoverPunto: (idx: number, lat: number, lon: number) => void
  onEditarPunto: (idx: number, lat: string, lon: string) => void
  onEliminarPunto: (idx: number) => void
  onConfirmarDuplicada: (idx: number) => void
}

// Popups construidos con el DOM API (no dangerouslySetInnerHTML + onclick
// inline) -- CSP del proyecto no permite script-src inline, y Leaflet acepta
// un HTMLElement directo en bindPopup()/openOn().
function fila(texto: string, cls = ''): HTMLElement {
  const div = document.createElement('div')
  if (cls) div.className = cls
  div.textContent = texto
  return div
}
function boton(texto: string, cls: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button')
  b.type = 'button'
  b.textContent = texto
  b.className = cls
  b.addEventListener('click', (e) => { e.stopPropagation(); onClick() })
  return b
}
const BTN_PRIMARIO = 'w-full mt-2 py-1.5 rounded-md border border-[#0F6E56] bg-[#0F6E56] text-white text-xs cursor-pointer'
const BTN_SECUNDARIO = 'flex-1 py-1.5 rounded-md border border-border bg-white text-xs cursor-pointer'
const BTN_PELIGRO = 'flex-1 py-1.5 rounded-md border border-red-400 bg-red-50 text-red-700 text-xs cursor-pointer'

function cajaMunicipio(props: MunicipioFeature['properties'] | null): HTMLElement {
  const caja = document.createElement('div')
  caja.className = props
    ? 'rounded-md px-2.5 py-2 my-2 text-xs bg-[#E1F5EE] text-[#085041]'
    : 'rounded-md px-2.5 py-2 my-2 text-xs bg-[#FCEBEB] text-[#791F1F]'
  caja.textContent = props ? `📍 ${props.MPIO_CNMBRE}, ${props.DPTO_CNMBRE}` : '🚫 Fuera de los 93 municipios del Chocó Biogeográfico'
  return caja
}

/** El puente imperativo entre React-Leaflet y el resto de la lógica del
 *  validador: clic en el mapa (agregar/medir/mover), render de marcadores +
 *  cluster, y popups. Vive dentro de <MapContainer> para usar useMap(). */
function ControladorMapa(props: MapaValidadorProps, ref: React.ForwardedRef<MapaValidadorHandle>) {
  const map = useMap()
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null)
  const medirLayerRef = useRef<L.LayerGroup | null>(null)
  const medirPuntosRef = useRef<L.LatLng[]>([])
  const markerByIdxRef = useRef<Record<number, L.CircleMarker>>({})
  const manejarClicMedirRef = useRef<(latlng: L.LatLng) => void>(() => {})
  const propsRef = useRef(props)
  useEffect(() => { propsRef.current = props })

  // ── Init (una sola vez) ──
  useEffect(() => {
    const cluster = L.markerClusterGroup({
      iconCreateFunction: (c) => {
        const hijos = c.getAllChildMarkers() as unknown as { _estado?: string }[]
        const estados = hijos.map((m) => m._estado)
        const peor = estados.includes('INVÁLIDA') ? 'INVÁLIDA' : estados.includes('SOSPECHOSA') ? 'SOSPECHOSA' : estados.includes('VÁLIDA') ? 'VÁLIDA' : ''
        const color = colorEstado(peor)
        const n = c.getChildCount()
        return L.divIcon({
          html: `<div style="background:${color};color:white;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px;border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.15);">${n}</div>`,
          className: '', iconSize: L.point(38, 38),
        })
      },
    })
    map.addLayer(cluster)
    clusterRef.current = cluster
    medirLayerRef.current = L.layerGroup().addTo(map)

    const onMapClick = (e: L.LeafletMouseEvent) => {
      const p = propsRef.current
      if (p.modoMedir) { manejarClicMedir(e.latlng); return }
      if (p.modoMover) {
        if (p.puntoAMover !== null) mostrarConfirmarMover(p.puntoAMover, e.latlng)
        return
      }
      if (!p.modoAgregar) return
      const lat = +e.latlng.lat.toFixed(6), lon = +e.latlng.lng.toFixed(6)
      const html = document.createElement('div')
      html.className = 'text-xs min-w-[190px]'
      const b = document.createElement('b'); b.textContent = 'Nuevo punto'; html.appendChild(b)
      html.appendChild(fila(`Lat: ${lat}`))
      html.appendChild(fila(`Lon: ${lon}`))
      html.appendChild(cajaMunicipio(buscarMunicipio(lat, lon, p.features)))
      html.appendChild(boton('Agregar este punto', BTN_PRIMARIO, () => { map.closePopup(); p.onAgregarPunto(lat, lon) }))
      L.popup().setLatLng(e.latlng).setContent(html).openOn(map)
    }
    map.on('click', onMapClick)

    manejarClicMedirRef.current = manejarClicMedir
    function manejarClicMedir(latlng: L.LatLng) {
      const medirLayer = medirLayerRef.current!
      medirPuntosRef.current.push(latlng)
      if (medirPuntosRef.current.length === 1) {
        medirLayer.clearLayers()
        L.circleMarker(latlng, { radius: 5, color: '#0F6E56', fillColor: '#0F6E56', fillOpacity: 1, weight: 1 }).addTo(medirLayer)
      } else {
        const [p1, p2] = medirPuntosRef.current
        L.circleMarker(p2, { radius: 5, color: '#0F6E56', fillColor: '#0F6E56', fillOpacity: 1, weight: 1 }).addTo(medirLayer)
        L.polyline([p1, p2], { color: '#0F6E56', weight: 2, dashArray: '6,4' }).addTo(medirLayer)
        const distKm = haversineKm(p1.lat, p1.lng, p2.lat, p2.lng) ?? 0
        const mid = L.latLng((p1.lat + p2.lat) / 2, (p1.lng + p2.lng) / 2)
        const texto = distKm < 1 ? `${(distKm * 1000).toFixed(0)} m` : `${distKm.toFixed(3)} km`
        const propsA = buscarMunicipio(p1.lat, p1.lng, propsRef.current.features)
        const propsB = buscarMunicipio(p2.lat, p2.lng, propsRef.current.features)
        const lineaA = propsA ? `${propsA.MPIO_CNMBRE}, ${propsA.DPTO_CNMBRE}` : 'fuera de los 93 municipios'
        const lineaB = propsB ? `${propsB.MPIO_CNMBRE}, ${propsB.DPTO_CNMBRE}` : 'fuera de los 93 municipios'
        const html = document.createElement('div')
        html.className = 'text-xs min-w-[200px]'
        const b = document.createElement('b'); b.textContent = 'Distancia entre los dos puntos'; html.appendChild(b)
        const grande = document.createElement('div'); grande.className = 'text-lg font-bold my-1'; grande.textContent = texto; html.appendChild(grande)
        html.appendChild(fila(`🟢 Punto A: ${lineaA}`))
        html.appendChild(fila(`🟢 Punto B: ${lineaB}`))
        html.appendChild(boton('Medir de nuevo', BTN_PRIMARIO, () => { medirLayer.clearLayers(); medirPuntosRef.current = []; map.closePopup() }))
        L.popup().setLatLng(mid).setContent(html).openOn(map)
        medirPuntosRef.current = []
      }
    }

    function mostrarConfirmarMover(idx: number, latlng: L.LatLng) {
      const lat = +latlng.lat.toFixed(6), lon = +latlng.lng.toFixed(6)
      const html = document.createElement('div')
      html.className = 'text-xs min-w-[190px]'
      const b = document.createElement('b'); b.textContent = 'Confirmar movimiento'; html.appendChild(b)
      html.appendChild(fila(`Nueva lat: ${lat}`))
      html.appendChild(fila(`Nueva lon: ${lon}`))
      html.appendChild(cajaMunicipio(buscarMunicipio(lat, lon, propsRef.current.features)))
      const row = document.createElement('div'); row.className = 'flex gap-1.5 mt-2'
      row.appendChild(boton('Cancelar', BTN_SECUNDARIO, () => map.closePopup()))
      row.appendChild(boton('Confirmar', BTN_SECUNDARIO.replace('bg-white', 'bg-[#0F6E56] text-white'), () => {
        map.closePopup()
        propsRef.current.onMoverPunto(idx, lat, lon)
      }))
      html.appendChild(row)
      L.popup().setLatLng(latlng).setContent(html).openOn(map)
    }

    return () => { map.off('click', onMapClick); map.removeLayer(cluster); medirLayerRef.current?.clearLayers() }
    // Init una sola vez -- el estado vivo del resto de props se lee de propsRef.current, no hace falta listarlas.
  }, [map])

  // ── Re-render de marcadores cuando cambian los datos filtrados/formato ──
  useEffect(() => {
    const cluster = clusterRef.current
    if (!cluster) return
    cluster.clearLayers()
    const byIdx: Record<number, L.CircleMarker> = {}

    for (const item of props.filtrados) {
      const row = props.rows[item.idx], r = item.r
      const lat = limpiarCoord(row[props.colLat]), lon = limpiarCoord(row[props.colLon])
      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) continue

      const seleccionado = props.modoMover && item.idx === props.puntoAMover
      const marker = L.circleMarker([lat, lon], {
        radius: seleccionado ? 9 : 6,
        color: seleccionado ? '#2C2C2A' : colorEstado(r.estado),
        fillColor: colorEstado(r.estado), fillOpacity: 0.85, weight: seleccionado ? 3 : 1,
      }) as L.CircleMarker & { _estado?: string }
      marker._estado = r.estado
      marker.bindPopup(() => construirPopupPunto(item.idx, row, r, lat, lon))
      marker.on('click', (ev) => {
        if (props.modoMedir) { L.DomEvent.stopPropagation(ev); marker.closePopup(); manejarClicMedirRef.current(marker.getLatLng()); return }
        if (props.modoMover) {
          L.DomEvent.stopPropagation(ev); marker.closePopup()
          props.onSetPuntoAMover(item.idx)
          return
        }
      })
      cluster.addLayer(marker)
      byIdx[item.idx] = marker
    }
    markerByIdxRef.current = byIdx

    function construirPopupPunto(idx: number, row: FilaExcel, r: FilaResultado, lat: number, lon: number): HTMLElement {
      const html = document.createElement('div')
      html.className = 'text-xs min-w-[170px]'
      const b = document.createElement('b'); b.textContent = r.estado || 'SIN VALIDAR'; html.appendChild(b)
      html.appendChild(document.createElement('br'))
      if (r.filaExcel) html.appendChild(fila(`Fila Excel: ${r.filaExcel}`))
      else if (r.manual) html.appendChild(fila('📍 Agregada manualmente', 'text-[#185FA5]'))
      if (r.movido) html.appendChild(fila(`⚠ Movida manualmente (original: ${r.latOriginalAntesDeMover}, ${r.lonOriginalAntesDeMover})`, 'text-gold-600'))
      html.appendChild(fila(`Lat/Lon: ${props.formato === 'utm' ? formatearUtm(lat, lon) : `${formatearLat(lat, props.formato)}, ${formatearLon(lon, props.formato)}`}`))
      if (r.muniDet) html.appendChild(fila(`Detectado: ${r.muniDet}, ${r.depDet}`))
      if (r.tipoError) html.appendChild(fila(`Error: ${r.tipoError}`))
      if (r.distCentroideKm != null) html.appendChild(fila(`Dist. al centro del municipio: ${r.distCentroideKm.toFixed(2)} km`))
      if (r.observacion) html.appendChild(fila(r.observacion, 'italic'))
      if (esDuplicadaPendiente(r)) {
        html.appendChild(boton('✔ Confirmar como válida', BTN_PRIMARIO.replace('bg-[#0F6E56] text-white', 'bg-white text-[#0F6E56]'), () => { map.closePopup(); props.onConfirmarDuplicada(idx) }))
      }
      if (r.manual) {
        const row2 = document.createElement('div'); row2.className = 'flex gap-1.5 mt-2'
        row2.appendChild(boton('✏️ Editar', BTN_SECUNDARIO, () => {
          map.closePopup()
          const html2 = document.createElement('div'); html2.className = 'text-xs min-w-[180px]'
          const b2 = document.createElement('b'); b2.textContent = 'Editar punto'; html2.appendChild(b2)
          const inLat = document.createElement('input'); inLat.value = String(row[props.colLat] ?? ''); inLat.className = 'w-full mt-1.5 px-1.5 py-1 text-xs border border-border rounded'
          const inLon = document.createElement('input'); inLon.value = String(row[props.colLon] ?? ''); inLon.className = 'w-full mt-1.5 px-1.5 py-1 text-xs border border-border rounded'
          html2.appendChild(document.createElement('br')); html2.appendChild(inLat)
          html2.appendChild(document.createElement('br')); html2.appendChild(inLon)
          html2.appendChild(boton('Guardar cambios', BTN_PRIMARIO, () => { map.closePopup(); props.onEditarPunto(idx, inLat.value, inLon.value) }))
          L.popup().setLatLng([lat, lon]).setContent(html2).openOn(map)
        }))
        row2.appendChild(boton('🗑️ Eliminar', BTN_PELIGRO, () => {
          if (!confirm('¿Eliminar este punto agregado manualmente?')) return
          map.closePopup(); props.onEliminarPunto(idx)
        }))
        html.appendChild(row2)
      }
      return html
    }
    // rows/colLat/colLon/los callbacks cambian siempre junto con `filtrados` (mismo ciclo de
    // actualización en el orquestador), así que no hace falta listarlos aparte -- lo importante es
    // no incluir `props` completo (nueva referencia en cada render del padre), que forzaría
    // reconstruir todos los marcadores en cada render sin que los datos realmente hayan cambiado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.filtrados, props.formato, props.modoMover, props.puntoAMover, map])

  useImperativeHandle(ref, () => ({
    focusFila: (idx: number) => {
      const row = props.rows[idx]
      const lat = limpiarCoord(row[props.colLat]), lon = limpiarCoord(row[props.colLon])
      if (isNaN(lat) || isNaN(lon)) return
      map.setView([lat, lon], 14)
      markerByIdxRef.current[idx]?.openPopup()
    },
  }), [map, props.rows, props.colLat, props.colLon])

  // Cambia el cursor según el modo activo -- misma señal visual que el original.
  useEffect(() => {
    const activo = props.modoAgregar || props.modoMedir || props.modoMover
    map.getContainer().style.cursor = activo ? 'crosshair' : ''
  }, [map, props.modoAgregar, props.modoMedir, props.modoMover])

  return null
}
const ControladorMapaForwardRef = forwardRef(ControladorMapa)

const MapaValidador = forwardRef<MapaValidadorHandle, MapaValidadorProps>((props, ref) => (
  <div id="map" className="h-[440px] rounded-lg overflow-hidden">
    <MapContainer center={[4.5, -76.5]} zoom={6} className="h-full w-full">
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri" maxZoom={19}
      />
      <ControladorMapaForwardRef {...props} ref={ref} />
    </MapContainer>
  </div>
))
MapaValidador.displayName = 'MapaValidador'
export default MapaValidador
