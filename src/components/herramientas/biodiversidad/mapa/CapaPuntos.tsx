import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import { useBiodiversidadPuntos } from '@/hooks/useBiodiversidad'
import { useDebounced } from '@/hooks/useDebounced'
import { bboxATexto, puntosDibujables, redondearBbox, type Bbox } from '../lib/puntos'
import type { Grupo, ParamsApi, PuntoMapa } from '../types'
import { INFO_INICIAL, type Enfoque, type InfoPuntos } from './tiposPuntos'

interface Props {
  mapa: L.Map
  grupo: Grupo
  /** Filtros de `/puntos` (sin recuadro). */
  params: ParamsApi
  enfoque: Enfoque | null
  onAbrir: (id: string, origen: HTMLElement) => void
  onInfo: (info: InfoPuntos) => void
}

const ESPERA_MOVIMIENTO_MS = 450
const ZOOM_ENFOQUE = 11

function leerRecuadro(mapa: L.Map): Bbox {
  const b = mapa.getBounds()
  return redondearBbox(b.getWest(), b.getSouth(), b.getEast(), b.getNorth())
}

/** Popup construido con nodos de texto: el nombre de la especie viene de la API y nunca se interpreta como HTML. */
function crearPopup(p: PuntoMapa, abrir: (el: HTMLElement) => void): HTMLElement {
  const raiz = document.createElement('div')
  raiz.className = 'bio-popup'
  const nombre = document.createElement('strong')
  nombre.textContent = p.e ?? 'Sin especie determinada'
  if (p.e) nombre.className = 'italic'
  const boton = document.createElement('button')
  boton.type = 'button'
  boton.className = 'bio-boton bio-boton-chico'
  boton.textContent = 'Ver detalle'
  boton.addEventListener('click', () => abrir(boton))
  raiz.append(nombre, boton)
  return raiz
}

function iconoCluster(c: L.MarkerCluster): L.DivIcon {
  const n = c.getChildCount()
  return L.divIcon({ html: `<span>${n}</span>`, className: 'bio-cluster', iconSize: [36, 36] })
}

/** Capa de puntos de registros sobre el mapa: pide `/puntos` por el recuadro visible y agrupa los marcadores. */
export default function CapaPuntos({ mapa, grupo, params, enfoque, onAbrir, onInfo }: Props) {
  const [recuadro, setRecuadro] = useState<Bbox>(() => leerRecuadro(mapa))
  const estable = useDebounced(recuadro, ESPERA_MOVIMIENTO_MS)
  const consulta = useBiodiversidadPuntos(grupo, { ...params, bbox: bboxATexto(estable) }, true)
  const racimo = useRef<L.MarkerClusterGroup | null>(null)
  const foco = useRef<L.CircleMarker | null>(null)
  const alAbrir = useRef(onAbrir)

  useEffect(() => { alAbrir.current = onAbrir }, [onAbrir])

  useEffect(() => {
    const alMover = () => setRecuadro(leerRecuadro(mapa))
    mapa.on('moveend', alMover)
    return () => { mapa.off('moveend', alMover) }
  }, [mapa])

  useEffect(() => {
    if (!mapa.getPane('puntos')) {
      const capa = mapa.createPane('puntos')
      capa.style.zIndex = '480'
    }
    const grupoCapas = L.markerClusterGroup({
      chunkedLoading: true, maxClusterRadius: 48, showCoverageOnHover: false, spiderfyOnMaxZoom: true, iconCreateFunction: iconoCluster,
    })
    mapa.addLayer(grupoCapas)
    racimo.current = grupoCapas
    return () => {
      mapa.removeLayer(grupoCapas)
      racimo.current = null
      foco.current?.remove()
      foco.current = null
    }
  }, [mapa])

  const puntos = useMemo(() => puntosDibujables(consulta.data?.puntos ?? []), [consulta.data])

  useEffect(() => {
    const capas = racimo.current
    if (!capas) return
    capas.clearLayers()
    capas.addLayers(puntos.map((p) => {
      const m = L.circleMarker([p.lat, p.lon], { pane: 'puntos', radius: 6, weight: 1.5, className: 'bio-punto' })
      m.bindPopup(crearPopup(p, (el) => alAbrir.current(p.id, el)), { className: 'bio-popup-caja', closeButton: true })
      return m
    }))
  }, [puntos])

  useEffect(() => {
    foco.current?.remove()
    foco.current = null
    if (!enfoque) return
    mapa.setView([enfoque.lat, enfoque.lon], Math.max(mapa.getZoom(), ZOOM_ENFOQUE), { animate: false })
    foco.current = L.circleMarker([enfoque.lat, enfoque.lon], { pane: 'puntos', radius: 11, weight: 3, interactive: false, className: 'bio-punto-foco' }).addTo(mapa)
  }, [enfoque, mapa])

  const d = consulta.data
  const { refetch } = consulta
  useEffect(() => {
    onInfo(d || consulta.isError
      ? { cargando: consulta.isFetching, error: consulta.error, total: d?.total ?? 0, mostrados: puntos.length, ocultos: d?.ocultos ?? 0, muestreado: d?.muestreado ?? false, listo: Boolean(d), reintentar: () => void refetch() }
      : INFO_INICIAL)
  }, [d, puntos.length, consulta.isFetching, consulta.isError, consulta.error, refetch, onInfo])

  return null
}
