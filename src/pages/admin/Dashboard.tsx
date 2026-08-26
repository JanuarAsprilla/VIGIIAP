/* Hallmark · macrostructure: Workbench · genre: admin-dashboard
 * tokens: design.md · stamp: 2026-05-25
 */
import { useState } from 'react'
import type { SolicitudData } from '@/hooks/useSolicitudes'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Users, ClipboardList, FileText, Eye,
  TrendingUp, TrendingDown, CheckCircle, XCircle,
  ArrowRight, Zap, AlertTriangle,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { fadeUpSm, staggerContainer, staggerItem3D } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'
import { useAdminStats } from '@/hooks/useStats'
import { useSolicitudesAdmin, useUpdateEstadoSolicitud } from '@/hooks/useSolicitudes'
import { useUsuariosList } from '@/hooks/useUsuarios'
import api from '@/lib/api'
import { formatDate } from '@/lib/dateUtils'
import { ROLES } from '@/lib/constants/roles'

const fadeUp = fadeUpSm

const KPI_ICONS = [Users, ClipboardList, FileText, Eye]

// ── KPI Cards — 3D tilt ──
const KPI_GLOW = [
  'rgba(26,86,50,0.22)',
  'rgba(249,115,22,0.20)',
  'rgba(247,172,66,0.22)',
  'rgba(0,152,70,0.20)',
  'rgba(56,189,248,0.18)',
]

interface DashboardStats {
  documentos: number
  solicitudesPendientes: number
  [key: string]: unknown
}

