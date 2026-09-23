import { useMemo, useState } from 'react'
import type { ItemFiltrado, FormatoCoordenadas, EstadoCoordenada } from '../types'
import { limpiarCoord, formatearLat, formatearLon, formatearUtm } from '../lib/coordenadas'
import { esDuplicadaPendiente } from '../lib/validacion'

const PAGE_SIZE = 100

const BADGE_CLASSES: Record<EstadoCoordenada, string> = {
  'VÁLIDA': 'bg-green-500', 'SOSPECHOSA': 'bg-gold-500', 'INVÁLIDA': 'bg-red-500', '': 'bg-text-muted',
}

function Badge({ estado }: { estado: EstadoCoordenada }) {
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[0.65rem] font-bold text-white ${BADGE_CLASSES[estado]}`}>{estado || 'S/D'}</span>
}

interface TablaRegistrosProps {
  filtrados: ItemFiltrado[]
  colLat: string
  colLon: string
  rows: Record<string, unknown>[]
  formato: FormatoCoordenadas
  filaDesde: number | null
  filaHasta: number | null
  onFilaDesdeChange: (v: number | null) => void
  onFilaHastaChange: (v: number | null) => void
  onFocusFila: (idx: number) => void
  onConfirmarDuplicada: (idx: number) => void
  onConfirmarTodasDuplicadas: () => void
}

/** Tabla paginada de registros con filtro por rango de fila de Excel --
 *  misma paginación (100 por página) y columnas que el original. */
export default function TablaRegistros({
  filtrados, colLat, colLon, rows, formato, filaDesde, filaHasta,
  onFilaDesdeChange, onFilaHastaChange, onFocusFila, onConfirmarDuplicada, onConfirmarTodasDuplicadas,
}: TablaRegistrosProps) {
  const [page, setPage] = useState(0)
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const paginaActual = Math.min(page, totalPaginas - 1)
  const start = paginaActual * PAGE_SIZE
  const end = Math.min(start + PAGE_SIZE, filtrados.length)
  const visibles = filtrados.slice(start, end)

  const pendientes = useMemo(() => filtrados.filter((item) => esDuplicadaPendiente(item.r)).length, [filtrados])

  const thLatLon = formato === 'utm'
    ? { lat: 'Coordenada UTM', lon: '' }
    : formato === 'dms' ? { lat: 'Lat (DMS)', lon: 'Lon (DMS)' } : { lat: 'Lat original', lon: 'Lon original' }

  return (
    <div className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h3 className="text-sm font-bold text-text">Registros ({filtrados.length.toLocaleString('es-CO')})</h3>
        {pendientes > 0 && (
          <button type="button" onClick={onConfirmarTodasDuplicadas}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-primary-800 bg-primary-800 text-white hover:bg-primary-700 transition-colors">
            Confirmar {pendientes.toLocaleString('es-CO')} repetidas como válidas
          </button>
        )}
      </div>

      <div className="overflow-auto max-h-[420px] border border-border/50 rounded-lg">
        <table className="w-full text-xs">
          <thead>
            <tr className="sticky top-0 bg-[var(--card-bg)]">
              {['Estado', 'Fila Excel', thLatLon.lat, thLatLon.lon, 'Depto. detectado', 'Municipio detectado', 'Tipo de error', 'Dist. al centro (km)', 'Observación', 'Acción'].map((h, i) => (
                <th key={i} className="text-left px-2 py-1.5 font-medium text-text-muted border-b border-border whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibles.map((item) => {
              const row = rows[item.idx], r = item.r
              const lat = limpiarCoord(row[colLat]), lon = limpiarCoord(row[colLon])
              const latTxt = formato === 'utm' ? formatearUtm(lat, lon) : formatearLat(lat, formato)
              const lonTxt = formato === 'utm' ? '' : formatearLon(lon, formato)
              const duplicadaPendiente = esDuplicadaPendiente(r)
              return (
                <tr key={item.idx} className="cursor-pointer hover:bg-bg-alt transition-colors" onClick={() => onFocusFila(item.idx)}>
                  <td className="px-2 py-1.5 border-b border-border/50"><Badge estado={r.estado} /></td>
                  <td className="px-2 py-1.5 border-b border-border/50 text-text whitespace-nowrap">
                    {r.manual
                      ? <span className="text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-full bg-primary-500/15 text-primary-700">agregado</span>
                      : (r.filaExcel ?? '—')}
                    {r.movido && <span className="ml-1 text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-full bg-gold-500/20 text-gold-600" title="Coordenada movida en el mapa">movido</span>}
                  </td>
                  <td className="px-2 py-1.5 border-b border-border/50 text-text whitespace-nowrap">{latTxt}</td>
                  <td className="px-2 py-1.5 border-b border-border/50 text-text whitespace-nowrap">{lonTxt}</td>
                  <td className="px-2 py-1.5 border-b border-border/50 text-text whitespace-nowrap">{r.depDet}</td>
                  <td className="px-2 py-1.5 border-b border-border/50 text-text whitespace-nowrap">{r.muniDet}</td>
                  <td className="px-2 py-1.5 border-b border-border/50 text-text max-w-[220px] truncate" title={r.tipoError}>{r.tipoError}</td>
                  <td className="px-2 py-1.5 border-b border-border/50 text-text">{r.distCentroideKm != null ? r.distCentroideKm.toFixed(2) : ''}</td>
                  <td className="px-2 py-1.5 border-b border-border/50 text-text max-w-[220px] truncate" title={r.observacion}>{r.observacion}</td>
                  <td className="px-2 py-1.5 border-b border-border/50">
                    {duplicadaPendiente && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); onConfirmarDuplicada(item.idx) }}
                        className="text-[0.65rem] font-semibold px-2 py-1 rounded-md border border-primary-800 text-primary-800 hover:bg-primary-500/10 transition-colors whitespace-nowrap">
                        Confirmar válida
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 mt-3">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <label htmlFor="vc-fila-desde" className="whitespace-nowrap">Fila Excel</label>
          <input id="vc-fila-desde" type="number" placeholder="Desde" value={filaDesde ?? ''}
            onChange={(e) => onFilaDesdeChange(e.target.value ? Number(e.target.value) : null)}
            className="w-20 px-2 py-1 text-xs border border-border rounded-md bg-[var(--card-bg)] text-text" />
          <span>a</span>
          <input id="vc-fila-hasta" type="number" placeholder="Hasta" value={filaHasta ?? ''}
            onChange={(e) => onFilaHastaChange(e.target.value ? Number(e.target.value) : null)}
            className="w-20 px-2 py-1 text-xs border border-border rounded-md bg-[var(--card-bg)] text-text" />
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>{filtrados.length ? `${start + 1}-${end} de ${filtrados.length}` : 'Sin resultados'}</span>
          <button type="button" disabled={paginaActual === 0} onClick={() => setPage(paginaActual - 1)}
            className="px-2.5 py-1 rounded-md border border-border text-text disabled:opacity-40 hover:border-primary-800 transition-colors">Anterior</button>
          <button type="button" disabled={end >= filtrados.length} onClick={() => setPage(paginaActual + 1)}
            className="px-2.5 py-1 rounded-md border border-border text-text disabled:opacity-40 hover:border-primary-800 transition-colors">Siguiente</button>
        </div>
      </div>
    </div>
  )
}
