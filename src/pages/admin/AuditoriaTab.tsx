import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Download, ChevronLeft, ChevronRight, Loader2, AlertCircle, Calendar, Eye,
  Monitor, Smartphone, Tablet,
} from 'lucide-react'
import { fadeUpSm, EASE_OUT_EXPO } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'
import { useAuditLog, useAuditResumen, MODULO_STYLES, ACCION_LABEL, type AuditLogData } from '@/hooks/useAuditLog'
import { exportarActividadExcel } from '@/lib/exportarActividadExcel'
import { SEVERIDAD_META, SEVERIDADES_ORDEN, resumenOrigen } from '@/lib/constants/auditoria'
import ResumenAuditoria from '@/components/admin/actividad/ResumenAuditoria'
import DetalleEventoDrawer from '@/components/admin/actividad/DetalleEventoDrawer'

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

const selectCls = 'px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 transition'
const inputCls = 'px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition'

/** Devuelve `valor` solo después de que deje de cambiar durante `ms`, para no pedir al backend por cada tecla. */
function useDebounced(valor: string, ms: number) {
  const [estable, setEstable] = useState(valor)
  useEffect(() => {
    const t = setTimeout(() => setEstable(valor), ms)
    return () => clearTimeout(t)
  }, [valor, ms])
  return estable
}

function IconoDispositivo({ dispositivo }: { dispositivo: string | null }) {
  if (dispositivo === 'movil') return <Smartphone className="w-3 h-3 shrink-0" aria-hidden="true" />
  if (dispositivo === 'tablet') return <Tablet className="w-3 h-3 shrink-0" aria-hidden="true" />
  return <Monitor className="w-3 h-3 shrink-0" aria-hidden="true" />
}

/** Pestaña "Auditoría" de la pantalla de Actividad -- rastro de seguridad
 *  (quién hizo qué, ligado a usuario/IP). Distinto de la pestaña "Analítica"
 *  (comportamiento de navegación anónimo, ver AnaliticaTab.tsx). */
