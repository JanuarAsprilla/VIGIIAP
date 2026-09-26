import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftRight, Download, Copy } from 'lucide-react'
import ToolCard from './ToolCard'
import {
  wgs84ToMagna, magnaToWgs84, ZONAS_MAGNA, type ZonaMagna,
  wgs84ToUtm18N, utm18NToWgs84,
  dmsToDecimal, decimalToDms,
} from '@/lib/proyeccionMagna'

type Formato = 'decimal' | 'dms' | `magna:${ZonaMagna}` | 'utm18n'

interface DefinicionFormato {
  label: string
  labelCorto: string
  /** Nombres de columna para el par de valores en este formato. */
  columnas: [string, string]
  /** true si los valores de este formato son texto (DMS), no números planos. */
  esTexto: boolean
}

const FORMATOS: Record<Formato, DefinicionFormato> = {
  decimal:                 { label: 'WGS84 — decimal (lat, lon)',              labelCorto: 'WGS84 decimal',       columnas: ['Latitud', 'Longitud'], esTexto: false },
  dms:                     { label: 'WGS84 — grados, min, seg (DMS)',          labelCorto: 'WGS84 DMS',           columnas: ['Latitud', 'Longitud'], esTexto: true },
  'magna:oeste':           { label: `${ZONAS_MAGNA.oeste.nombre} (${ZONAS_MAGNA.oeste.epsg})`,             labelCorto: 'Magna Oeste',        columnas: ['X', 'Y'], esTexto: false },
  'magna:bogota':          { label: `${ZONAS_MAGNA.bogota.nombre} (${ZONAS_MAGNA.bogota.epsg})`,           labelCorto: 'Magna Bogotá',       columnas: ['X', 'Y'], esTexto: false },
  'magna:esteCentral':     { label: `${ZONAS_MAGNA.esteCentral.nombre} (${ZONAS_MAGNA.esteCentral.epsg})`, labelCorto: 'Magna Este Central', columnas: ['X', 'Y'], esTexto: false },
  'magna:este':            { label: `${ZONAS_MAGNA.este.nombre} (${ZONAS_MAGNA.este.epsg})`,               labelCorto: 'Magna Este',         columnas: ['X', 'Y'], esTexto: false },
  utm18n:                  { label: 'UTM Zona 18N (EPSG:32618)',               labelCorto: 'UTM 18N',             columnas: ['X', 'Y'], esTexto: false },
}

const ORDEN_FORMATOS: Formato[] = ['decimal', 'dms', 'magna:oeste', 'magna:bogota', 'magna:esteCentral', 'magna:este', 'utm18n']

interface FilaResultado {
  linea: number
  entradaA: string
  entradaB: string
  salidaA?: number | string
  salidaB?: number | string
  error?: string
}

// Los formatos numéricos (decimal, Magna, UTM) se separan por coma, punto y
// coma, tabulador o espacio -- cubre tanto pegar desde Excel/Sheets
// (tabulador) como un CSV simple. DMS se separa SOLO por coma/punto y coma:
// un valor DMS ya trae espacios internos ("4° 29' 16.7\" N"), así que
// partir por espacio rompería el propio valor.
const SEPARADOR_NUMERICO = /[,;\t\s]+/
const SEPARADOR_TEXTO = /[,;]/

// La aritmética de la proyección es trivial (~20 operaciones por línea) --
// 50.000 líneas se procesan en milisegundos, sin riesgo real de congelar la
// pestaña. El tope existe solo para el caso patológico de pegar un archivo
// entero por accidente, no para limitar un uso real (un dataset de
// ocurrencias de un investigador puede tener fácilmente varios miles de
// registros).
const MAX_LINEAS = 50_000

function parseNumero(token: string): number | null {
  const limpio = token.trim()
  if (!/^-?\d+(\.\d+)?$/.test(limpio)) return null
  return parseFloat(limpio)
}

/** Formato de origen → WGS84 decimal (lat, lon). null + mensaje si no se pudo interpretar. */
function aWgs84(a: string, b: string, formato: Formato): { lat: number; lon: number } | { error: string } {
  if (formato === 'dms') {
    const lat = dmsToDecimal(a)
    const lon = dmsToDecimal(b)
    if (lat === null || lon === null) return { error: 'No se pudo interpretar como DMS (ej. 4°29\'16.7"N)' }
    return { lat, lon }
  }
  const numA = parseNumero(a)
  const numB = parseNumero(b)
  if (numA === null || numB === null) return { error: 'Valores no numéricos (usa punto decimal, ej. 4.8213)' }

  if (formato === 'decimal') return { lat: numA, lon: numB }
  if (formato === 'utm18n') return utm18NToWgs84(numA, numB)
  const zona = formato.slice('magna:'.length) as ZonaMagna
  return magnaToWgs84(numA, numB, zona)
}

