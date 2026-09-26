import { Fragment, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Doughnut, Bar } from 'react-chartjs-2'
import {
  ChevronLeft, ChevronRight, Loader2, AlertCircle, AlertTriangle, ChevronDown, ChevronUp,
  Search, Copy, Check, ServerCrash, Clock, Repeat2, ShieldCheck,
} from 'lucide-react'
import { fadeUpSm, EASE_OUT_EXPO } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'
import { useErrorLog, useActualizarEstadoError, type ErrorLogData, type EstadoError } from '@/hooks/useErrorLog'
import { timeAgo } from '@/lib/dateUtils'
import { SEVERIDAD_COLOR, DOUGHNUT_OPTIONS, HORIZONTAL_BAR_OPTIONS } from '@/lib/erroresChartConfig'
import { useAuth } from '@/contexts/AuthContext'
import { puedeEditarModulo } from '@/lib/permisosModulo'

const fadeUp = fadeUpSm
const PAGE_SIZE = 10
// Techo práctico para traer TODOS los tipos de error distintos (agrupados por
// fingerprint, ver error_log) de una sola vez -- el resumen, los gráficos y
// los filtros deben reflejar el registro completo, no solo la página que se
// esté viendo. 200 tipos de error distintos recurrentes ya sería síntoma de
// un sistema seriamente roto; es un techo generoso, no una paginación real.
const LIMITE_COMPLETO = 200

type Severidad = 'critico' | 'advertencia' | 'info'

const SEVERIDAD_FILTROS: { clave: Severidad | 'todos'; label: string }[] = [
  { clave: 'todos', label: 'Todos' },
  { clave: 'critico', label: 'Críticos' },
  { clave: 'advertencia', label: 'Advertencias' },
  { clave: 'info', label: 'Info' },
]

const ESTADO_LABEL: Record<EstadoError, string> = {
  pendiente: 'Pendiente',
  revisando: 'Revisando',
  resuelto: 'Resuelto',
}

const ESTADO_ESTILO: Record<EstadoError, string> = {
  pendiente: 'bg-red/10 text-red-dark border-red/25',
  revisando: 'bg-gold-500/10 text-gold-500 border-gold-500/25',
  resuelto: 'bg-primary-700/10 text-primary-700 border-primary-700/25',
}

const ESTADO_FILTROS: { clave: EstadoError | 'todos'; label: string }[] = [
  { clave: 'todos', label: 'Todos' },
  { clave: 'pendiente', label: 'Pendientes' },
  { clave: 'revisando', label: 'Revisando' },
  { clave: 'resuelto', label: 'Resueltos' },
]

// Los pendientes suben arriba, los resueltos se hunden abajo -- la lista se
// va "vaciando" visualmente a medida que se atienden errores, en vez de
// quedar en el mismo orden sin importar qué tan atendido esté cada uno.
const ESTADO_PRIORIDAD: Record<EstadoError, number> = { pendiente: 0, revisando: 1, resuelto: 2 }

/** Select de estado si el admin puede editar el módulo, o un badge de solo
 *  lectura si no -- el control de seguimiento no debe fingir ser editable
 *  para quien no tiene permiso de "editar" sobre errores. */
function EstadoControl({ estado, onChange, disabled, cargando }: {
  estado: EstadoError
  onChange: (estado: EstadoError) => void
  disabled: boolean
  cargando: boolean
}) {
  if (disabled) {
    return (
      <span className={`text-[0.6rem] font-bold uppercase tracking-wider px-2 py-1 rounded-full border shrink-0 ${ESTADO_ESTILO[estado]}`}>
        {ESTADO_LABEL[estado]}
      </span>
    )
  }
  return (
    <select
      aria-label="Estado del error"
      value={estado}
      disabled={cargando}
      onClick={(ev) => ev.stopPropagation()}
      onChange={(ev) => onChange(ev.target.value as EstadoError)}
      className={`text-[0.6rem] font-bold uppercase tracking-wider pl-2 pr-1 py-1 rounded-full border shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-800/20 disabled:opacity-50 ${ESTADO_ESTILO[estado]}`}
    >
      {(Object.keys(ESTADO_LABEL) as EstadoError[]).map((k) => (
        <option key={k} value={k}>{ESTADO_LABEL[k]}</option>
      ))}
    </select>
  )
}

