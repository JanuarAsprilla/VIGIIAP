import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users, ClipboardList, FileText, Newspaper,
  TrendingUp, TrendingDown, CheckCircle, XCircle,
  ArrowRight, Zap, AlertTriangle,
} from 'lucide-react'
import {
  ADMIN_DASHBOARD_KPIS, ADMIN_ACTIVITY_LOG, SOLICITUDES_TABLE, ADMIN_MOCK_USERS,
} from '@/lib/constants'
import { useAuth } from '@/contexts/AuthContext'
import { fadeUpSm } from '@/lib/animations'

const fadeUp = fadeUpSm

const KPI_ICONS = [Users, ClipboardList, FileText, Newspaper]

// ── KPI Cards ──
function KPICards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {ADMIN_DASHBOARD_KPIS.map((kpi, i) => {
        const Icon = KPI_ICONS[i]
        return (
          <motion.div
            key={kpi.label}
            {...fadeUp(0.08 + i * 0.07)}
            className="bg-white border border-border rounded-xl p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl flex items-center justify-center">
                <Icon className="w-4.5 h-4.5 text-primary-700" aria-hidden="true" />
              </div>
              <span className={`inline-flex items-center gap-1 text-[0.65rem] font-semibold ${kpi.trendUp ? 'text-green-600' : 'text-orange-500'}`}>
                {kpi.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {kpi.trend}
              </span>
            </div>
            <div className="font-display text-3xl font-bold text-text">{kpi.value}</div>
            <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">{kpi.label}</p>
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Gráfico de Solicitudes por Estado ──
function SolicitudesChart() {
  const estados = [
    { label: 'En Proceso', color: 'bg-yellow-400', textColor: 'text-yellow-700', bg: 'bg-yellow-50' },
    { label: 'Aprobado',   color: 'bg-green-500',  textColor: 'text-green-700',  bg: 'bg-green-50'  },
    { label: 'Rechazado',  color: 'bg-red-400',    textColor: 'text-red-600',    bg: 'bg-red-50'    },
  ]
  const total = SOLICITUDES_TABLE.length
  const bars = estados.map((e) => ({
    ...e,
    count: SOLICITUDES_TABLE.filter((s) => s.estado === e.label).length,
  }))
  const maxCount = Math.max(...bars.map((b) => b.count), 1)

  // Simulated weekly trend (last 6 weeks)
  const weeklyData = [2, 4, 3, 6, 5, 8]
  const weeklyMax = Math.max(...weeklyData)

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
function AlertasSolicitudes() {
  const pendientes = SOLICITUDES_TABLE.filter((s) => s.estado === 'En Proceso')
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
function RolesChart() {
  const counts = ADMIN_MOCK_USERS.reduce((acc, u) => {
    acc[u.rol] = (acc[u.rol] || 0) + 1
    return acc
  }, {})
  const total = ADMIN_MOCK_USERS.length
  const items = [
    { label: 'Administrador SIG', count: counts['Administrador SIG'] || 0, color: 'bg-primary-800' },
    { label: 'Investigador',      count: counts['Investigador'] || 0,      color: 'bg-primary-500' },
    { label: 'Público',           count: counts['Público'] || 0,           color: 'bg-primary-200' },
  ]

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
function SolicitudesPendientes() {
  const pendientes = SOLICITUDES_TABLE.filter((s) => s.estado === 'En Proceso')

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
        {pendientes.map((sol) => (
          <div key={sol.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-bg-alt/40 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-primary-800">{sol.id}</p>
              <p className="text-sm font-semibold text-text truncate">{sol.tipo}</p>
              <p className="text-xs text-text-muted">{sol.subtipo} · {sol.fecha}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors" title="Aprobar">
                <CheckCircle className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Rechazar">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Actividad reciente ──
function ActividadReciente() {
  const typeStyles = {
    success: 'bg-green-100 text-green-700',
    error:   'bg-red-100 text-red-600',
    warning: 'bg-amber-100 text-amber-700',
    info:    'bg-primary-100 text-primary-700',
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
        {ADMIN_ACTIVITY_LOG.slice(0, 7).map((log) => (
          <div key={log.id} className="flex items-start gap-3 px-5 py-3 hover:bg-bg-alt/40 transition-colors">
            <div className="w-7 h-7 bg-gradient-to-br from-primary-600 to-primary-900 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-white text-[0.6rem] font-bold">{log.initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text truncate">
                {log.accion}{log.detalle ? `: ${log.detalle}` : ''}
              </p>
              <p className="text-[0.65rem] text-text-muted mt-0.5">
                {log.usuario} · {log.hora} · {log.modulo}
              </p>
            </div>
            <span className={`text-[0.55rem] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0 ${typeStyles[log.tipo]}`}>
              {log.tipo}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Quick Actions ──
function QuickActions() {
  const actions = [
    { label: 'Nueva Noticia',    to: '/admin/noticias',    icon: Newspaper,    color: 'from-primary-700 to-primary-900' },
    { label: 'Nuevo Usuario',    to: '/admin/usuarios',    icon: Users,        color: 'from-gold-400 to-gold-500'       },
    { label: 'Ver Solicitudes',  to: '/admin/solicitudes', icon: ClipboardList,color: 'from-primary-500 to-primary-700' },
    { label: 'Ver Actividad',    to: '/admin/actividad',   icon: Zap,          color: 'from-orange-400 to-orange-600'   },
  ]
  return (
    <motion.div {...fadeUp(0.35)} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map((a) => (
        <Link key={a.label} to={a.to} className="no-underline">
          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400 }}
            className={`bg-gradient-to-br ${a.color} rounded-xl p-4 text-center cursor-pointer`}
          >
            <a.icon className="w-5 h-5 text-white mx-auto mb-2" aria-hidden="true" />
            <p className="text-xs font-bold text-white">{a.label}</p>
          </motion.div>
        </Link>
      ))}
    </motion.div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()

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
          Resumen general del sistema VIGIIAP · {new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}
        </p>
      </motion.div>

      {/* KPIs */}
      <KPICards />

      {/* Alerta solicitudes */}
      <AlertasSolicitudes />

      {/* Quick Actions */}
      <QuickActions />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <SolicitudesPendientes />
          <ActividadReciente />
        </div>
        <div className="space-y-6">
          <RolesChart />
          <SolicitudesChart />
        </div>
      </div>
    </div>
  )
}