export default function AuditoriaTab() {
  const [searchInput, setSearchInput] = useState('')
  const [usuarioInput, setUsuarioInput] = useState('')
  const [ipInput, setIpInput] = useState('')
  const [filtroModulo, setFiltroModulo] = useState('')
  const [filtroAccion, setFiltroAccion] = useState('')
  const [filtroSeveridad, setFiltroSeveridad] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [page, setPage] = useState(1)
  const [seleccionado, setSeleccionado] = useState<AuditLogData | null>(null)
  const [exportando, setExportando] = useState(false)
  const [errorExportar, setErrorExportar] = useState(false)

  // La búsqueda y los filtros de texto son parámetros reales de la consulta al
  // backend (con debounce), no filtros sobre la página de 10 filas ya cargada.
  const search = useDebounced(searchInput, DEBOUNCE_MS)
  const usuario = useDebounced(usuarioInput, DEBOUNCE_MS)
  const ip = useDebounced(ipInput, DEBOUNCE_MS)
  // Al cambiar un filtro de texto se vuelve a la página 1. Se ajusta durante el render
  // (no en un efecto) para no provocar un segundo render con la página vieja.
  const claveTexto = `${search}|${usuario}|${ip}`
  const [claveTextoPrevia, setClaveTextoPrevia] = useState(claveTexto)
  if (claveTexto !== claveTextoPrevia) {
    setClaveTextoPrevia(claveTexto)
    setPage(1)
  }

  const { data, isLoading, isError, refetch } = useAuditLog({
    modulo: filtroModulo || undefined,
    accion: filtroAccion || undefined,
    severidad: filtroSeveridad || undefined,
    usuario: usuario || undefined,
    ip: ip || undefined,
    q:      search || undefined,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta ? `${fechaHasta}T23:59:59.999Z` : undefined,
    limit:  PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })
  const { data: resumen } = useAuditResumen()

  const logs       = data?.data ?? []
  const total      = data?.meta?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const hayFiltros = !!(searchInput || usuarioInput || ipInput || filtroModulo || filtroAccion || filtroSeveridad || fechaDesde || fechaHasta)

  const limpiarFiltros = () => {
    setSearchInput(''); setUsuarioInput(''); setIpInput('')
    setFiltroModulo(''); setFiltroAccion(''); setFiltroSeveridad('')
    setFechaDesde(''); setFechaHasta(''); setPage(1)
  }

  const filtrarDesdeResumen = ({ accion, severidad }: { accion?: string; severidad?: string }) => {
    setFiltroAccion(accion ?? '')
    setFiltroSeveridad(severidad ?? '')
    setPage(1)
  }

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
      <ResumenAuditoria resumen={resumen} onFiltrar={filtrarDesdeResumen} />

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
      <motion.div {...fadeUp(0.08)} className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar por usuario, acción o descripción..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={`w-full pl-9 ${inputCls}`}
            />
          </div>
          <select aria-label="Gravedad" value={filtroSeveridad}
            onChange={(e) => { setFiltroSeveridad(e.target.value); setPage(1) }} className={selectCls}>
            <option value="">Todas las gravedades</option>
            {SEVERIDADES_ORDEN.map((s) => <option key={s} value={s}>{SEVERIDAD_META[s].label}</option>)}
          </select>
          <select aria-label="Módulo" value={filtroModulo}
            onChange={(e) => { setFiltroModulo(e.target.value); setPage(1) }} className={selectCls}>
            <option value="">Todos los módulos</option>
            {MODULOS_OPCIONES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select aria-label="Acción" value={filtroAccion}
            onChange={(e) => { setFiltroAccion(e.target.value); setPage(1) }} className={selectCls}>
            <option value="">Todas las acciones</option>
            {ACCION_OPCIONES.map((a) => <option key={a.clave} value={a.clave}>{a.label}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input type="text" aria-label="Usuario" placeholder="Usuario (correo)" value={usuarioInput}
            onChange={(e) => setUsuarioInput(e.target.value)} className={`w-52 ${inputCls}`} />
          <input type="text" aria-label="IP" placeholder="IP (ej. 186.96)" value={ipInput} inputMode="decimal"
            onChange={(e) => setIpInput(e.target.value.replace(/[^0-9a-fA-F:.]/g, ''))} className={`w-40 font-mono ${inputCls}`} />
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
          {hayFiltros && (
            <button type="button" onClick={limpiarFiltros}
              className="text-xs font-semibold text-text-muted hover:text-primary-800 transition-colors">
              Limpiar filtros
            </button>
          )}
        </div>
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
                <th className="pl-5 pr-2 py-3 w-px"><span className="sr-only">Gravedad</span></th>
                {['Acción', 'Módulo', 'Descripción', 'Usuario', 'Origen', 'Fecha'].map((h) => (
                  <th key={h} className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted px-5 py-3">{h}</th>
                ))}
                <th className="px-5 py-3"><span className="sr-only">Detalle</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-700 mx-auto" />
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center">
                    <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-red-500 mb-3">No se pudo cargar el registro de actividad.</p>
                    <button onClick={() => refetch()} className="text-xs font-semibold text-primary-700 hover:text-primary-900 transition-colors">
                      Reintentar
                    </button>
                  </td>
                </tr>
              )}
              {!isLoading && !isError && logs.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-text-muted">Sin eventos registrados</td></tr>
              )}
              {logs.map((log, i) => {
                const gravedad = SEVERIDAD_META[log.severidad]
                const origen = resumenOrigen(log.navegador, log.sistema)
                return (
                  <tr
                    key={log.id}
                    onClick={() => setSeleccionado(log)}
                    className={`border-b border-border last:border-b-0 hover:bg-bg-alt/50 transition-colors cursor-pointer ${i % 2 === 1 ? 'bg-bg-alt/20' : ''}`}
                  >
                    <td className="pl-5 pr-2 py-3.5">
                      <span className={`block w-2.5 h-2.5 rounded-full ${gravedad.dot}`} title={gravedad.label} aria-hidden="true" />
                      <span className="sr-only">{gravedad.label}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`whitespace-nowrap text-[0.6rem] font-bold uppercase px-2 py-0.5 rounded-full ${log.badge}`}>
                        {log.accionLabel}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MODULO_STYLES[log.modulo] ?? 'bg-bg-alt text-text-muted'}`}>
                        {log.modulo}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <p className="text-sm text-text line-clamp-2" title={log.descripcion || undefined}>{log.descripcion || '—'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-muted">{log.email}</td>
                    <td className="px-5 py-3.5">
                      <span className="block text-xs text-text font-mono">{log.ip}</span>
                      {origen && (
                        <span className="mt-0.5 inline-flex items-center gap-1 whitespace-nowrap text-[0.65rem] text-text-muted">
                          <IconoDispositivo dispositivo={log.dispositivo} />{origen}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-muted whitespace-nowrap">{log.fecha}</td>
                    <td className="px-3 py-3.5">
                      <button type="button" aria-label={`Ver detalle de ${log.accionLabel}`}
                        onClick={(e) => { e.stopPropagation(); setSeleccionado(log) }}
                        className="p-1.5 rounded-lg text-text-muted hover:text-primary-800 hover:bg-primary-500/10 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
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

      <DetalleEventoDrawer evento={seleccionado} onCerrar={() => setSeleccionado(null)} />
    </div>
  )
}