/** WGS84 decimal → formato de destino, como par de valores listos para mostrar. */
function deWgs84(lat: number, lon: number, formato: Formato): [number | string, number | string] {
  if (formato === 'decimal') return [lat, lon]
  if (formato === 'dms') return [decimalToDms(lat, 'lat'), decimalToDms(lon, 'lon')]
  if (formato === 'utm18n') { const { x, y } = wgs84ToUtm18N(lat, lon); return [x, y] }
  const zona = formato.slice('magna:'.length) as ZonaMagna
  const { x, y } = wgs84ToMagna(lat, lon, zona)
  return [x, y]
}

function convertirLote(texto: string, origen: Formato, destino: Formato): FilaResultado[] {
  const separador = FORMATOS[origen].esTexto ? SEPARADOR_TEXTO : SEPARADOR_NUMERICO
  return texto
    .split('\n')
    .map((linea, i) => ({ linea: i + 1, texto: linea.trim() }))
    .filter((l) => l.texto.length > 0)
    .slice(0, MAX_LINEAS)
    .map(({ linea, texto }) => {
      const partes = texto.split(separador).map((p) => p.trim()).filter(Boolean)
      if (partes.length !== 2) {
        return { linea, entradaA: texto, entradaB: '', error: 'Se esperaban 2 valores por línea' }
      }
      const [a, b] = partes
      const wgs84 = aWgs84(a, b, origen)
      if ('error' in wgs84) return { linea, entradaA: a, entradaB: b, error: wgs84.error }

      const [salidaA, salidaB] = deWgs84(wgs84.lat, wgs84.lon, destino)
      return { linea, entradaA: a, entradaB: b, salidaA, salidaB }
    })
}

function formatoSalida(valor: number | string | undefined): string {
  if (valor === undefined) return ''
  if (typeof valor === 'string') return valor
  return valor.toLocaleString('es-CO', { maximumFractionDigits: 6 })
}

function aCSV(filas: FilaResultado[], origen: Formato, destino: Formato): string {
  const [colA, colB] = FORMATOS[origen].columnas
  const [colC, colD] = FORMATOS[destino].columnas
  const encabezados = ['linea', colA, colB, colC, colD, 'error']
  const filasCSV = filas.map((f) => [
    f.linea, f.entradaA, f.entradaB, formatoSalida(f.salidaA), formatoSalida(f.salidaB), f.error ?? '',
  ].join(','))
  return [encabezados.join(','), ...filasCSV].join('\n')
}

