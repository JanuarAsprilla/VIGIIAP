import { useState } from 'react'
import { motion } from 'framer-motion'
import type { FilaExcel } from '../types'

interface ColumnasModalProps {
  nombreHoja: string
  filas: FilaExcel[]
  columnasNumericas: string[]
  latSugerida: string
  lonSugerida: string
  onCancelar: () => void
  onConfirmar: (colLat: string, colLon: string) => void
}

/** Overlay para elegir qué columna es latitud y cuál longitud -- mismo flujo
 *  que la herramienta original (sugerencia automática + vista previa). */
export default function ColumnasModal({
  nombreHoja, filas, columnasNumericas, latSugerida, lonSugerida, onCancelar, onConfirmar,
}: ColumnasModalProps) {
  const [colLat, setColLat] = useState(latSugerida)
  const [colLon, setColLon] = useState(lonSugerida)
  const [error, setError] = useState('')

  const columnas = filas.length ? Object.keys(filas[0]) : []

  const confirmar = () => {
    if (colLat === colLon) { setError('La columna de latitud y de longitud no pueden ser la misma.'); return }
    onConfirmar(colLat, colLon)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-auto p-6"
      >
        <h3 className="text-base font-bold text-text mb-1">Selecciona las columnas de coordenadas</h3>
        <p className="text-xs text-text-muted mb-4">
          Hoja &quot;{nombreHoja}&quot;: {filas.length.toLocaleString('es-CO')} filas, {columnas.length} columnas ({columnasNumericas.length} numéricas). Solo las columnas numéricas aparecen en los desplegables.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label htmlFor="vc-col-lat" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Columna de latitud</label>
            <select id="vc-col-lat" value={colLat} onChange={(e) => setColLat(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-[var(--card-bg)] text-text focus:outline-none focus:ring-2 focus:ring-primary-400">
              {columnasNumericas.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="vc-col-lon" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Columna de longitud</label>
            <select id="vc-col-lon" value={colLon} onChange={(e) => setColLon(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-[var(--card-bg)] text-text focus:outline-none focus:ring-2 focus:ring-primary-400">
              {columnasNumericas.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="border border-border rounded-lg overflow-auto max-h-56 mb-3">
          <table className="w-full text-xs">
            <thead>
              <tr>
                {columnas.map((c) => (
                  <th key={c} className={`text-left px-2 py-1.5 font-medium border-b border-border whitespace-nowrap ${columnasNumericas.includes(c) ? 'text-primary-700' : 'text-text-muted'}`}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.slice(0, 5).map((row, i) => (
                <tr key={i}>
                  {columnas.map((c) => (
                    <td key={c} className="px-2 py-1.5 border-b border-border/50 text-text whitespace-nowrap">{String(row[c] ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className={`text-xs mb-3 ${error ? 'text-red-500' : 'text-text-muted'}`}>
          {error || 'Las columnas en gris son de texto y no se pueden usar como coordenadas.'}
        </p>

        <div className="flex gap-2">
          <button type="button" onClick={onCancelar}
            className="flex-1 py-2 rounded-lg text-sm font-semibold border border-border text-text hover:border-primary-800 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={confirmar}
            className="flex-[2] py-2 rounded-lg text-sm font-semibold bg-primary-800 text-white hover:bg-primary-700 transition-colors">
            Confirmar y validar
          </button>
        </div>
      </motion.div>
    </div>
  )
}
