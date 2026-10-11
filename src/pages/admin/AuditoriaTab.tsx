import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Download, ChevronLeft, ChevronRight, Loader2, AlertCircle, Calendar,
} from 'lucide-react'
import { fadeUpSm, EASE_OUT_EXPO } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'
import { useAuditLog, MODULO_STYLES, ACCION_LABEL } from '@/hooks/useAuditLog'
import { exportarActividadExcel } from '@/lib/exportarActividadExcel'

const fadeUp = fadeUpSm

const PAGE_SIZE = 10
const DEBOUNCE_MS = 350

// Todos los módulos que de verdad quedan registrados en audit_log (ver
// registrarAuditoria() en cada módulo) -- antes faltaban 3 reales
// (categorias, geovisores, notificaciones), así que filtrar por ellos desde
// este selector era imposible aunque el backend sí los tuviera.
const MODULOS_OPCIONES = [
  'auth', 'usuarios', 'admin', 'solicitudes', 'mapas', 'documentos',
  'categorias', 'geovisores', 'notificaciones', 'sistema',
]

// El backend ya soportaba filtrar por accion= exacta (getAuditLog en
// admin.service.js) -- no había ningún control de UI para usarlo, solo el
// buscador de texto libre. Se ofrecen las acciones ya catalogadas en
// ACCION_LABEL (con su etiqueta legible), ordenadas alfabéticamente.
const ACCION_OPCIONES = Object.entries(ACCION_LABEL)
  .map(([clave, { label }]) => ({ clave, label }))
  .sort((a, b) => a.label.localeCompare(b.label, 'es'))

/** Pestaña "Auditoría" de la pantalla de Actividad -- rastro de seguridad
 *  (quién hizo qué, ligado a usuario/IP). Distinto de la pestaña "Analítica"
 *  (comportamiento de navegación anónimo, ver AnaliticaTab.tsx). */
