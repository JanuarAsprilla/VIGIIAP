import { useState } from 'react'
import type { SolicitudData } from '@/hooks/useSolicitudes'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users, ClipboardList, FileText, Map as MapIcon,
  CheckCircle, XCircle,
  ArrowRight, Zap, AlertTriangle, ShieldQuestion, type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { puedeVerModulo } from '@/lib/permisosModulo'
import type { ModuloClave } from '@/lib/constants/modulos'
import { fadeUpSm, staggerContainer, staggerItem3D } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'
import Sparkline from '@/components/ui/Sparkline'
import DeltaBadge from '@/components/ui/DeltaBadge'
import {
  useAdminStats, useDashboardTendencias,
  type AdminStats, type TendenciaKPI, type DashboardTendencias,
} from '@/hooks/useStats'
import {
  useSolicitudesAdmin, useUpdateEstadoSolicitud,
  ESTADO_LABEL, ESTADO_COLOR,
} from '@/hooks/useSolicitudes'
import { useUsuariosList } from '@/hooks/useUsuarios'
import { useAuditLog, MODULO_STYLES } from '@/hooks/useAuditLog'
import { ROLES } from '@/lib/constants/roles'

const fadeUp = fadeUpSm

interface KpiDef {
  label: string
  value: number | undefined
  /** KPI de tendencias.ts correspondiente a este valor (ninguno para snapshots sin flujo, como visitantes). */
  tendencia: TendenciaKPI | undefined
  /** Cómo nombrar la cifra de flujo semanal debajo del valor — ej. "nuevos", "publicados". */
  flowLabel: string
  /** Módulo del panel al que pertenece esta cifra — un admin_sig sin permiso de "ver" sobre él no debe verla. */
  modulo: ModuloClave
  icon: LucideIcon
}