export default function ConversorCoordenadas() {
  const [origen, setOrigen]   = useState<Formato>('decimal')
  const [destino, setDestino] = useState<Formato>('magna:oeste')
  const [texto, setTexto]     = useState('4.8213, -76.7324\n5.6947, -76.6614')
  const [resultados, setResultados] = useState<FilaResultado[] | null>(null)
  const [copied, setCopied]   = useState(false)

  const convert = () => setResultados(convertirLote(texto, origen, destino))

  const intercambiar = () => {
    setOrigen(destino)
    setDestino(origen)
    setResultados(null)
  }

  const cambiarOrigen = (f: Formato) => { setOrigen(f); setResultados(null) }
  const cambiarDestino = (f: Formato) => { setDestino(f); setResultados(null) }

  const [colOrigenA, colOrigenB] = FORMATOS[origen].columnas
  const [colDestinoA, colDestinoB] = FORMATOS[destino].columnas
  const ejemplo = FORMATOS[origen].esTexto
    ? `Una coordenada por línea: ${colOrigenA}, ${colOrigenB} (ej. 4°29'16.7"N, 76°43'56.6"W)`
    : `Una coordenada por línea: ${colOrigenA}, ${colOrigenB} (ej. 4.8213, -76.7324)`

  const totalErrores = resultados?.filter((f) => f.error).length ?? 0
  const excedeLimite = texto.split('\n').filter((l) => l.trim()).length > MAX_LINEAS

  const copiarResultados = () => {
    if (!resultados) return
    const textoTabulado = resultados.map((f) => [
      f.entradaA, f.entradaB, formatoSalida(f.salidaA), formatoSalida(f.salidaB), f.error ?? '',
    ].join('\t')).join('\n')
    navigator.clipboard.writeText(textoTabulado).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  const descargarCSV = () => {
    if (!resultados) return
    const blob = new Blob([aCSV(resultados, origen, destino)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `coordenadas-convertidas.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ToolCard tag="Geodésico" title="Conversor de Coordenadas" icon={ArrowLeftRight} color="gold" index={2} tilt3D={false}>
      {/* Selector de formato origen/destino -- cualquier combinación es
          válida, la conversión siempre pasa por WGS84 decimal como formato
          intermedio (ver aWgs84/deWgs84 en este mismo archivo). */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end mb-4">
        <div>
          <label htmlFor="cc-origen" className="block text-[0.6rem] font-bold uppercase tracking-wider text-text-muted mb-1">Convertir de</label>
          <select
            id="cc-origen"
            value={origen}
            onChange={(e) => cambiarOrigen(e.target.value as Formato)}
            className="w-full px-2.5 py-2 bg-[var(--card-bg)] border border-border rounded-lg text-xs font-semibold focus:outline-none focus:border-primary-800 transition"
          >
            {ORDEN_FORMATOS.map((f) => <option key={f} value={f}>{FORMATOS[f].label}</option>)}
          </select>
        </div>
        <button
          type="button"
          onClick={intercambiar}
          title="Intercambiar origen y destino"
          aria-label="Intercambiar origen y destino"
          className="mb-0.5 p-2 rounded-lg bg-bg-alt text-text-muted hover:text-primary-800 hover:bg-primary-500/10 transition-colors"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>
        <div>
          <label htmlFor="cc-destino" className="block text-[0.6rem] font-bold uppercase tracking-wider text-text-muted mb-1">A</label>
          <select
            id="cc-destino"
            value={destino}
            onChange={(e) => cambiarDestino(e.target.value as Formato)}
            className="w-full px-2.5 py-2 bg-[var(--card-bg)] border border-border rounded-lg text-xs font-semibold focus:outline-none focus:border-primary-800 transition"
          >
            {ORDEN_FORMATOS.map((f) => <option key={f} value={f}>{FORMATOS[f].label}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="cc-lote" className="block text-[0.6rem] font-bold uppercase tracking-wider text-text-muted mb-1">
            Coordenadas a convertir
          </label>
          <textarea
            id="cc-lote"
            rows={5}
            value={texto}
            onChange={(e) => { setTexto(e.target.value); setResultados(null) }}
            placeholder={ejemplo}
            className="w-full px-3 py-2 bg-[var(--card-bg)] border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition resize-y"
          />
          <p className="text-[0.6rem] text-text-muted mt-1">{ejemplo} — pega tantas líneas como necesites (máx. {MAX_LINEAS.toLocaleString('es-CO')}).</p>
        </div>

        <button
          onClick={convert}
          disabled={!texto.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeftRight className="w-4 h-4" />
          Convertir {texto.split('\n').filter((l) => l.trim()).length > 1 ? 'todas' : ''}
        </button>

        {excedeLimite && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium">
            <span aria-hidden="true">⚠</span>
            Solo se procesarán las primeras {MAX_LINEAS.toLocaleString('es-CO')} líneas.
          </div>
        )}

        {resultados && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-border rounded-lg overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-2 bg-bg-alt border-b border-border">
              <span className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted">
                {resultados.length} resultado{resultados.length === 1 ? '' : 's'}
                {totalErrores > 0 && ` · ${totalErrores} con error`}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={copiarResultados} title="Copiar (pegar en Excel)"
                  className="flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-wider text-primary-700 hover:text-primary-900 transition-colors">
                  <Copy className="w-3 h-3" /> {copied ? '✓ Copiado' : 'Copiar'}
                </button>
                <button onClick={descargarCSV} title="Descargar como CSV"
                  className="flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-wider text-primary-700 hover:text-primary-900 transition-colors">
                  <Download className="w-3 h-3" /> CSV
                </button>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-xs font-mono">
                <thead className="sticky top-0 bg-[var(--card-bg)]">
                  <tr className="text-[0.6rem] text-text-muted uppercase tracking-wider">
                    <th className="text-left px-3 py-1.5 font-bold">#</th>
                    <th className="text-left px-3 py-1.5 font-bold">{colOrigenA}, {colOrigenB}</th>
                    <th className="text-left px-3 py-1.5 font-bold">{colDestinoA}, {colDestinoB}</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map((f) => (
                    <tr key={f.linea} className={`border-t border-border/60 ${f.error ? 'bg-red-50' : ''}`}>
                      <td className="px-3 py-1.5 text-text-muted">{f.linea}</td>
                      <td className="px-3 py-1.5 text-text">{f.entradaA}, {f.entradaB}</td>
                      <td className="px-3 py-1.5">
                        {f.error
                          ? <span className="text-red-600">{f.error}</span>
                          : <span className="text-primary-900">{formatoSalida(f.salidaA)}, {formatoSalida(f.salidaB)}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        <p className="text-[0.6rem] text-text-muted text-center">
          {FORMATOS[origen].labelCorto} → {FORMATOS[destino].labelCorto} · Elipsoide GRS 1980 (MAGNA-SIRGAS) / WGS84 (UTM)
        </p>
      </div>
    </ToolCard>
  )
}