function severidadClave(statusCode: number): Severidad {
  if (statusCode >= 500) return 'critico'
  if (statusCode >= 400) return 'advertencia'
  return 'info'
}

const METODO_COLOR: Record<string, string> = {
  GET:    'bg-primary-700/10 text-primary-700',
  POST:   'bg-green-700/10 text-green-700',
  PATCH:  'bg-gold-400/12 text-gold-400',
  PUT:    'bg-gold-400/12 text-gold-400',
  DELETE: 'bg-red/10 text-red-dark',
}

/** 5xx = falla real del servidor; 4xx = petición inválida/rechazada; el resto no debería llegar aquí. */
function severidad(statusCode: number) {
  if (statusCode >= 500) return { label: 'Crítico', color: 'text-red-dark bg-red/10 border-red/25', Icon: ServerCrash }
  if (statusCode >= 400) return { label: 'Advertencia', color: 'text-gold-500 bg-gold-500/10 border-gold-500/25', Icon: AlertTriangle }
  return { label: 'Info', color: 'text-primary-700 bg-primary-700/10 border-primary-700/25', Icon: AlertCircle }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async (ev) => {
        ev.stopPropagation()
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch { /* portapapeles no disponible — no bloquea la lectura del stack */ }
      }}
      className="inline-flex items-center gap-1 text-[0.65rem] font-semibold text-text-muted hover:text-primary-800 transition-colors"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copiado' : 'Copiar detalle'}
    </button>
  )
}

