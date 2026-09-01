import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Loader2, AlertCircle, FileBarChart } from 'lucide-react'
import { fadeUpSm, EASE_OUT_EXPO } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'
import { useReporte, type PeriodoReporte } from '@/hooks/useReportes'

const fadeUp = fadeUpSm

const PERIODOS: { value: PeriodoReporte; label: string }[] = [
  { value: 'dia',    label: 'Hoy' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes',    label: 'Este mes' },
  { value: 'anio',   label: 'Este año' },
  { value: 'custom', label: 'Rango personalizado' },
]

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-bg-alt/40 border border-border rounded-xl px-4 py-3.5">
      <p className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1">{label}</p>
      <p className="text-2xl font-bold text-text">{value}</p>
    </div>
  )
}

export default function Reportes() {
  const [periodo, setPeriodo] = useState<PeriodoReporte>('semana')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const { data, isLoading, isError, isFetching, refetch } = useReporte({ periodo, desde, hasta })

  const exportCSV = () => {
    if (!data) return
    const csvField = (val: unknown) => {
      const s = String(val ?? '').replace(/\r\n|\n|\r/g, ' ')
      const safe = /^[=+\-@\t]/.test(s) ? `'${s}` : s
      return `"${safe.replace(/"/g, '""')}"`
    }
    const rows: (string | number)[][] = [
      ['Métrica', 'Valor'],
      ['Usuarios nuevos', data.usuarios.nuevos],
      ['Usuarios creados por admin', data.usuarios.creadosPorAdmin],
      ['Solicitudes nuevas', data.solicitudes.nuevas],
      ['Solicitudes resueltas', data.solicitudes.resueltas],
      ['Solicitudes pendientes', data.solicitudes.pendientes],
      ['Documentos creados', data.documentos.creados],
      ['Documentos publicados', data.documentos.publicados],
      ['Mapas creados', data.mapas.creados],
      ['Mapas publicados', data.mapas.publicados],
      ['Logins exitosos', data.logins.exitosos],
      ['Logins fallidos', data.logins.fallidos],
      [],
      ['Módulo', 'Eventos'],
      ...data.actividadPorModulo.map((m) => [m.modulo, m.total]),
    ]
    const csv = rows.map((r) => r.map(csvField).join(',')).join('\n')
    const blobUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `reporte-${data.desde}-a-${data.hasta}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  }

  const rangoInvalido = periodo === 'custom' && desde && hasta && desde > hasta

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[0.7rem] font-bold uppercase tracking-widest text-primary-700">Administración</span>
          <h1 className="font-display text-2xl font-bold text-text mt-0.5">Reportes de Actividad</h1>
          <p className="text-sm text-text-muted mt-1">
            {data ? `Del ${data.desde} al ${data.hasta}` : 'Elige un período para generar el reporte'}
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={!data || isLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors shrink-0"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
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
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-2.5">Usuarios</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatTile label="Nuevos registros" value={data.usuarios.nuevos} />
                <StatTile label="Creados por admin" value={data.usuarios.creadosPorAdmin} />
                <StatTile label="Logins exitosos" value={data.logins.exitosos} />
                <StatTile label="Logins fallidos" value={data.logins.fallidos} />
              </div>
            </div>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-2.5">Solicitudes</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatTile label="Nuevas" value={data.solicitudes.nuevas} />
                <StatTile label="Resueltas" value={data.solicitudes.resueltas} />
                <StatTile label="Pendientes" value={data.solicitudes.pendientes} />
              </div>
            </div>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-2.5">Contenido</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatTile label="Documentos creados" value={data.documentos.creados} />
                <StatTile label="Documentos publicados" value={data.documentos.publicados} />
                <StatTile label="Mapas creados" value={data.mapas.creados} />
                <StatTile label="Mapas publicados" value={data.mapas.publicados} />
              </div>
            </div>
            {data.actividadPorModulo.length > 0 && (
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-2.5">Actividad por módulo</p>
                <div className="space-y-1.5">
                  {data.actividadPorModulo.map((m) => (
                    <div key={m.modulo} className="flex items-center justify-between px-3 py-2 bg-bg-alt/30 rounded-lg">
                      <span className="text-sm text-text capitalize">{m.modulo}</span>
                      <span className="text-sm font-semibold text-text">{m.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card3D>
    </div>
  )
}