function KPICards({
  stats, isLoading, tendencias, tendenciasLoading, user,
}: {
  stats: AdminStats | undefined
  isLoading: boolean
  tendencias: DashboardTendencias | undefined
  tendenciasLoading: boolean
  user: ReturnType<typeof useAuth>['user']
}) {
  const todos: KpiDef[] = [
    { label: 'Usuarios Registrados',   value: stats?.usuarios,              tendencia: tendencias?.usuarios,    flowLabel: 'nuevos',     modulo: 'usuarios',    icon: Users },
    { label: 'Solicitudes Pendientes', value: stats?.solicitudesPendientes, tendencia: tendencias?.solicitudes, flowLabel: 'nuevas',     modulo: 'solicitudes', icon: ClipboardList },
    { label: 'Documentos Activos',     value: stats?.documentos,            tendencia: tendencias?.documentos,  flowLabel: 'publicados', modulo: 'documentos',  icon: FileText },
    { label: 'Mapas Publicados',       value: stats?.mapasPublicados,       tendencia: tendencias?.mapas,       flowLabel: 'publicados', modulo: 'mapas',       icon: MapIcon },
  ]
  const kpis = todos.filter((kpi) => puedeVerModulo(user, kpi.modulo))
  if (kpis.length === 0) return null
  return (
    <motion.div
      variants={staggerContainer(0.07, 0.05)}
      initial="initial"
      animate="animate"
      className="grid grid-cols-2 sm:grid-cols-4 gap-4"
    >
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        const dotColor = !kpi.tendencia || kpi.tendencia.deltaPct === 0
          ? 'var(--stats-value)'
          : kpi.tendencia.deltaPct > 0 ? 'var(--color-primary-600)' : 'var(--color-orange-500)'
        return (
          <motion.div key={kpi.label} variants={staggerItem3D}>
            <Card3D
              glow="var(--stats-border)"
              intensity={4}
              className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-5 relative overflow-hidden"
              whileHover={{ y: -3 }}
            >
              {/* Subtle corner glow — tono único de la identidad de stats */}
              <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, var(--stats-bg) 0%, transparent 70%)' }} />

              <div className="flex items-start justify-between mb-3 relative">
                <div className="w-9 h-9 bg-[var(--stats-bg)] border border-[var(--stats-border)] rounded-xl flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[var(--stats-value)]" aria-hidden="true" />
                </div>
                {kpi.tendencia && <DeltaBadge pct={kpi.tendencia.deltaPct} />}
              </div>
              <div className="tabular font-display text-3xl font-bold text-text relative">
                {isLoading
                  ? <span className="inline-block w-10 h-7 bg-bg-alt rounded animate-pulse" />
                  : (kpi.value ?? '—')}
              </div>
              <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">{kpi.label}</p>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60 relative">
                {tendenciasLoading ? (
                  <span className="inline-block w-24 h-3 bg-bg-alt rounded animate-pulse" />
                ) : kpi.tendencia ? (
                  <>
                    <span className="text-[0.68rem] text-text-muted">
                      <span className="font-semibold text-text">{kpi.tendencia.semanaActual}</span> {kpi.flowLabel} esta semana
                    </span>
                    <Sparkline data={kpi.tendencia.serie7} endColor={dotColor} />
                  </>
                ) : (
                  <span className="text-[0.68rem] text-text-faint">Sin datos de tendencia</span>
                )}
              </div>
            </Card3D>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

// ── Gráfico de Solicitudes por Estado ──
// Colores por clave semántica — misma paleta que StatusBadge (src/pages/solicitudes/StatusBadge.tsx)
const ESTADO_BAR_STYLE: Record<string, { bar: string; text: string }> = {
  orange: { bar: 'bg-gold-500',    text: 'text-gold-500'    },
  blue:   { bar: 'bg-primary-500', text: 'text-primary-500' },
  green:  { bar: 'bg-primary-700', text: 'text-primary-700' },
  red:    { bar: 'bg-red',         text: 'text-red-dark'    },
  teal:   { bar: 'bg-accent',      text: 'text-primary-800' },
  yellow: { bar: 'bg-gold-400',    text: 'text-gold-400'    },
}

function SolicitudesChart({ solicitudes, isError, onRetry }: { solicitudes: SolicitudData[]; isError: boolean; onRetry: () => void }) {
  // Estados derivados de ESTADO_LABEL (fuente de verdad) — así las barras siempre suman el total mostrado
  const estados = Array.from(new Set(Object.values(ESTADO_LABEL))).map((label) => {
    const colorKey = ESTADO_COLOR[label] ?? 'yellow'
    return { label, ...(ESTADO_BAR_STYLE[colorKey] ?? ESTADO_BAR_STYLE.yellow) }
  })
  const total = solicitudes.length
  const bars = estados.map((e) => ({
    ...e,
    count: solicitudes.filter((s) => s.estado === e.label).length,
  }))
  const maxCount = Math.max(...bars.map((b) => b.count), 1)

  // Tendencia semanal real — últimas 6 semanas
  const weeklyData = Array(6).fill(0)
  const msPerWeek  = 7 * 24 * 60 * 60 * 1000
  // Bucketing aproximado por semana — la impureza de Date.now() aquí es intencional
  // y de bajo riesgo (a lo sumo desplaza un registro de bucket en un doble-render de StrictMode).
  // eslint-disable-next-line react-hooks/purity
  const now        = Date.now()
  solicitudes.forEach((s) => {
    if (!s.creadoEn) return
    const diffWeeks = Math.floor((now - new Date(s.creadoEn).getTime()) / msPerWeek)
    const idx = 5 - diffWeeks   // 5 = esta semana, 0 = hace 5 semanas
    if (idx >= 0 && idx <= 5) weeklyData[idx]++
  })
  const weeklyMax = Math.max(...weeklyData, 1)

  if (isError) {
    return (
      <motion.div {...fadeUp(0.28)} className="bg-[var(--card-bg)] border border-border rounded-xl p-5 text-center">
        <h3 className="text-sm font-bold text-text mb-3">Solicitudes por Estado</h3>
        <p className="text-xs text-red-500 mb-2">No se pudo cargar la información.</p>
        <button onClick={onRetry} className="text-xs font-semibold text-primary-700 hover:text-primary-900 transition-colors">
          Reintentar
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div {...fadeUp(0.28)} className="bg-[var(--card-bg)] border border-border rounded-xl p-5">
      <h3 className="text-sm font-bold text-text mb-4">Solicitudes por Estado</h3>

      {/* Bar chart */}
      <div className="flex items-end gap-2 mb-4 h-24">
        {bars.map((b) => (
          <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
            <span className={`text-xs font-bold ${b.text}`}>{b.count}</span>
            <div className="w-full flex items-end justify-center" style={{ height: '60px' }}>
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: b.count / maxCount }}
                transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: 'bottom', height: '60px' }}
                className={`w-full rounded-t-lg ${b.bar}`}
              />
            </div>
            <span className="text-[0.52rem] font-semibold text-text-muted text-center leading-tight">{b.label}</span>
          </div>
        ))}
      </div>

      <hr className="border-border mb-4" />

      {/* Weekly sparkline */}
      <div>
        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-2">Tendencia — últimas 6 semanas</p>
        <div className="flex items-end gap-1.5 h-10">
          {weeklyData.map((v, i) => (
            <div key={i} className="flex-1 flex items-end" style={{ height: '40px' }}>
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: v / weeklyMax }}
                transition={{ duration: 0.6, delay: 0.4 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: 'bottom', height: '40px' }}
                className={`w-full rounded-sm ${i === weeklyData.length - 1 ? 'bg-primary-800' : 'bg-primary-200'}`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[0.55rem] text-text-muted">Sem 1</span>
          <span className="text-[0.55rem] text-text-muted">Hoy</span>
        </div>
      </div>

      <p className="text-xs text-text-muted mt-3 text-right">{total} solicitudes en total</p>
    </motion.div>
  )
}

// ── Alertas — solicitudes sin atender ──
function AlertasSolicitudes({ solicitudes, isError, onRetry }: { solicitudes: SolicitudData[]; isError: boolean; onRetry: () => void }) {
  if (isError) {
    return (
      <motion.div {...fadeUp(0.15)} className="flex items-center justify-between gap-3 px-4 py-3 bg-red/10 border border-red/25 rounded-xl text-sm text-red-dark">
        <span>No se pudieron cargar las solicitudes pendientes.</span>
        <button onClick={onRetry} className="text-xs font-semibold underline shrink-0">Reintentar</button>
      </motion.div>
    )
  }
  const pendientes = solicitudes.filter((s) => s.estado === 'Pendiente' || s.estado === 'En Revisión')
  if (pendientes.length === 0) return null
  return (
    <motion.div {...fadeUp(0.15)} className="flex items-start gap-3 px-4 py-3 bg-gold-500/10 border border-gold-500/25 rounded-xl">
      <AlertTriangle className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gold-500">
          {pendientes.length} solicitud{pendientes.length > 1 ? 'es' : ''} pendiente{pendientes.length > 1 ? 's' : ''} de respuesta
        </p>
        <p className="text-xs text-gold-400 mt-0.5">Revisa y asigna revisor en Gestión de Solicitudes</p>
      </div>
      <Link to="/admin/solicitudes" className="shrink-0 text-xs font-bold text-gold-500 hover:text-gold-400 no-underline flex items-center gap-1 whitespace-nowrap">
        Ver <ArrowRight className="w-3 h-3" />
      </Link>
    </motion.div>
  )
}

// ── Distribución de roles ──
// Mismo subconjunto asignable que Usuarios.tsx (excluye Super Admin y Visitante,
// que no aparecen como filas gestionables en esa página) — así el total siempre cuadra.
const ROLES_CHART_ORDER = [ROLES.ADMIN, ROLES.INVESTIGADOR, ROLES.TECNICO, ROLES.INSTITUCIONAL, ROLES.PUBLICO]
const ROLE_BAR_COLOR: Record<string, string> = {
  [ROLES.ADMIN]:         'bg-primary-800',
  [ROLES.INVESTIGADOR]:  'bg-primary-500',
  [ROLES.TECNICO]:       'bg-gold-400',
  [ROLES.INSTITUCIONAL]: 'bg-magenta',
  [ROLES.PUBLICO]:       'bg-primary-200',
}

function RolesChart({ usuarios, isError, onRetry }: { usuarios: { rol: string }[]; isError: boolean; onRetry: () => void }) {
  const counts = usuarios.reduce<Record<string, number>>((acc, u) => {
    acc[u.rol] = (acc[u.rol] || 0) + 1
    return acc
  }, {})
  const total = usuarios.length
  const items = ROLES_CHART_ORDER.map((label) => ({
    label,
    count: counts[label] || 0,
    color: ROLE_BAR_COLOR[label],
  }))

  if (isError) {
    return (
      <motion.div {...fadeUp(0.3)} className="bg-[var(--card-bg)] border border-border rounded-xl p-5 text-center">
        <h3 className="text-sm font-bold text-text mb-3">Distribución de Roles</h3>
        <p className="text-xs text-red-500 mb-2">No se pudo cargar la información.</p>
        <button onClick={onRetry} className="text-xs font-semibold text-primary-700 hover:text-primary-900 transition-colors">
          Reintentar
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div {...fadeUp(0.3)} className="bg-[var(--card-bg)] border border-border rounded-xl p-5">
      <h3 className="text-sm font-bold text-text mb-4">Distribución de Roles</h3>
      <div className="space-y-3">
        {items.map((item) => {
          const pct = total > 0 ? item.count / total : 0
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-text-muted">{item.label}</span>
                <span className="text-xs font-bold text-text">{item.count}</span>
              </div>
              <div className="w-full h-2 bg-bg-alt rounded-full overflow-hidden">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: pct }}
                  transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformOrigin: 'left', width: '100%' }}
                  className={`h-full rounded-full ${item.color}`}
                />
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-text-muted mt-3 text-right">{total} usuarios registrados</p>
    </motion.div>
  )
}

// ── Solicitudes pendientes ──
function SolicitudesPendientes({ solicitudes, isError, onRetry }: { solicitudes: SolicitudData[]; isError: boolean; onRetry: () => void }) {
  const pendientes   = solicitudes.filter((s) => s.estado === 'Pendiente' || s.estado === 'En Revisión')
  const updateEstado = useUpdateEstadoSolicitud()
  const [confirm, setConfirm] = useState<{ _id: string; accion: 'Aprobado' | 'Rechazado' } | null>(null)

  const doAction = async (_id: string, accion: 'Aprobado' | 'Rechazado') => {
    await updateEstado.mutateAsync({ id: _id, estado: accion })
    setConfirm(null)
  }

  return (
    <motion.div {...fadeUp(0.2)} className="bg-[var(--card-bg)] border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="text-sm font-bold text-text">Solicitudes Pendientes</h3>
        <Link to="/admin/solicitudes" className="text-xs font-semibold text-primary-800 hover:text-primary-600 no-underline flex items-center gap-1">
          Ver todas <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-border">
        {isError && (
          <div className="px-5 py-6 text-center">
            <p className="text-xs text-red-500 mb-2">No se pudieron cargar las solicitudes.</p>
            <button onClick={onRetry} className="text-xs font-semibold text-primary-700 hover:text-primary-900 transition-colors">
              Reintentar
            </button>
          </div>
        )}
        {!isError && pendientes.length === 0 && (
          <p className="px-5 py-6 text-sm text-text-muted text-center">Sin solicitudes pendientes</p>
        )}
        {!isError && pendientes.map((sol) => {
          const isConfirming = confirm?._id === sol._id
          const isPending    = updateEstado.isPending && isConfirming
          const dias        = sol.diasPendiente
          const diasLabel   = dias <= 0 ? 'Hoy' : `Hace ${dias} día${dias === 1 ? '' : 's'}`
          const diasUrgent  = dias >= 7
          return (
            <div key={sol.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-bg-alt/40 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-primary-800">{sol.id}</p>
                  <span className={`text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${diasUrgent ? 'bg-red/10 text-red-dark' : 'bg-bg-alt text-text-muted'}`}>
                    {diasLabel}
                  </span>
                </div>
                <p className="text-sm font-semibold text-text truncate">{sol.tipo}</p>
                <p className="text-xs text-text-muted">{sol.subtipo} · {sol.fecha}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isConfirming ? (
                  <>
                    <span className="text-xs text-text-muted mr-1">
                      {confirm!.accion === 'Aprobado' ? '¿Aprobar?' : '¿Rechazar?'}
                    </span>
                    <button
                      onClick={() => doAction(sol._id, confirm!.accion)}
                      disabled={isPending}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {isPending ? '…' : 'Sí'}
                    </button>
                    <button
                      onClick={() => setConfirm(null)}
                      disabled={isPending}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-bg-alt text-text-muted hover:bg-border transition-colors"
                    >
                      No
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setConfirm({ _id: sol._id, accion: 'Aprobado' })}
                      className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-500/10 transition-colors"
                      title="Aprobar"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirm({ _id: sol._id, accion: 'Rechazado' })}
                      className="p-1.5 rounded-lg text-red-dark hover:bg-red/10 transition-colors"
                      title="Rechazar"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ── Actividad reciente — reusa src/hooks/useAuditLog.ts, mismo hook que Actividad.tsx ──
function ActividadReciente({ enabled }: { enabled: boolean }) {
  const { data, isLoading, isError, refetch } = useAuditLog({ limit: 7, page: 1 }, enabled)
  const logs = data?.data ?? []

  return (
    <motion.div {...fadeUp(0.25)} className="bg-[var(--card-bg)] border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="text-sm font-bold text-text">Actividad Reciente</h3>
        <Link to="/admin/actividad" className="text-xs font-semibold text-primary-800 hover:text-primary-600 no-underline flex items-center gap-1">
          Ver todo <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-border max-h-64 overflow-y-auto">
        {isLoading && (
          <p className="px-5 py-6 text-xs text-text-muted text-center">Cargando…</p>
        )}
        {isError && (
          <div className="px-5 py-6 text-center">
            <p className="text-xs text-red-500 mb-2">No se pudo cargar la actividad reciente.</p>
            <button onClick={() => refetch()} className="text-xs font-semibold text-primary-700 hover:text-primary-900 transition-colors">
              Reintentar
            </button>
          </div>
        )}
        {!isLoading && !isError && logs.length === 0 && (
          <p className="px-5 py-6 text-xs text-text-muted text-center italic">Sin actividad registrada</p>
        )}
        {logs.map((log) => {
          const initials = (log.email !== '—' ? log.email : '?').slice(0, 2).toUpperCase()
          return (
            <div key={log.id} className="flex items-start gap-3 px-5 py-3 hover:bg-bg-alt/40 transition-colors">
              <div className="w-7 h-7 bg-gradient-to-br from-primary-600 to-primary-900 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-white text-[0.6rem] font-bold">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text truncate">{log.descripcion || log.accionLabel}</p>
                <p className="text-[0.65rem] text-text-muted mt-0.5">
                  {log.email} · {log.fecha}
                </p>
              </div>
              <span className={`text-[0.55rem] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0 ${MODULO_STYLES[log.modulo] ?? 'bg-bg-alt text-text-muted'}`}>
                {log.modulo}
              </span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ── Quick Actions — 3D ──
const QA_GLOW = [
  'rgba(26,86,50,0.35)',
  'rgba(212,163,115,0.35)',
  'rgba(33,136,66,0.30)',
  'rgba(249,115,22,0.32)',
]

function QuickActions({ user }: { user: ReturnType<typeof useAuth>['user'] }) {
  const todas = [
    { label: 'Nuevo Usuario',    to: '/admin/usuarios',    icon: Users,        color: 'from-[#D4A373] to-[#B8860B]',     modulo: 'usuarios' as ModuloClave },
    { label: 'Ver Solicitudes',  to: '/admin/solicitudes', icon: ClipboardList,color: 'from-primary-500 to-primary-700', modulo: 'solicitudes' as ModuloClave },
    { label: 'Gestionar Docs',   to: '/admin/documentos',  icon: FileText,     color: 'from-magenta to-red-dark',        modulo: 'documentos' as ModuloClave },
    { label: 'Ver Actividad',    to: '/admin/actividad',   icon: Zap,          color: 'from-orange-400 to-orange-600',   modulo: 'actividad' as ModuloClave },
  ]
  const actions = todas.filter((a) => puedeVerModulo(user, a.modulo))
  if (actions.length === 0) return null
  return (
    <motion.div
      variants={staggerContainer(0.07, 0.3)}
      initial="initial"
      animate="animate"
      className="grid grid-cols-2 sm:grid-cols-4 gap-3"
    >
      {actions.map((a, i) => (
        <motion.div key={a.label} variants={staggerItem3D}>
          <Link to={a.to} className="no-underline block">
            <Card3D
              glow={QA_GLOW[i % QA_GLOW.length]}
              intensity={6}
              className={`bg-gradient-to-br ${a.color} rounded-xl p-4 text-center cursor-pointer relative overflow-hidden`}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            >
              {/* Dot grid */}
              <div className="absolute inset-0 opacity-[0.07]"
                style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
              <a.icon className="w-5 h-5 text-white mx-auto mb-2 relative" aria-hidden="true" />
              <p className="text-xs font-bold text-white relative">{a.label}</p>
            </Card3D>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}

// ── Sin módulos asignados — aviso explícito, no una pantalla en blanco ──
// Un admin_sig recién creado (o al que le quitaron todo el acceso) no debe
// llegar a un Dashboard vacío y pensar que algo se rompió: el mensaje deja
// claro que es su estado normal mientras no tenga módulos delegados.
function SinModulosAsignados() {
  return (
    <motion.div
      {...fadeUp(0.1)}
      className="flex flex-col items-center text-center gap-3 px-6 py-14 bg-[var(--card-bg)] border border-border/70 rounded-2xl"
    >
      <div className="w-12 h-12 bg-gold-500/10 rounded-full flex items-center justify-center">
        <ShieldQuestion className="w-6 h-6 text-gold-500" aria-hidden="true" />
      </div>
      <div className="max-w-md">
        <p className="text-sm font-bold text-text">Todavía no tienes ningún módulo asignado</p>
        <p className="text-sm text-text-muted mt-1">
          Esto no es un error — tu cuenta de Administrador SIG está activa, pero un Super Administrador
          aún no te ha delegado acceso a ninguna sección del panel. Pídele que te lo asigne desde
          Gestión de Administradores.
        </p>
      </div>
    </motion.div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()

  // Un admin_sig delegado solo trae permisos para el subconjunto de módulos
  // que le asignaron (ver GestionAdmins.tsx / admin_permisos_modulo en el
  // backend) -- super_admin y roles no-admin no tienen restricción aquí.
  const verUsuarios    = puedeVerModulo(user, 'usuarios')
  const verSolicitudes = puedeVerModulo(user, 'solicitudes')
  const verActividad   = puedeVerModulo(user, 'actividad')
  const esDelegado     = user?.rol === 'admin_sig'
  const modulosPropios = esDelegado ? (user?.modulos ?? []).filter((m) => m.puede_ver).length : null
  const sinModulos     = esDelegado && modulosPropios === 0

  const { data: stats, isLoading: loadingStats, isError: statsError, refetch: refetchStats } = useAdminStats()
  const { data: tendencias, isLoading: loadingTendencias } = useDashboardTendencias()
  const { data: solData, isError: solError, refetch: refetchSol } = useSolicitudesAdmin({ limit: 100 }, verSolicitudes)
  const { data: usrData, isError: usrError, refetch: refetchUsr } = useUsuariosList({ limit: 100 }, verUsuarios)
  const solicitudes = solData?.data ?? []
  const usuarios    = usrData?.data ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp(0)}>
        <span className="text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: 'var(--hero-eyebrow-text)' }}>
          Panel de Control
        </span>
        <h1 className="font-display text-3xl font-bold text-text mt-1">
          Bienvenido, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-text-muted mt-1">
          {esDelegado
            ? `Acceso delegado a ${modulosPropios} módulo${modulosPropios === 1 ? '' : 's'} del panel · ${new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}`
            : `Resumen general del sistema VIGIA-IIAP · ${new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}`}
        </p>
      </motion.div>

      {sinModulos ? (
        <SinModulosAsignados />
      ) : (
        <>
          {/* KPIs */}
          {statsError && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red/10 border border-red/25 rounded-xl text-sm text-red-dark">
              <span>No se pudieron cargar las estadísticas del panel.</span>
              <button onClick={() => refetchStats()} className="text-xs font-semibold underline shrink-0">Reintentar</button>
            </div>
          )}
          <KPICards
            stats={stats}
            isLoading={loadingStats}
            tendencias={tendencias}
            tendenciasLoading={loadingTendencias}
            user={user}
          />

          {/* Alerta solicitudes */}
          {verSolicitudes && <AlertasSolicitudes solicitudes={solicitudes} isError={solError} onRetry={refetchSol} />}

          {/* Quick Actions */}
          <QuickActions user={user} />

          {/* Main grid */}
          {(verSolicitudes || verActividad || verUsuarios) && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
              <div className="space-y-6">
                {verSolicitudes && <SolicitudesPendientes solicitudes={solicitudes} isError={solError} onRetry={refetchSol} />}
                {verActividad && <ActividadReciente enabled={verActividad} />}
              </div>
              <div className="space-y-6">
                {verUsuarios && <RolesChart usuarios={usuarios} isError={usrError} onRetry={refetchUsr} />}
                {verSolicitudes && <SolicitudesChart solicitudes={solicitudes} isError={solError} onRetry={refetchSol} />}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
