import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftRight, Download, Copy } from 'lucide-react'
import ToolCard from './ToolCard'
import { wgs84ToMagna, magnaToWgs84 } from '@/lib/proyeccionMagna'

type Modo = 'wgs2magna' | 'magna2wgs'

interface FilaResultado {
  linea: number
  entradaA: string
  entradaB: string
  salidaA?: number
  salidaB?: number
  error?: string
}

// Una línea por coordenada, separada por coma, punto y coma, tabulador o
// espacio -- cubre tanto pegar desde Excel/Sheets (tabulador) como un CSV
// simple. El separador de miles/decimal en coma del modo de una sola
// coordenada (es-CO) se deja fuera aquí a propósito: es ambiguo mezclado
// con coma como separador de columna en un lote, así que el lote pide punto
// decimal -- se explica en el hint junto al textarea.
const SEPARADOR = /[,;\t\s]+/
const MAX_LINEAS = 2000

function parseNumero(token: string): number | null {
  const limpio = token.trim()
  if (!/^-?\d+(\.\d+)?$/.test(limpio)) return null
  return parseFloat(limpio)
}

function convertirLote(texto: string, modo: Modo): FilaResultado[] {
  return texto
    .split('\n')
    .map((linea, i) => ({ linea: i + 1, texto: linea.trim() }))
    .filter((l) => l.texto.length > 0)
    .slice(0, MAX_LINEAS)
    .map(({ linea, texto }) => {
      const partes = texto.split(SEPARADOR).filter(Boolean)
      if (partes.length !== 2) {
        return { linea, entradaA: texto, entradaB: '', error: 'Se esperaban 2 valores separados por coma, espacio o tabulador' }
      }
      const [a, b] = partes
      const numA = parseNumero(a)
      const numB = parseNumero(b)
      if (numA === null || numB === null) {
        return { linea, entradaA: a, entradaB: b, error: 'Valores no numéricos (usa punto decimal, ej. 4.8213)' }
      }

      if (modo === 'wgs2magna') {
        if (numA < -4 || numA > 14)   return { linea, entradaA: a, entradaB: b, error: 'Latitud fuera del territorio colombiano' }
        if (numB < -82 || numB > -66) return { linea, entradaA: a, entradaB: b, error: 'Longitud fuera del territorio colombiano' }
        const { x, y } = wgs84ToMagna(numA, numB)
        return { linea, entradaA: a, entradaB: b, salidaA: x, salidaB: y }
      }
      const { lat, lon } = magnaToWgs84(numA, numB)
      return { linea, entradaA: a, entradaB: b, salidaA: lat, salidaB: lon }
    })
}

function aCSV(filas: FilaResultado[], modo: Modo): string {
  const encabezados = modo === 'wgs2magna'
    ? ['linea', 'latitud', 'longitud', 'x', 'y', 'error']
    : ['linea', 'x', 'y', 'latitud', 'longitud', 'error']
  const filasCSV = filas.map((f) => [
    f.linea, f.entradaA, f.entradaB, f.salidaA ?? '', f.salidaB ?? '', f.error ?? '',
  ].join(','))
  return [encabezados.join(','), ...filasCSV].join('\n')
}

export default function ConversorCoordenadas() {
  const [modo, setModo]       = useState<Modo>('wgs2magna')
  const [texto, setTexto]     = useState('4.8213, -76.7324\n5.6947, -76.6614')
  const [resultados, setResultados] = useState<FilaResultado[] | null>(null)
  const [copied, setCopied]   = useState(false)

  const convert = () => setResultados(convertirLote(texto, modo))

  const switchModo = (id: Modo) => { setModo(id); setResultados(null) }

  const ejemplo = modo === 'wgs2magna'
    ? 'Una coordenada por línea: latitud, longitud (ej. 4.8213, -76.7324)'
    : 'Una coordenada por línea: X, Y en metros (ej. 1042482, 1120943)'

  const totalErrores = resultados?.filter((f) => f.error).length ?? 0
  const excedeLimite = texto.split('\n').filter((l) => l.trim()).length > MAX_LINEAS

  const copiarResultados = () => {
    if (!resultados) return
    const textoTabulado = resultados.map((f) => [
      f.entradaA, f.entradaB, f.salidaA ?? '', f.salidaB ?? '', f.error ?? '',
    ].join('\t')).join('\n')
    navigator.clipboard.writeText(textoTabulado).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  const descargarCSV = () => {
    if (!resultados) return
    const blob = new Blob([aCSV(resultados, modo)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `coordenadas-convertidas-${modo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ToolCard tag="Geodésico" title="Conversor de Coordenadas" icon={ArrowLeftRight} color="gold" index={2}>
      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-bg-alt rounded-xl mb-4">
        {([
          { id: 'wgs2magna' as const, label: 'WGS84 → Magna' },
          { id: 'magna2wgs' as const, label: 'Magna → WGS84' },
        ]).map((m) => (
          <button
            key={m.id}
            onClick={() => switchModo(m.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              modo === m.id ? 'bg-[var(--card-bg)] text-primary-800 shadow-sm' : 'text-text-muted hover:text-text'
            }`}
          >
            {m.label}
          </button>
        ))}
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
                    <th className="text-left px-3 py-1.5 font-bold">{modo === 'wgs2magna' ? 'Lat, Lon' : 'X, Y'}</th>
                    <th className="text-left px-3 py-1.5 font-bold">{modo === 'wgs2magna' ? 'X, Y' : 'Lat, Lon'}</th>
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
                          : <span className="text-primary-900">{f.salidaA?.toLocaleString('es-CO', { maximumFractionDigits: 6 })}, {f.salidaB?.toLocaleString('es-CO', { maximumFractionDigits: 6 })}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        <p className="text-[0.6rem] text-text-muted text-center">
          Sistema de referencia: MAGNA-SIRGAS / Colombia Oeste (EPSG:3115) · Meridiano central −77°
        </p>
      </div>
    </ToolCard>
  )
}
