import { useMemo, useRef, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { MUNICIPIOS_CHOCO } from './data/municipiosChoco.generated'
import { TOTAL_MUNICIPIOS_OBJETIVO } from './data/municipiosObjetivo'
import type { FilaExcel, FilaResultado, FiltrosState, FormatoCoordenadas, ItemFiltrado, ResumenMunicipio } from './types'
import { FILTROS_INICIALES } from './types'
import { procesarValidacion, precalcularCentroides, validarUnPunto, detectarDuplicadas, esDuplicadaPendiente, type MunicipioFeature } from './lib/validacion'
import { leerExcelMejorHoja, detectarColumnasNumericas, adivinarColumnasLatLon, exportarResultados } from './lib/excelIO'
import ColumnasModal from './components/ColumnasModal'
import BarraAcciones from './components/BarraAcciones'
import FormatoToggle from './components/FormatoToggle'
import FiltrosPanel from './components/FiltrosPanel'
import KpisResumen from './components/KpisResumen'
import ResumenMunicipios from './components/ResumenMunicipios'
import TablaRegistros from './components/TablaRegistros'
import MapaValidador, { type MapaValidadorHandle } from './components/MapaValidador'

interface Datos {
  rows: FilaExcel[]
  results: FilaResultado[]
  colLat: string
  colLon: string
}

interface PendingHoja {
  nombreHoja: string
  filas: FilaExcel[]
  columnasNumericas: string[]
  latSugerida: string
  lonSugerida: string
}

interface ValidadorCoordenadasProps {
  onToast?: (msg: string) => void
}

/**
 * Validador de coordenadas contra los 93 municipios objetivo del Chocó
 * Biogeográfico -- adaptación de validador_coordenadas_IIAP.html (Eddy
 * Chaverra, IIAP) al panel de Herramientas de VIGIA-IIAP. La lógica de
 * validación (lib/validacion.ts, lib/coordenadas.ts) y los datos (92
 * municipios embebidos, lib/data) son un puerto verbatim de la fuente
 * original -- solo la presentación (componentes, estilos) se adaptó al
 * lenguaje visual del resto de la plataforma.
 */
export default function ValidadorCoordenadas({ onToast }: ValidadorCoordenadasProps) {
  const features = useMemo<MunicipioFeature[]>(() => {
    precalcularCentroides(MUNICIPIOS_CHOCO.features)
    return MUNICIPIOS_CHOCO.features
  }, [])

  const [datos, setDatos] = useState<Datos | null>(null)
  const [pending, setPending] = useState<PendingHoja | null>(null)
  const [formato, setFormato] = useState<FormatoCoordenadas>('dd')
  const [filtros, setFiltros] = useState<FiltrosState>(FILTROS_INICIALES)
  const [modoAgregar, setModoAgregar] = useState(false)
  const [modoMedir, setModoMedir] = useState(false)
  const [modoMover, setModoMover] = useState(false)
  const [puntoAMover, setPuntoAMover] = useState<number | null>(null)
  const [cargando, setCargando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [estadoDatos, setEstadoDatos] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const mapaRef = useRef<MapaValidadorHandle>(null)

  // ── Carga de Excel ──
  const handleArchivoSeleccionado = async (file: File) => {
    setErrorMsg(null)
    setCargando(true)
    setEstadoDatos('Leyendo Excel...')
    try {
      const { nombreHoja, filas } = await leerExcelMejorHoja(file)
      const columnasNumericas = detectarColumnasNumericas(filas)
      if (columnasNumericas.length < 2) {
        setErrorMsg(`No se encontraron al menos 2 columnas numéricas en la hoja "${nombreHoja}" para elegir latitud y longitud.`)
        setEstadoDatos('')
        return
      }
      const { lat, lon } = adivinarColumnasLatLon(columnasNumericas)
      setPending({ nombreHoja, filas, columnasNumericas, latSugerida: lat, lonSugerida: lon })
    } catch (err) {
      setErrorMsg(`No se pudo procesar el Excel: ${(err as Error)?.message ?? 'error desconocido'}`)
      setEstadoDatos('')
    } finally {
      setCargando(false)
    }
  }

  const handleConfirmarColumnas = (colLat: string, colLon: string) => {
    if (!pending) return
    const rows = pending.filas
    const results = procesarValidacion(rows, colLat, colLon, features)
    setDatos({ rows, results, colLat, colLon })
    setEstadoDatos(`Excel cargado (${rows.length.toLocaleString('es-CO')} registros) — lat: ${colLat}, lon: ${colLon}`)
    setPending(null)
    setFiltros(FILTROS_INICIALES)
  }

  // ── Revalida solo la fila tocada (agregar/mover/editar) + duplicadas global,
  //    igual que la herramienta original -- evita recorrer los 92 polígonos
  //    para TODAS las filas en cada interacción del mapa. ──
  function revalidarFila(idx: number, newRows: FilaExcel[], oldResults: FilaResultado[], colLat: string, colLon: string): FilaResultado[] {
    const nueva = validarUnPunto(newRows[idx], colLat, colLon, features)
    const merged = oldResults.map((r, i) => (i === idx
      ? { ...nueva, filaExcel: r.filaExcel, manual: r.manual, movido: r.movido, latOriginalAntesDeMover: r.latOriginalAntesDeMover, lonOriginalAntesDeMover: r.lonOriginalAntesDeMover, confirmadoManual: r.confirmadoManual }
      : { ...r }))
    detectarDuplicadas(newRows, merged, colLat, colLon)
    return merged
  }

  const handleAgregarPunto = (lat: number, lon: number) => {
    setDatos((prev) => {
      const colLat = prev?.colLat ?? 'decimalLatitude'
      const colLon = prev?.colLon ?? 'decimalLongitude'
      const newRow: FilaExcel = { [colLat]: lat, [colLon]: lon }
      const rows = [...(prev?.rows ?? []), newRow]
      const results = [...(prev?.results ?? []), { estado: '' as const, tipoError: '', observacion: '', depDet: '', muniDet: '', codigoDivipola: '', latIntercambiada: false, distCentroideKm: null, manual: true }]
      const idx = rows.length - 1
      const final = revalidarFila(idx, rows, results, colLat, colLon)
      return { rows, results: final, colLat, colLon }
    })
    setEstadoDatos(`Punto agregado manualmente: ${lat}, ${lon}`)
  }

  const handleMoverPunto = (idx: number, lat: number, lon: number) => {
    setDatos((prev) => {
      if (!prev) return prev
      const { rows, results, colLat, colLon } = prev
      const filaAnterior = rows[idx]
      const yaMovido = results[idx].movido
      const nuevaFila: FilaExcel = { ...filaAnterior, [colLat]: lat, [colLon]: lon }
      const newRows = rows.map((r, i) => (i === idx ? nuevaFila : r))
      const resultsConFlag = results.map((r, i) => (i === idx && !yaMovido
        ? { ...r, movido: true, latOriginalAntesDeMover: filaAnterior[colLat], lonOriginalAntesDeMover: filaAnterior[colLon] }
        : r))
      const final = revalidarFila(idx, newRows, resultsConFlag, colLat, colLon)
      return { rows: newRows, results: final, colLat, colLon }
    })
    setPuntoAMover(null)
    setEstadoDatos('Punto movido a la nueva ubicación.')
  }

  const handleEditarPunto = (idx: number, latStr: string, lonStr: string) => {
    setDatos((prev) => {
      if (!prev) return prev
      const { rows, results, colLat, colLon } = prev
      const newRows = rows.map((r, i) => (i === idx ? { ...r, [colLat]: latStr, [colLon]: lonStr } : r))
      const final = revalidarFila(idx, newRows, results, colLat, colLon)
      return { rows: newRows, results: final, colLat, colLon }
    })
    setEstadoDatos('Punto editado')
  }

  const handleEliminarPunto = (idx: number) => {
    setDatos((prev) => {
      if (!prev) return prev
      const rows = prev.rows.filter((_, i) => i !== idx)
      const results = prev.results.filter((_, i) => i !== idx)
      return { ...prev, rows, results }
    })
    setEstadoDatos('Punto eliminado')
  }

  const confirmarDuplicada = (r: FilaResultado): FilaResultado => ({
    ...r, confirmadoManual: true, estado: 'VÁLIDA', tipoError: '',
    observacion: 'Confirmada manualmente: coordenada repetida intencional (varios registros del mismo sitio).',
  })
  const handleConfirmarDuplicada = (idx: number) => {
    setDatos((prev) => {
      if (!prev) return prev
      const results = prev.results.map((r, i) => (i === idx ? confirmarDuplicada(r) : r))
      return { ...prev, results }
    })
  }
  const handleConfirmarTodasDuplicadas = () => {
    setDatos((prev) => {
      if (!prev) return prev
      const results = prev.results.map((r) => (esDuplicadaPendiente(r) ? confirmarDuplicada(r) : r))
      return { ...prev, results }
    })
  }

  // ── Modos del mapa (mutuamente excluyentes) ──
  const toggleAgregar = () => { setModoAgregar((v) => !v); setModoMedir(false); setModoMover(false); setPuntoAMover(null) }
  const toggleMedir = () => { setModoMedir((v) => !v); setModoAgregar(false); setModoMover(false); setPuntoAMover(null) }
  const toggleMover = () => { setModoMover((v) => !v); setModoAgregar(false); setModoMedir(false); setPuntoAMover(null) }

  // ── Filtros + derivados ──
  const filtrados = useMemo<ItemFiltrado[]>(() => {
    if (!datos) return []
    const { results } = datos
    return results
      .map((r, idx) => ({ idx, r }))
      .filter(({ r }) => {
        if (filtros.estado && r.estado !== filtros.estado) return false
        if (filtros.depto && r.depDet !== filtros.depto) return false
        if (filtros.muni && r.muniDet !== filtros.muni) return false
        if (filtros.error && !(r.tipoError || '').includes(filtros.error)) return false
        if (filtros.origen === 'agregado' && !r.manual) return false
        if (filtros.origen === 'movido' && !r.movido) return false
        if (filtros.origen === 'confirmado' && !r.confirmadoManual) return false
        if (filtros.filaDesde != null && (!r.filaExcel || r.filaExcel < filtros.filaDesde)) return false
        if (filtros.filaHasta != null && (!r.filaExcel || r.filaExcel > filtros.filaHasta)) return false
        return true
      })
  }, [datos, filtros])

  const { deptos, munis, errores } = useMemo(() => {
    const deptos = new Set<string>(), munis = new Set<string>(), errores = new Set<string>()
    for (const r of datos?.results ?? []) {
      if (r.depDet) deptos.add(r.depDet)
      if (r.muniDet) munis.add(r.muniDet)
      if (r.tipoError) r.tipoError.split('; ').forEach((e) => errores.add(e))
    }
    return { deptos: Array.from(deptos).sort(), munis: Array.from(munis).sort(), errores: Array.from(errores).sort() }
  }, [datos])

  const resumenMunicipios = useMemo<ResumenMunicipio[]>(() => {
    if (!datos) return []
    const mapa: Record<string, ResumenMunicipio> = {}
    let fueraDeMunicipio = 0
    for (const r of datos.results) {
      if (!r.muniDet) { if (r.estado === 'INVÁLIDA') fueraDeMunicipio++; continue }
      const k = `${r.depDet}|${r.muniDet}`
      mapa[k] ??= { dep: r.depDet, muni: r.muniDet, reg: 0, val: 0, sos: 0, inv: 0 }
      mapa[k].reg++
      if (r.estado === 'VÁLIDA') mapa[k].val++
      else if (r.estado === 'SOSPECHOSA') mapa[k].sos++
      else if (r.estado === 'INVÁLIDA') mapa[k].inv++
    }
    const filas = Object.values(mapa).sort((a, b) => (b.sos + b.inv) - (a.sos + a.inv))
    if (fueraDeMunicipio > 0) filas.push({ dep: '', muni: '(Fuera de los 93 municipios)', reg: fueraDeMunicipio, val: 0, sos: 0, inv: fueraDeMunicipio, especial: true })
    return filas
  }, [datos])

  const kpis = useMemo(() => ({
    total: filtrados.length,
    validas: filtrados.filter((i) => i.r.estado === 'VÁLIDA').length,
    sospechosas: filtrados.filter((i) => i.r.estado === 'SOSPECHOSA').length,
    invalidas: filtrados.filter((i) => i.r.estado === 'INVÁLIDA').length,
  }), [filtrados])

  const hayFiltroActivo = Boolean(filtros.estado || filtros.depto || filtros.muni || filtros.error)

  const handleExportar = async () => {
    if (!datos) return
    setExportando(true)
    try {
      const municipiosEncontrados = new Set(datos.results.filter((r) => r.muniDet).map((r) => r.muniDet)).size
      await exportarResultados(datos.rows, datos.results, datos.colLat, datos.colLon, TOTAL_MUNICIPIOS_OBJETIVO, municipiosEncontrados)
      onToast?.('Excel de resultados descargado')
    } catch (err) {
      onToast?.((err as Error)?.message ?? 'No se pudo exportar el Excel')
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 text-xs text-text-muted bg-bg-alt rounded-lg px-3 py-2.5">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
        <p>Carga tu Excel, elige las columnas de latitud y longitud, y valida cada punto dentro de los límites de los 93 municipios del Chocó Biogeográfico. Los límites incluyen 92 de 93 municipios — falta Belén de Bajirá (Chocó), que aún no tiene límite oficial del IGAC; se registra bajo Riosucio.</p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          {errorMsg}
        </div>
      )}

      <BarraAcciones
        onArchivoSeleccionado={handleArchivoSeleccionado}
        cargando={cargando}
        modoAgregar={modoAgregar} modoMedir={modoMedir} modoMover={modoMover}
        onToggleAgregar={toggleAgregar} onToggleMedir={toggleMedir} onToggleMover={toggleMover}
        onExportar={handleExportar} exportando={exportando} puedeExportar={!!datos && datos.rows.length > 0}
        estadoDatos={estadoDatos}
      />

      {pending && (
        <ColumnasModal
          nombreHoja={pending.nombreHoja} filas={pending.filas} columnasNumericas={pending.columnasNumericas}
          latSugerida={pending.latSugerida} lonSugerida={pending.lonSugerida}
          onCancelar={() => { setPending(null); setEstadoDatos('') }}
          onConfirmar={handleConfirmarColumnas}
        />
      )}

      <FormatoToggle formato={formato} onChange={setFormato} />
      <FiltrosPanel filtros={filtros} deptos={deptos} munis={munis} errores={errores} onChange={(patch) => setFiltros((f) => ({ ...f, ...patch }))} />
      <KpisResumen {...kpis} totalSinFiltrar={datos?.rows.length ?? 0} hayFiltroActivo={hayFiltroActivo} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-3">
          <h3 className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-2 px-1">Mapa de puntos</h3>
          <div className="flex gap-3 flex-wrap text-xs text-text-muted mb-2 px-1">
            <span className="inline-flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-green-500 inline-block" />Válida</span>
            <span className="inline-flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-gold-500 inline-block" />Sospechosa</span>
            <span className="inline-flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-red-500 inline-block" />Inválida</span>
            <span className="inline-flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-text-muted inline-block" />Sin coordenadas</span>
          </div>
          <MapaValidador
            ref={mapaRef}
            filtrados={filtrados} rows={datos?.rows ?? []} colLat={datos?.colLat ?? ''} colLon={datos?.colLon ?? ''}
            formato={formato} features={features}
            modoAgregar={modoAgregar} modoMedir={modoMedir} modoMover={modoMover} puntoAMover={puntoAMover}
            onSetPuntoAMover={setPuntoAMover}
            onAgregarPunto={handleAgregarPunto} onMoverPunto={handleMoverPunto}
            onEditarPunto={handleEditarPunto} onEliminarPunto={handleEliminarPunto}
            onConfirmarDuplicada={handleConfirmarDuplicada}
          />
        </div>
        <ResumenMunicipios filas={resumenMunicipios} />
      </div>

      <TablaRegistros
        filtrados={filtrados} colLat={datos?.colLat ?? ''} colLon={datos?.colLon ?? ''} rows={datos?.rows ?? []}
        formato={formato} filaDesde={filtros.filaDesde} filaHasta={filtros.filaHasta}
        onFilaDesdeChange={(v) => setFiltros((f) => ({ ...f, filaDesde: v }))}
        onFilaHastaChange={(v) => setFiltros((f) => ({ ...f, filaHasta: v }))}
        onFocusFila={(idx) => mapaRef.current?.focusFila(idx)}
        onConfirmarDuplicada={handleConfirmarDuplicada}
        onConfirmarTodasDuplicadas={handleConfirmarTodasDuplicadas}
      />
    </div>
  )
}