function ErrorRow({ e, expanded, onToggle, onCambiarEstado, puedeEditar, actualizandoEstado }: {
  e: ErrorLogData
  expanded: boolean
  onToggle: () => void
  onCambiarEstado: (id: number, estado: EstadoError) => void
  puedeEditar: boolean
  actualizandoEstado: boolean
}) {
  const sev = severidad(e.statusCode)
  const metodoCls = METODO_COLOR[e.metodo] ?? 'bg-bg-alt text-text-muted'
  // Un error resuelto se atenúa -- de un vistazo se distingue lo que falta
  // por atender de lo que ya quedó cerrado, sin desaparecer de la lista.
  const resuelto = e.estado === 'resuelto'
  return (
    <div className={`border-b border-border last:border-b-0 ${resuelto ? 'opacity-55 hover:opacity-100 transition-opacity' : ''}`}>
      <div className="w-full flex items-start gap-3.5 px-5 py-4 hover:bg-bg-alt/40 transition-colors">
        <button
          type="button"
          onClick={onToggle}
          disabled={!e.stack}
          aria-expanded={e.stack ? expanded : undefined}
          className="flex-1 min-w-0 flex items-start gap-3.5 text-left disabled:cursor-default"
        >
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${sev.color}`}>
            <sev.Icon className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-text">{e.mensaje}</p>
              <span className={`text-[0.6rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 border ${sev.color}`}>
                {e.statusCode}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted mt-1.5">
              <span className={`font-mono font-bold text-[0.65rem] px-1.5 py-0.5 rounded ${metodoCls}`}>{e.metodo}</span>
              <span className="font-mono truncate max-w-[18rem]">{e.ruta}</span>
              <span className="flex items-center gap-1 shrink-0">
                <Repeat2 className="w-3 h-3" aria-hidden="true" />{e.ocurrencias} {e.ocurrencias === 1 ? 'vez' : 'veces'}
              </span>
              <span className="flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3" aria-hidden="true" />{timeAgo(e.ultimaVezIso)}
              </span>
            </div>
          </div>
        </button>
        <div className="flex flex-col items-end gap-2 shrink-0 pt-0.5">
          <EstadoControl
            estado={e.estado}
            onChange={(estado) => onCambiarEstado(e.id, estado)}
            disabled={!puedeEditar}
            cargando={actualizandoEstado}
          />
          {e.stack && (
            <button type="button" onClick={onToggle} aria-label={expanded ? 'Contraer detalle' : 'Expandir detalle'} className="text-text-muted hover:text-primary-800 transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
      {expanded && e.stack && (
        <div className="px-5 pb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted">Detalle técnico</span>
            <CopyButton text={e.stack} />
          </div>
          <pre className="text-xs font-mono text-text-muted bg-bg-alt/60 border border-border rounded-lg p-3 whitespace-pre-wrap break-all max-h-64 overflow-y-auto">{e.stack}</pre>
          <p className="text-[0.65rem] text-text-muted mt-2">
            Primera vez: {e.primeraVez} · Última vez: {e.ultimaVez}
            {e.estadoActualizadoPor && ` · Estado actualizado por ${e.estadoActualizadoPor}${e.estadoActualizadoEn ? ` el ${e.estadoActualizadoEn}` : ''}`}
          </p>
        </div>
      )}
    </div>
  )
}

export default function Errores() {
  const { user } = useAuth()
  const puedeEditar = puedeEditarModulo(user, 'errores')
  const [page, setPage] = useState(1)
  const [expandido, setExpandido] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [severidadFiltro, setSeveridadFiltro] = useState<Severidad | 'todos'>('todos')
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoError | 'todos'>('todos')

  // Un solo fetch del registro completo -- el resumen, los gráficos, el
  // filtro de severidad y la paginación (ahora client-side) trabajan todos
  // sobre el mismo conjunto de datos, sin la inconsistencia de mezclar un
  // resumen "global" con una tabla paginada por el servidor.
  const { data, isLoading, isError, refetch } = useErrorLog({ limit: LIMITE_COMPLETO })
  const actualizarEstado = useActualizarEstadoError()

  const todosErrores = useMemo(() => data?.data ?? [], [data])

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    return todosErrores
      .filter((e) => {
        const coincideTexto = !q || e.mensaje.toLowerCase().includes(q) || e.ruta.toLowerCase().includes(q)
        const coincideSeveridad = severidadFiltro === 'todos' || severidadClave(e.statusCode) === severidadFiltro
        const coincideEstado = estadoFiltro === 'todos' || e.estado === estadoFiltro
        return coincideTexto && coincideSeveridad && coincideEstado
      })
      // Sort estable: dentro de cada estado se conserva el orden que ya traía
      // el backend (más reciente primero), solo se reordenan los grupos.
      .sort((a, b) => ESTADO_PRIORIDAD[a.estado] - ESTADO_PRIORIDAD[b.estado])
  }, [todosErrores, query, severidadFiltro, estadoFiltro])

  const total      = filtrados.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const errores    = useMemo(
    () => filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtrados, page],
  )

  const resumen = useMemo(() => {
    if (todosErrores.length === 0) return null
    const ocurrenciasTotales = todosErrores.reduce((sum, e) => sum + e.ocurrencias, 0)
    const criticos = todosErrores.filter((e) => e.statusCode >= 500).length
    const pendientes = todosErrores.filter((e) => e.estado !== 'resuelto').length
    const masFrecuente = todosErrores.reduce((a, b) => (b.ocurrencias > a.ocurrencias ? b : a))
    return { ocurrenciasTotales, criticos, pendientes, masFrecuente }
  }, [todosErrores])

  const distribucionSeveridad = useMemo(() => {
    const porSeveridad: Record<Severidad, number> = { critico: 0, advertencia: 0, info: 0 }
    todosErrores.forEach((e) => { porSeveridad[severidadClave(e.statusCode)] += e.ocurrencias })
    return porSeveridad
  }, [todosErrores])

  const topRutas = useMemo(() => {
    const porRuta = new Map<string, number>()
    todosErrores.forEach((e) => porRuta.set(e.ruta, (porRuta.get(e.ruta) ?? 0) + e.ocurrencias))
    return Array.from(porRuta, ([ruta, ocurrencias]) => ({ ruta, ocurrencias }))
      .sort((a, b) => b.ocurrencias - a.ocurrencias)
      .slice(0, 6)
  }, [todosErrores])

  const hayDatosParaGraficos = todosErrores.length > 0
    && (distribucionSeveridad.critico + distribucionSeveridad.advertencia + distribucionSeveridad.info) > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp(0)}>
        <span className="text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: 'var(--hero-eyebrow-text)' }}>Administración</span>
        <h1 className="font-display text-2xl font-bold text-text mt-0.5">Registro de Errores</h1>
        <p className="text-sm text-text-muted mt-1">
          {isLoading ? '...' : total === 0
            ? 'Sin errores registrados — todo en orden'
            : `${total} error${total === 1 ? '' : 'es'} distinto${total === 1 ? '' : 's'} registrado${total === 1 ? '' : 's'}, agrupados por tipo`}
        </p>
      </motion.div>

      {/* Resumen -- da una lectura rápida de qué tan grave es la situación antes de leer fila por fila */}
      {!isLoading && !isError && resumen && (
        <motion.div {...fadeUp(0.03)} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${resumen.pendientes > 0 ? 'bg-red/10' : 'bg-primary-700/10'}`}>
              {resumen.pendientes > 0
                ? <AlertCircle className="w-4 h-4 text-red-dark" aria-hidden="true" />
                : <ShieldCheck className="w-4 h-4 text-primary-700" aria-hidden="true" />}
            </div>
            <div>
              <p className="text-lg font-bold text-text leading-none">{resumen.pendientes}</p>
              <p className="text-[0.65rem] text-text-muted mt-1">{resumen.pendientes === 0 ? 'Todo atendido' : 'Pendientes de atender'}</p>
            </div>
          </div>
          <div className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${resumen.criticos > 0 ? 'bg-red/10' : 'bg-primary-700/10'}`}>
              {resumen.criticos > 0
                ? <ServerCrash className="w-4 h-4 text-red-dark" aria-hidden="true" />
                : <ShieldCheck className="w-4 h-4 text-primary-700" aria-hidden="true" />}
            </div>
            <div>
              <p className="text-lg font-bold text-text leading-none">{resumen.criticos}</p>
              <p className="text-[0.65rem] text-text-muted mt-1">Tipos de error críticos (5xx)</p>
            </div>
          </div>
          <div className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gold-500/10 flex items-center justify-center shrink-0">
              <Repeat2 className="w-4 h-4 text-gold-500" aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-bold text-text leading-none">{resumen.ocurrenciasTotales}</p>
              <p className="text-[0.65rem] text-text-muted mt-1">Ocurrencias totales registradas</p>
            </div>
          </div>
          <div className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-4 flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary-700/10 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-primary-700" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-text leading-tight truncate">{resumen.masFrecuente.mensaje}</p>
              <p className="text-[0.65rem] text-text-muted mt-1">Más frecuente — {resumen.masFrecuente.ocurrencias}×</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Gráficos -- distribución por severidad y rutas más afectadas, sobre
          el registro completo (no solo la página visible de la tabla). */}
      {!isLoading && !isError && hayDatosParaGraficos && (
        <motion.div {...fadeUp(0.04)} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-5">
            <h3 className="section-title mb-4">Distribución por Severidad</h3>
            <div style={{ height: 220 }}>
              <Doughnut
                data={{
                  labels: ['Críticos (5xx)', 'Advertencias (4xx)', 'Info'],
                  datasets: [{
                    data: [distribucionSeveridad.critico, distribucionSeveridad.advertencia, distribucionSeveridad.info],
                    backgroundColor: [SEVERIDAD_COLOR.critico, SEVERIDAD_COLOR.advertencia, SEVERIDAD_COLOR.info],
                    borderColor: '#FFFFFF',
                    borderWidth: 2,
                  }],
                }}
                options={DOUGHNUT_OPTIONS}
              />
            </div>
          </div>
          <div className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-5">
            <h3 className="section-title mb-4">Rutas Más Afectadas</h3>
            <div style={{ height: 220 }}>
              <Bar
                data={{
                  labels: topRutas.map((r) => r.ruta),
                  datasets: [{
                    data: topRutas.map((r) => r.ocurrencias),
                    backgroundColor: '#C12A2B',
                    borderRadius: 4,
                    maxBarThickness: 22,
                  }],
                }}
                options={HORIZONTAL_BAR_OPTIONS}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Buscador + filtro de severidad */}
      {!isLoading && !isError && todosErrores.length > 0 && (
        <motion.div {...fadeUp(0.05)} className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
            <input type="text" aria-label="Buscar error por mensaje o endpoint" placeholder="Buscar por mensaje o endpoint…"
              value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
            />
          </div>
          <div role="group" aria-label="Filtrar por severidad" className="flex gap-1.5 bg-bg-alt/40 border border-border rounded-xl p-1.5">
            {SEVERIDAD_FILTROS.map((f) => (
              <button
                key={f.clave}
                onClick={() => { setSeveridadFiltro(f.clave); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  severidadFiltro === f.clave ? 'bg-primary-800 text-white' : 'text-text-muted hover:text-text'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div role="group" aria-label="Filtrar por estado" className="flex gap-1.5 bg-bg-alt/40 border border-border rounded-xl p-1.5">
            {ESTADO_FILTROS.map((f) => (
              <button
                key={f.clave}
                onClick={() => { setEstadoFiltro(f.clave); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  estadoFiltro === f.clave ? 'bg-primary-800 text-white' : 'text-text-muted hover:text-text'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Lista — sin tilt 3D: es una superficie de datos que se opera, no se admira */}
      <Card3D
        disabled
        initial={{ opacity: 0, y: 20, rotateX: 4, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  rotateX: 0, scale: 1    }}
        transition={{ delay: 0.1, duration: 0.5, ease: EASE_OUT_EXPO }}
        style={{ transformPerspective: 900 }}
        glow="rgba(229,26,75,0.1)"
        intensity={3}
        className="bg-[var(--card-bg)] border border-border/70 rounded-xl overflow-hidden"
        whileHover={{ y: -2 }}
      >
        {isLoading && (
          <div className="px-5 py-14 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary-700 mx-auto" />
          </div>
        )}
        {isError && (
          <div className="px-5 py-14 text-center">
            <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-red-500 mb-3">No se pudo cargar el registro de errores.</p>
            <button onClick={() => refetch()} className="text-xs font-semibold text-primary-700 hover:text-primary-900 transition-colors">
              Reintentar
            </button>
          </div>
        )}
        {!isLoading && !isError && todosErrores.length === 0 && (
          <div className="px-5 py-14 text-center">
            <ShieldCheck className="w-8 h-8 text-primary-400 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-text-muted">Sin errores registrados</p>
          </div>
        )}
        {!isLoading && !isError && todosErrores.length > 0 && filtrados.length === 0 && (
          <div className="px-5 py-14 text-center text-sm text-text-muted">
            {query ? `Ningún error coincide con "${query}"` : 'Ningún error coincide con este filtro'}
          </div>
        )}
        {errores.map((e) => (
          <Fragment key={e.id}>
            <ErrorRow
              e={e}
              expanded={expandido === e.id}
              onToggle={() => setExpandido(expandido === e.id ? null : e.id)}
              onCambiarEstado={(id, estado) => actualizarEstado.mutate({ id, estado })}
              puedeEditar={puedeEditar}
              actualizandoEstado={actualizarEstado.isPending && actualizarEstado.variables?.id === e.id}
            />
          </Fragment>
        ))}
        {/* Pagination */}
        {!isLoading && !isError && errores.length > 0 && (
          <div className="px-5 py-3 border-t border-border bg-bg-alt/30 flex items-center justify-between">
            <span className="text-xs text-text-muted">
              Página {page} de {totalPages} · {total} errores total
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
        )}
      </Card3D>
    </div>
  )
}
