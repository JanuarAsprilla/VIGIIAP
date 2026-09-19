import { Fragment, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Loader2, AlertCircle, AlertTriangle, ChevronDown, ChevronUp,
  Search, Copy, Check, ServerCrash, Clock, Repeat2, ShieldCheck,
} from 'lucide-react'
import { fadeUpSm, EASE_OUT_EXPO } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'
import { useErrorLog, type ErrorLogData } from '@/hooks/useErrorLog'
import { timeAgo } from '@/lib/dateUtils'

const fadeUp = fadeUpSm
const PAGE_SIZE = 10

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

function ErrorRow({ e, expanded, onToggle }: { e: ErrorLogData; expanded: boolean; onToggle: () => void }) {
  const sev = severidad(e.statusCode)
  const metodoCls = METODO_COLOR[e.metodo] ?? 'bg-bg-alt text-text-muted'
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        disabled={!e.stack}
        aria-expanded={e.stack ? expanded : undefined}
        className="w-full flex items-start gap-3.5 px-5 py-4 text-left hover:bg-bg-alt/40 transition-colors disabled:cursor-default disabled:hover:bg-transparent"
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
        {e.stack && (
          <div className="text-text-muted shrink-0 mt-1.5">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        )}
      </button>
      {expanded && e.stack && (
        <div className="px-5 pb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted">Detalle técnico</span>
            <CopyButton text={e.stack} />
          </div>
          <pre className="text-xs font-mono text-text-muted bg-bg-alt/60 border border-border rounded-lg p-3 whitespace-pre-wrap break-all max-h-64 overflow-y-auto">{e.stack}</pre>
          <p className="text-[0.65rem] text-text-muted mt-2">
            Primera vez: {e.primeraVez} · Última vez: {e.ultimaVez}
          </p>
        </div>
      )}
    </div>
  )
}

export default function Errores() {
  const [page, setPage] = useState(1)
  const [expandido, setExpandido] = useState<number | null>(null)
  const [query, setQuery] = useState('')

  const { data, isLoading, isError, refetch } = useErrorLog({
    limit:  PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })

  const errores    = useMemo(() => data?.data ?? [], [data])
  const total      = data?.meta?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return errores
    return errores.filter((e) => e.mensaje.toLowerCase().includes(q) || e.ruta.toLowerCase().includes(q))
  }, [errores, query])

  // Resumen de esta página -- la paginación es del servidor, así que no
  // pretende ser un total global; en instalaciones pequeñas (como esta) la
  // primera página ya cubre todos los errores registrados.
  const resumen = useMemo(() => {
    if (errores.length === 0) return null
    const ocurrenciasTotales = errores.reduce((sum, e) => sum + e.ocurrencias, 0)
    const criticos = errores.filter((e) => e.statusCode >= 500).length
    const masFrecuente = errores.reduce((a, b) => (b.ocurrencias > a.ocurrencias ? b : a))
    return { ocurrenciasTotales, criticos, masFrecuente }
  }, [errores])

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
        <motion.div {...fadeUp(0.03)} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${resumen.criticos > 0 ? 'bg-red/10' : 'bg-primary-700/10'}`}>
              {resumen.criticos > 0
                ? <ServerCrash className="w-4 h-4 text-red-dark" aria-hidden="true" />
                : <ShieldCheck className="w-4 h-4 text-primary-700" aria-hidden="true" />}
            </div>
            <div>
              <p className="text-lg font-bold text-text leading-none">{resumen.criticos}</p>
              <p className="text-[0.65rem] text-text-muted mt-1">Críticos (5xx) en esta página</p>
            </div>
          </div>
          <div className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gold-500/10 flex items-center justify-center shrink-0">
              <Repeat2 className="w-4 h-4 text-gold-500" aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-bold text-text leading-none">{resumen.ocurrenciasTotales}</p>
              <p className="text-[0.65rem] text-text-muted mt-1">Ocurrencias totales en esta página</p>
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

      {/* Buscador */}
      {!isLoading && !isError && errores.length > 0 && (
        <motion.div {...fadeUp(0.05)} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
          <input type="text" aria-label="Buscar error por mensaje o endpoint" placeholder="Buscar por mensaje o endpoint…"
            value={query} onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
          />
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
        {!isLoading && !isError && errores.length === 0 && (
          <div className="px-5 py-14 text-center">
            <ShieldCheck className="w-8 h-8 text-primary-400 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-text-muted">Sin errores registrados</p>
          </div>
        )}
        {!isLoading && !isError && errores.length > 0 && filtrados.length === 0 && (
          <div className="px-5 py-14 text-center text-sm text-text-muted">
            Ningún error coincide con "{query}"
          </div>
        )}
        {filtrados.map((e) => (
          <Fragment key={e.id}>
            <ErrorRow e={e} expanded={expandido === e.id} onToggle={() => setExpandido(expandido === e.id ? null : e.id)} />
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
