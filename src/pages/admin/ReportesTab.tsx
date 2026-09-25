import { useState, type ComponentType } from 'react'
import { motion } from 'framer-motion'
import { Line, Bar } from 'react-chartjs-2'
import {
  Download, Loader2, AlertCircle, FileBarChart,
  UserPlus, UserCog, LogIn, ShieldAlert, Inbox, FileCheck, Clock, FileText, MapPin, Map as MapIcon,
} from 'lucide-react'
import { fadeUpSm, EASE_OUT_EXPO } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'
import Sparkline from '@/components/ui/Sparkline'
import DeltaBadge from '@/components/ui/DeltaBadge'
import { useReporte, type PeriodoReporte } from '@/hooks/useReportes'
import { exportarReporteExcel } from '@/lib/exportarReporteExcel'
import { MODULOS_CATALOGO } from '@/lib/constants/modulos'
import {
  KPI_SERIE_COLOR, KPI_SERIE_LABEL, LINE_CHART_OPTIONS,
  HORIZONTAL_BAR_OPTIONS, MODULO_PALETTE, STAT_ACCENT,
} from '@/lib/reportesChartConfig'

const fadeUp = fadeUpSm

// Rango inmediatamente anterior, de la misma duración, al [desde, hasta]
// dado -- para poder comparar el período elegido contra el que le precede
// (ej. "esta semana" vs "la semana pasada"). Se calcula en local, no en UTC
// (mismo cuidado que calcularRango() en el backend), para no correr el rango
// un día por el huso horario.
function fmtFecha(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function rangoAnterior(desde: string, hasta: string): { desde: string; hasta: string } {
  const MS_DIA = 24 * 60 * 60 * 1000
  const [dy, dm, dd] = desde.split('-').map(Number)
  const [hy, hm, hd] = hasta.split('-').map(Number)
  const fechaDesde = new Date(dy, dm - 1, dd)
  const fechaHasta = new Date(hy, hm - 1, hd)
  const duracionDias = Math.round((fechaHasta.getTime() - fechaDesde.getTime()) / MS_DIA) + 1
  const prevHasta = new Date(fechaDesde.getTime() - MS_DIA)
  const prevDesde = new Date(prevHasta.getTime() - (duracionDias - 1) * MS_DIA)
  return { desde: fmtFecha(prevDesde), hasta: fmtFecha(prevHasta) }
}

function deltaPct(actual: number, anterior: number | undefined): number | undefined {
  if (anterior === undefined) return undefined
  if (anterior === 0) return actual > 0 ? 100 : 0
  return Math.round(((actual - anterior) / anterior) * 100)
}

function moduloLabel(clave: string): string {
  return MODULOS_CATALOGO.find((m) => m.clave === clave)?.nombre ?? clave
}

const PERIODOS: { value: PeriodoReporte; label: string }[] = [
  { value: 'dia',    label: 'Hoy' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes',    label: 'Este mes' },
  { value: 'anio',   label: 'Este año' },
  { value: 'custom', label: 'Rango personalizado' },
]

interface StatTileProps {
  label: string
  value: number
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  accent: string
  /** Omitido cuando la métrica no tiene sentido comparada contra el período
   *  anterior (ej. "Pendientes", que es un conteo actual, no del rango). */
  deltaPct?: number
  /** Serie diaria del propio período -- solo existe para las 4 métricas que
   *  también alimentan la gráfica de tendencia (ver KPI_SERIE_COLOR). */
  sparkline?: number[]
}

function StatTile({ label, value, icon: Icon, accent, deltaPct: delta, sparkline }: StatTileProps) {
  return (
    <div className="bg-bg-alt/40 border border-border rounded-xl px-4 py-3.5 flex flex-col gap-2.5">
      <div className="flex items-start justify-between gap-2">
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accent}1A`, color: accent }}
        >
          <Icon className="w-4 h-4" aria-hidden />
        </span>
        {delta !== undefined && <DeltaBadge pct={delta} />}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-2xl font-bold text-text leading-none">{value}</p>
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mt-1.5 truncate">{label}</p>
        </div>
        {sparkline && sparkline.length > 0 && (
          <Sparkline data={sparkline} endColor={accent} className="shrink-0" />
        )}
      </div>
    </div>
  )
}

/** Pestaña "Reportes" de la pantalla de Actividad -- reportes agregados por
 *  período (día/semana/mes/año/rango) sobre audit_log, con evolución día a
 *  día (u hora a hora si el período es "hoy"). Distinto de "Analítica de
 *  Uso" (navegación anónima) y de "Auditoría" (rastro de seguridad crudo). */
export default function ReportesTab() {
  const [periodo, setPeriodo] = useState<PeriodoReporte>('semana')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [exportando, setExportando] = useState(false)

  const { data, isLoading, isError, isFetching, refetch } = useReporte({ periodo, desde, hasta })

  const rangoPrevio = data ? rangoAnterior(data.desde, data.hasta) : null
  const { data: dataAnterior } = useReporte(
    { periodo: 'custom', desde: rangoPrevio?.desde, hasta: rangoPrevio?.hasta },
    Boolean(rangoPrevio),
  )

  const exportExcel = async () => {
    if (!data) return
    setExportando(true)
    try {
      await exportarReporteExcel(data)
    } finally {
      setExportando(false)
    }
  }

  const modulosOrdenados = data ? [...data.actividadPorModulo].sort((a, b) => b.total - a.total) : []

  const rangoInvalido = periodo === 'custom' && desde && hasta && desde > hasta

  const chartData = data ? {
    labels: data.serieTiempo.serie.map((p) => p.etiqueta),
    datasets: (Object.keys(KPI_SERIE_COLOR) as (keyof typeof KPI_SERIE_COLOR)[]).map((kpi) => ({
      label: KPI_SERIE_LABEL[kpi],
      data: data.serieTiempo.serie.map((p) => p[kpi]),
      borderColor: KPI_SERIE_COLOR[kpi],
      backgroundColor: `${KPI_SERIE_COLOR[kpi]}22`,
      pointRadius: data.serieTiempo.serie.length > 60 ? 0 : 2.5,
      pointHoverRadius: 4,
      borderWidth: 2,
      tension: 0.3,
      fill: false,
    })),
  } : null

  const serieUsuarios = data?.serieTiempo.serie.map((p) => p.usuarios) ?? []
  const serieSolicitudes = data?.serieTiempo.serie.map((p) => p.solicitudes) ?? []
  const serieDocumentos = data?.serieTiempo.serie.map((p) => p.documentos) ?? []
  const serieMapas = data?.serieTiempo.serie.map((p) => p.mapas) ?? []

  const moduloChartData = modulosOrdenados.length > 0 ? {
    labels: modulosOrdenados.map((m) => moduloLabel(m.modulo)),
    datasets: [{
      label: 'Eventos',
      data: modulosOrdenados.map((m) => m.total),
      backgroundColor: modulosOrdenados.map((_, i) => MODULO_PALETTE[i % MODULO_PALETTE.length]),
      borderRadius: 6,
      barThickness: 18,
    }],
  } : null

  return (
    <div className="space-y-6">
      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-text-muted">
          {data ? `Del ${data.desde} al ${data.hasta}` : 'Elige un período para generar el reporte'}
        </p>
        <button
          onClick={exportExcel}
          disabled={!data || isLoading || exportando}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors shrink-0"
        >
          {exportando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exportando ? 'Generando Excel…' : 'Exportar Excel'}
        </button>
      </motion.div>

      {/* Selector de período */}
      <motion.div {...fadeUp(0.08)} className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5 bg-bg-alt/40 border border-border rounded-xl p-1.5">
          {PERIODOS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriodo(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                periodo === p.value ? 'bg-primary-800 text-white' : 'text-text-muted hover:text-text'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {periodo === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              aria-label="Desde"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="px-3 py-2 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition"
            />
            <span className="text-sm text-text-muted">—</span>
            <input
              type="date"
              aria-label="Hasta"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="px-3 py-2 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition"
            />
          </div>
        )}
      </motion.div>

      {rangoInvalido && (
        <p className="text-xs text-red-500">La fecha "desde" debe ser anterior a "hasta".</p>
      )}

      {/* Contenido */}
      <Card3D
        disabled
        initial={{ opacity: 0, y: 20, rotateX: 4, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  rotateX: 0, scale: 1    }}
        transition={{ delay: 0.14, duration: 0.5, ease: EASE_OUT_EXPO }}
        style={{ transformPerspective: 900 }}
        glow="rgba(26,86,50,0.12)"
        intensity={3}
        className="bg-[var(--card-bg)] border border-border/70 rounded-xl overflow-hidden p-6"
      >
        {isLoading || (isFetching && !data) ? (
          <div className="py-16 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary-700 mx-auto" />
          </div>
        ) : isError ? (
          <div className="py-16 text-center">
            <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-500 mb-3">No se pudo generar el reporte.</p>
            <button onClick={() => refetch()} className="text-xs font-semibold text-primary-700 hover:text-primary-900 transition-colors">
              Reintentar
            </button>
          </div>
        ) : !data ? (
          <div className="py-16 text-center text-sm text-text-muted">
            <FileBarChart className="w-6 h-6 mx-auto mb-2 text-text-muted" />
            Selecciona un rango de fechas válido para generar el reporte.
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-2.5">
                Evolución {data.serieTiempo.granularidad === 'hora' ? 'por hora' : 'día a día'}
              </p>
              <div style={{ height: 260 }}>
                {chartData && <Line data={chartData} options={LINE_CHART_OPTIONS} />}
              </div>
            </div>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-2.5">Usuarios</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatTile
                  label="Nuevos registros" value={data.usuarios.nuevos}
                  icon={UserPlus} accent={STAT_ACCENT.usuariosNuevos}
                  deltaPct={deltaPct(data.usuarios.nuevos, dataAnterior?.usuarios.nuevos)}
                  sparkline={serieUsuarios}
                />
                <StatTile
                  label="Creados por admin" value={data.usuarios.creadosPorAdmin}
                  icon={UserCog} accent={STAT_ACCENT.usuariosAdmin}
                  deltaPct={deltaPct(data.usuarios.creadosPorAdmin, dataAnterior?.usuarios.creadosPorAdmin)}
                />
                <StatTile
                  label="Logins exitosos" value={data.logins.exitosos}
                  icon={LogIn} accent={STAT_ACCENT.loginsExitosos}
                  deltaPct={deltaPct(data.logins.exitosos, dataAnterior?.logins.exitosos)}
                />
                <StatTile
                  label="Logins fallidos" value={data.logins.fallidos}
                  icon={ShieldAlert} accent={STAT_ACCENT.loginsFallidos}
                  deltaPct={deltaPct(data.logins.fallidos, dataAnterior?.logins.fallidos)}
                />
              </div>
            </div>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-2.5">Solicitudes</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatTile
                  label="Nuevas" value={data.solicitudes.nuevas}
                  icon={Inbox} accent={STAT_ACCENT.solicitudesNuevas}
                  deltaPct={deltaPct(data.solicitudes.nuevas, dataAnterior?.solicitudes.nuevas)}
                  sparkline={serieSolicitudes}
                />
                <StatTile
                  label="Resueltas" value={data.solicitudes.resueltas}
                  icon={FileCheck} accent={STAT_ACCENT.solicitudesResueltas}
                  deltaPct={deltaPct(data.solicitudes.resueltas, dataAnterior?.solicitudes.resueltas)}
                />
                {/* Sin deltaPct: "pendientes" es el conteo actual de solicitudes
                    abiertas, no algo que ocurrió dentro del período elegido. */}
                <StatTile
                  label="Pendientes" value={data.solicitudes.pendientes}
                  icon={Clock} accent={STAT_ACCENT.solicitudesPendientes}
                />
              </div>
            </div>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-2.5">Contenido</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatTile
                  label="Documentos creados" value={data.documentos.creados}
                  icon={FileText} accent={STAT_ACCENT.documentosCreados}
                  deltaPct={deltaPct(data.documentos.creados, dataAnterior?.documentos.creados)}
                />
                <StatTile
                  label="Documentos publicados" value={data.documentos.publicados}
                  icon={FileCheck} accent={STAT_ACCENT.documentosPublicados}
                  deltaPct={deltaPct(data.documentos.publicados, dataAnterior?.documentos.publicados)}
                  sparkline={serieDocumentos}
                />
                <StatTile
                  label="Mapas creados" value={data.mapas.creados}
                  icon={MapPin} accent={STAT_ACCENT.mapasCreados}
                  deltaPct={deltaPct(data.mapas.creados, dataAnterior?.mapas.creados)}
                />
                <StatTile
                  label="Mapas publicados" value={data.mapas.publicados}
                  icon={MapIcon} accent={STAT_ACCENT.mapasPublicados}
                  deltaPct={deltaPct(data.mapas.publicados, dataAnterior?.mapas.publicados)}
                  sparkline={serieMapas}
                />
              </div>
            </div>
            {moduloChartData && (
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-2.5">Actividad por módulo</p>
                <div style={{ height: Math.max(modulosOrdenados.length * 34, 120) }}>
                  <Bar data={moduloChartData} options={HORIZONTAL_BAR_OPTIONS} />
                </div>
              </div>
            )}
          </div>
        )}
      </Card3D>
    </div>
  )
}