function KPICards({ stats, isLoading }: { stats: DashboardStats | undefined; isLoading: boolean }) {
  const kpis = [
    { label: 'Usuarios Registrados',   value: (stats?.usuarios as number | undefined) ?? '—',            trendUp: true  },
    { label: 'Solicitudes Pendientes', value: stats?.solicitudesPendientes ?? '—', trendUp: false },
    { label: 'Documentos Activos',     value: stats?.documentos ?? '—',            trendUp: true  },
    { label: 'Visitantes (30 días)',   value: (stats?.visitantesUltimos30d as number | undefined) ?? '—', trendUp: true  },
  ]
  return (
    <motion.div
      variants={staggerContainer(0.07, 0.05)}
      initial="initial"
      animate="animate"
      className="grid grid-cols-2 sm:grid-cols-4 gap-4"
    >
      {kpis.map((kpi, i) => {
        const Icon = KPI_ICONS[i]
        return (
          <motion.div key={kpi.label} variants={staggerItem3D}>
            <Card3D
              glow={KPI_GLOW[i]}
              intensity={4}
              className="bg-white border border-border/70 rounded-xl p-5 relative overflow-hidden"
              whileHover={{ y: -3 }}
            >
              {/* Subtle corner glow */}
              <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full opacity-30 pointer-events-none"
                style={{ background: `radial-gradient(circle, ${KPI_GLOW[i]} 0%, transparent 70%)` }} />

              <div className="flex items-start justify-between mb-3 relative">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary-700" aria-hidden="true" />
                </div>
                <span className={`inline-flex items-center gap-1 text-[0.65rem] font-semibold ${kpi.trendUp ? 'text-green-600' : 'text-orange-500'}`}>
                  {kpi.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                </span>
              </div>
              <div className="tabular font-display text-3xl font-bold text-text relative">
                {isLoading
                  ? <span className="inline-block w-10 h-7 bg-bg-alt rounded animate-pulse" />
                  : kpi.value}
              </div>
              <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">{kpi.label}</p>
            </Card3D>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

// ── Gráfico de Solicitudes por Estado ──
function SolicitudesChart({ solicitudes }: { solicitudes: SolicitudData[] }) {
  const estados = [
    { label: 'Pendiente',   color: 'bg-gold-500',    textColor: 'text-gold-500'    },
    { label: 'En Revisión', color: 'bg-primary-500', textColor: 'text-primary-500' },
    { label: 'Aprobado',    color: 'bg-primary-700', textColor: 'text-primary-700' },
    { label: 'Rechazado',   color: 'bg-red',         textColor: 'text-red-dark'    },
  ]
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

  return (
    <motion.div {...fadeUp(0.28)} className="bg-white border border-border rounded-xl p-5">
      <h3 className="text-sm font-bold text-text mb-4">Solicitudes por Estado</h3>

      {/* Bar chart */}
      <div className="flex items-end gap-3 mb-4 h-24">
        {bars.map((b) => (
          <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
            <span className={`text-xs font-bold ${b.textColor}`}>{b.count}</span>
            <div className="w-full flex items-end justify-center" style={{ height: '60px' }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(b.count / maxCount) * 60}px` }}
                transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={`w-full rounded-t-lg ${b.color}`}
              />
            </div>
            <span className="text-[0.55rem] font-semibold text-text-muted text-center leading-tight">{b.label}</span>
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
                initial={{ height: 0 }}
                animate={{ height: `${(v / weeklyMax) * 40}px` }}
                transition={{ duration: 0.6, delay: 0.4 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
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
function AlertasSolicitudes({ solicitudes }: { solicitudes: SolicitudData[] }) {
  const pendientes = solicitudes.filter((s) => s.estado === 'Pendiente' || s.estado === 'En Revisión')
  if (pendientes.length === 0) return null
  return (
    <motion.div {...fadeUp(0.15)} className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800">
          {pendientes.length} solicitud{pendientes.length > 1 ? 'es' : ''} pendiente{pendientes.length > 1 ? 's' : ''} de respuesta
        </p>
        <p className="text-xs text-amber-700 mt-0.5">Revisa y asigna revisor en Gestión de Solicitudes</p>
      </div>
      <Link to="/admin/solicitudes" className="shrink-0 text-xs font-bold text-amber-800 hover:text-amber-900 no-underline flex items-center gap-1 whitespace-nowrap">
        Ver <ArrowRight className="w-3 h-3" />
      </Link>
    </motion.div>
  )
}

// ── Distribución de roles ──
const ROLE_CHART_ITEMS: { label: string; color: string }[] = [
  { label: ROLES.ADMIN,         color: 'bg-primary-800' },
  { label: ROLES.INVESTIGADOR,  color: 'bg-primary-500' },
  { label: ROLES.TECNICO,       color: 'bg-gold-500'    },
  { label: ROLES.INSTITUCIONAL, color: 'bg-primary-300' },
  { label: ROLES.PUBLICO,       color: 'bg-primary-200' },
]

function RolesChart({ usuarios }: { usuarios: { rol: string }[] }) {
  const counts = usuarios.reduce<Record<string, number>>((acc, u) => {
    acc[u.rol] = (acc[u.rol] || 0) + 1
    return acc
  }, {})
  const total = usuarios.length
  const items = ROLE_CHART_ITEMS.map((r) => ({ ...r, count: counts[r.label] || 0 }))

  return (
    <motion.div {...fadeUp(0.3)} className="bg-white border border-border rounded-xl p-5">
      <h3 className="text-sm font-bold text-text mb-4">Distribución de Roles</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-muted">{item.label}</span>
              <span className="text-xs font-bold text-text">{item.count}</span>
            </div>
            <div className="w-full h-2 bg-bg-alt rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.count / total) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={`h-full rounded-full ${item.color}`}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-text-muted mt-3 text-right">{total} usuarios registrados</p>
    </motion.div>
  )
}

// ── Solicitudes pendientes ──
function SolicitudesPendientes({ solicitudes }: { solicitudes: SolicitudData[] }) {
  const pendientes   = solicitudes.filter((s) => s.estado === 'Pendiente' || s.estado === 'En Revisión')
  const updateEstado = useUpdateEstadoSolicitud()
  const [confirm, setConfirm] = useState<{ _id: string; accion: 'Aprobado' | 'Rechazado' } | null>(null)

  const doAction = async (_id: string, accion: 'Aprobado' | 'Rechazado') => {
    await updateEstado.mutateAsync({ id: _id, estado: accion })
    setConfirm(null)
  }

  return (
    <motion.div {...fadeUp(0.2)} className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="text-sm font-bold text-text">Solicitudes Pendientes</h3>
        <Link to="/admin/solicitudes" className="text-xs font-semibold text-primary-800 hover:text-primary-600 no-underline flex items-center gap-1">
          Ver todas <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-border">
        {pendientes.length === 0 && (
          <p className="px-5 py-6 text-sm text-text-muted text-center">Sin solicitudes pendientes</p>
        )}
        {pendientes.map((sol) => {
          const isConfirming = confirm?._id === sol._id
          const isPending    = updateEstado.isPending && isConfirming
          return (
            <div key={sol.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-bg-alt/40 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-primary-800">{sol.id}</p>
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
                      className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                      title="Aprobar"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirm({ _id: sol._id, accion: 'Rechazado' })}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
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

// ── Actividad reciente ──
interface AuditLogRaw {
  id: string
  usuario_email?: string | null
  descripcion?: string | null
  accion?: string | null
  modulo: string
  creado_en: string
}
type AuditListResult = { data: AuditLogRaw[] }

function ActividadReciente() {
  const { data } = useQuery<AuditListResult, Error, AuditLogRaw[]>({
    queryKey: ['audit', 'recent'],
    queryFn: () => api.get('/admin/audit', { params: { limit: 7, page: 1 } }) as Promise<AuditListResult>,
    select: (res) => res.data ?? [],
    staleTime: 30_000,
  })
  const logs = data ?? []

  const moduloBadge = (modulo: string) => {
    const map = {
      auth: 'bg-primary-500/12 text-primary-500',
      admin: 'bg-primary-100 text-primary-800',
      solicitudes: 'bg-gold-400/12 text-gold-400',
      mapas: 'bg-primary-700/10 text-primary-700',
      documentos: 'bg-gold-500/12 text-gold-500',
    }
    return (map as Record<string, string>)[modulo] ?? 'bg-gray-100 text-gray-600'
  }

  return (
    <motion.div {...fadeUp(0.25)} className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="text-sm font-bold text-text">Actividad Reciente</h3>
        <Link to="/admin/actividad" className="text-xs font-semibold text-primary-800 hover:text-primary-600 no-underline flex items-center gap-1">
          Ver todo <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-border max-h-64 overflow-y-auto">
        {logs.length === 0 && (
          <p className="px-5 py-6 text-xs text-text-muted text-center italic">Sin actividad registrada</p>
        )}
        {logs.map((log) => {
          const initials = (log.usuario_email ?? '?').slice(0, 2).toUpperCase()
          return (
            <div key={log.id} className="flex items-start gap-3 px-5 py-3 hover:bg-bg-alt/40 transition-colors">
              <div className="w-7 h-7 bg-gradient-to-br from-primary-600 to-primary-900 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-white text-[0.6rem] font-bold">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text truncate">{log.descripcion ?? log.accion}</p>
                <p className="text-[0.65rem] text-text-muted mt-0.5">
                  {log.usuario_email ?? '—'} · {formatDate(log.creado_en)}
                </p>
              </div>
              <span className={`text-[0.55rem] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0 ${moduloBadge(log.modulo)}`}>
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

function QuickActions() {
  const actions = [
    { label: 'Nuevo Usuario',    to: '/admin/usuarios',    icon: Users,        color: 'from-[#D4A373] to-[#B8860B]'    },
    { label: 'Ver Solicitudes',  to: '/admin/solicitudes', icon: ClipboardList,color: 'from-primary-500 to-primary-700' },
    { label: 'Gestionar Docs',   to: '/admin/documentos',  icon: FileText,     color: 'from-magenta to-red-dark'        },
    { label: 'Ver Actividad',    to: '/admin/actividad',   icon: Zap,          color: 'from-orange-400 to-orange-600'   },
  ]
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
              glow={QA_GLOW[i]}
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

export default function Dashboard() {
  const { user } = useAuth()
  const { data: stats, isLoading: loadingStats } = useAdminStats()
  const { data: solData } = useSolicitudesAdmin({ limit: 100 })
  const { data: usrData } = useUsuariosList({ limit: 100 })
  const solicitudes = solData?.data ?? []
  const usuarios    = usrData?.data ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp(0)}>
        <span className="text-[0.7rem] font-bold uppercase tracking-widest text-primary-700">
          Panel de Control
        </span>
        <h1 className="font-display text-3xl font-bold text-text mt-1">
          Bienvenido, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Resumen general del sistema VIGIA-IIAP · {new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}
        </p>
      </motion.div>

      {/* KPIs */}
      <KPICards stats={stats} isLoading={loadingStats} />

      {/* Alerta solicitudes */}
      <AlertasSolicitudes solicitudes={solicitudes} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <SolicitudesPendientes solicitudes={solicitudes} />
          <ActividadReciente />
        </div>
        <div className="space-y-6">
          <RolesChart usuarios={usuarios} />
          <SolicitudesChart solicitudes={solicitudes} />
        </div>
      </div>
    </div>
  )
}