export default function AuditoriaTab() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('') // debounced -- ver useEffect abajo
  const [filtroModulo, setFiltroModulo] = useState('')
  const [filtroAccion, setFiltroAccion] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [page, setPage] = useState(1)
  const [exportando, setExportando] = useState(false)
  const [errorExportar, setErrorExportar] = useState(false)

  // Antes la búsqueda solo filtraba la página de 10 filas ya cargada -- el
  // placeholder prometía "buscar por usuario" pero no se podía, en la
  // práctica, encontrar la actividad de alguien si no estaba en la página
  // actual. Ahora es un parámetro real de la consulta al backend (con
  // debounce para no disparar una petición por cada tecla).
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isError, refetch } = useAuditLog({
    modulo: filtroModulo || undefined,
    accion: filtroAccion || undefined,
    q:      search || undefined,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta ? `${fechaHasta}T23:59:59.999Z` : undefined,
    limit:  PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })

  const logs       = data?.data ?? []
  const total      = data?.meta?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const exportExcel = async () => {
    setExportando(true)
    setErrorExportar(false)
    try {
      await exportarActividadExcel({
        filtroModulo: filtroModulo || undefined,
        filtroAccion: filtroAccion || undefined,
        busqueda: search || undefined,
        desde: fechaDesde || undefined,
        hasta: fechaHasta || undefined,
      })
    } catch {
      setErrorExportar(true)
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="space-y-6">
      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-text-muted">
          {isLoading ? '...' : `${total} eventos registrados en el sistema`}
        </p>
        <button
          onClick={exportExcel}
          disabled={isLoading || logs.length === 0 || exportando}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors shrink-0"
        >
          {exportando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exportando ? 'Generando Excel…' : 'Exportar Excel'}
        </button>
      </motion.div>

      {errorExportar && (
        <p className="text-xs text-red-500">No se pudo generar el archivo Excel. Intenta de nuevo.</p>
      )}

      {/* Filters */}
      <motion.div {...fadeUp(0.08)} className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por usuario, acción o descripción..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
          />
        </div>
        <select
          aria-label="Módulo"
          value={filtroModulo}
          onChange={(e) => { setFiltroModulo(e.target.value); setPage(1) }}
          className="px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 transition"
        >
          <option value="">Todos los módulos</option>
          {MODULOS_OPCIONES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select
          aria-label="Acción"
          value={filtroAccion}
          onChange={(e) => { setFiltroAccion(e.target.value); setPage(1) }}
          className="px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 transition"
        >
          <option value="">Todas las acciones</option>
          {ACCION_OPCIONES.map((a) => <option key={a.clave} value={a.clave}>{a.label}</option>)}
        </select>
        <label className="flex items-center gap-1.5 px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-xl text-sm text-text-muted">
          <Calendar className="w-4 h-4 shrink-0" />
          <input
            type="date"
            aria-label="Desde"
            value={fechaDesde}
            max={fechaHasta || undefined}
            onChange={(e) => { setFechaDesde(e.target.value); setPage(1) }}
            className="bg-transparent focus:outline-none text-text"
          />
        </label>
        <label className="flex items-center gap-1.5 px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-xl text-sm text-text-muted">
          <Calendar className="w-4 h-4 shrink-0" />
          <input
            type="date"
            aria-label="Hasta"
            value={fechaHasta}
            min={fechaDesde || undefined}
            onChange={(e) => { setFechaHasta(e.target.value); setPage(1) }}
            className="bg-transparent focus:outline-none text-text"
          />
        </label>
        {(fechaDesde || fechaHasta) && (
          <button
            type="button"
            onClick={() => { setFechaDesde(''); setFechaHasta(''); setPage(1) }}
            className="text-xs font-semibold text-text-muted hover:text-primary-800 transition-colors"
          >
            Limpiar fechas
          </button>
        )}
      </motion.div>

      {/* Table — sin tilt 3D: es una superficie de datos que se opera, no se admira */}
      <Card3D
        disabled
        initial={{ opacity: 0, y: 20, rotateX: 4, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  rotateX: 0, scale: 1    }}
        transition={{ delay: 0.14, duration: 0.5, ease: EASE_OUT_EXPO }}
        style={{ transformPerspective: 900 }}
        glow="rgba(26,86,50,0.12)"
        intensity={3}
        className="bg-[var(--card-bg)] border border-border/70 rounded-xl overflow-hidden"
        whileHover={{ y: -2 }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-alt/50">
                {['Acción', 'Módulo', 'Descripción', 'Usuario', 'IP', 'Fecha'].map((h) => (
                  <th key={h} className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-700 mx-auto" />
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-red-500 mb-3">No se pudo cargar el registro de actividad.</p>
                    <button onClick={() => refetch()} className="text-xs font-semibold text-primary-700 hover:text-primary-900 transition-colors">
                      Reintentar
                    </button>
                  </td>
                </tr>
              )}
              {!isLoading && !isError && logs.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-text-muted">Sin eventos registrados</td></tr>
              )}
              {logs.map((log, i) => (
                <tr
                  key={log.id}
                  className={`border-b border-border last:border-b-0 hover:bg-bg-alt/50 transition-colors ${i % 2 === 1 ? 'bg-bg-alt/20' : ''}`}
                >
                  <td className="px-5 py-3.5">
                    <span className={`text-[0.6rem] font-bold uppercase px-2 py-0.5 rounded-full ${log.badge}`}>
                      {log.accionLabel}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MODULO_STYLES[log.modulo] ?? 'bg-bg-alt text-text-muted'}`}>
                      {log.modulo}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 max-w-xs">
                    <p className="text-sm text-text truncate">{log.descripcion || '—'}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-text-muted">{log.email}</td>
                  <td className="px-5 py-3.5 text-sm text-text-muted font-mono text-xs">{log.ip}</td>
                  <td className="px-5 py-3.5 text-sm text-text-muted whitespace-nowrap">{log.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-5 py-3 border-t border-border bg-bg-alt/30 flex items-center justify-between">
          <span className="text-xs text-text-muted">
            Página {page} de {totalPages} · {total} eventos total
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded-lg text-text-muted hover:text-primary-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-text px-2">{page}/{totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded-lg text-text-muted hover:text-primary-800 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card3D>
    </div>
  )
}
