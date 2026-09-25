import { motion } from 'framer-motion'
import { Line } from 'react-chartjs-2'
import {
  Eye, Users, LogOut, Clock, Loader2, AlertCircle,
  Smartphone, Tablet, Monitor, Globe, ArrowDownToLine, ArrowUpFromLine,
} from 'lucide-react'
import { fadeUpSm, staggerContainer, staggerItem3D } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'
import Sparkline from '@/components/ui/Sparkline'
import DeltaBadge from '@/components/ui/DeltaBadge'
import { LINE_CHART_OPTIONS } from '@/lib/reportesChartConfig'
import {
  useAnaliticaResumen, usePaginasTop, useDispositivos, useFuentesTrafico, useEntradaSalida,
  type DispositivoStat,
} from '@/hooks/useAnalitica'

const fadeUp = fadeUpSm

function formatDuracion(segundos: number): string {
  const min = Math.floor(segundos / 60)
  const seg = segundos % 60
  return `${min}m ${String(seg).padStart(2, '0')}s`
}

// Las tarjetas KPI ya traen serie7 (últimos 7 días, terminando hoy) pero sin
// fechas -- solo conteos. Se reconstruyen acá para el eje X del gráfico
// grande; el backend no necesita devolver fechas que el cliente ya puede
// calcular a partir de "hoy".
function etiquetasUltimos7Dias(): string[] {
  const hoy = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoy)
    d.setDate(hoy.getDate() - (6 - i))
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })
  })
}

// ── Gráfica de tendencia (páginas vistas / visitantes, 7 días) ──
function TendenciaChart() {
  const { data, isLoading, isError } = useAnaliticaResumen()

  return (
    <motion.div {...fadeUp(0.08)} className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-5">
      <h3 className="text-sm font-bold text-text mb-4">Evolución — Últimos 7 Días</h3>
      <EstadoCarga isLoading={isLoading} isError={isError} vacio={false} />
      {!isLoading && !isError && data && (
        <div style={{ height: 260 }}>
          <Line
            data={{
              labels: etiquetasUltimos7Dias(),
              datasets: [
                {
                  label: 'Páginas vistas',
                  data: data.paginasVistas.serie7,
                  borderColor: '#009846',
                  backgroundColor: '#00984622',
                  pointRadius: 3,
                  pointHoverRadius: 5,
                  borderWidth: 2,
                  tension: 0.3,
                  fill: true,
                },
                {
                  label: 'Visitantes únicos',
                  data: data.visitantes.serie7,
                  borderColor: '#F7AC42',
                  backgroundColor: '#F7AC4222',
                  pointRadius: 3,
                  pointHoverRadius: 5,
                  borderWidth: 2,
                  tension: 0.3,
                  fill: true,
                },
              ],
            }}
            options={LINE_CHART_OPTIONS}
          />
        </div>
      )}
    </motion.div>
  )
}

const DISPOSITIVO_ICONO: Record<DispositivoStat['dispositivo'], typeof Smartphone> = {
  movil: Smartphone, tablet: Tablet, escritorio: Monitor,
}
const DISPOSITIVO_LABEL: Record<DispositivoStat['dispositivo'], string> = {
  movil: 'Móvil', tablet: 'Tablet', escritorio: 'Escritorio',
}

// ── Tarjetas KPI ──
function KpiCards() {
  const { data, isLoading } = useAnaliticaResumen()

  const tarjetas = [
    {
      label: 'Páginas Vistas', icon: Eye,
      value: data?.paginasVistas.semanaActual, tendencia: data?.paginasVistas, flowLabel: 'esta semana',
    },
    {
      label: 'Visitantes Únicos', icon: Users,
      value: data?.visitantes.semanaActual, tendencia: data?.visitantes, flowLabel: 'esta semana',
    },
  ]

  return (
    <motion.div variants={staggerContainer(0.07, 0.05)} initial="initial" animate="animate" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {tarjetas.map((kpi) => {
        const Icon = kpi.icon
        const dotColor = !kpi.tendencia || kpi.tendencia.deltaPct === 0
          ? 'var(--stats-value)'
          : kpi.tendencia.deltaPct > 0 ? 'var(--color-primary-600)' : 'var(--color-orange-500)'
        return (
          <motion.div key={kpi.label} variants={staggerItem3D}>
            <Card3D glow="var(--stats-border)" intensity={4} className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-5 relative overflow-hidden" whileHover={{ y: -3 }}>
              <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, var(--stats-bg) 0%, transparent 70%)' }} />
              <div className="flex items-start justify-between mb-3 relative">
                <div className="w-9 h-9 bg-[var(--stats-bg)] border border-[var(--stats-border)] rounded-xl flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[var(--stats-value)]" aria-hidden="true" />
                </div>
                {kpi.tendencia && <DeltaBadge pct={kpi.tendencia.deltaPct} />}
              </div>
              <div className="tabular font-display text-3xl font-bold text-text relative">
                {isLoading ? <span className="inline-block w-10 h-7 bg-bg-alt rounded animate-pulse" /> : (kpi.value ?? '—')}
              </div>
              <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">{kpi.label}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60 relative">
                {isLoading ? (
                  <span className="inline-block w-24 h-3 bg-bg-alt rounded animate-pulse" />
                ) : kpi.tendencia ? (
                  <>
                    <span className="text-[0.68rem] text-text-muted">{kpi.flowLabel}</span>
                    <Sparkline data={kpi.tendencia.serie7} endColor={dotColor} />
                  </>
                ) : <span className="text-[0.68rem] text-text-faint">Sin datos</span>}
              </div>
            </Card3D>
          </motion.div>
        )
      })}

      {/* Tasa de rebote y duración: snapshots sin serie de tendencia -- no
          tiene sentido una sparkline de un porcentaje que no es acumulativo. */}
      <motion.div variants={staggerItem3D}>
        <Card3D glow="var(--stats-border)" intensity={4} className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-5 relative overflow-hidden" whileHover={{ y: -3 }}>
          <div className="w-9 h-9 bg-[var(--stats-bg)] border border-[var(--stats-border)] rounded-xl flex items-center justify-center mb-3">
            <LogOut className="w-4 h-4 text-[var(--stats-value)]" aria-hidden="true" />
          </div>
          <div className="tabular font-display text-3xl font-bold text-text">
            {isLoading ? <span className="inline-block w-10 h-7 bg-bg-alt rounded animate-pulse" /> : `${data?.tasaRebotePct ?? 0}%`}
          </div>
          <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">Tasa de Rebote</p>
          <p className="text-[0.68rem] text-text-faint mt-3 pt-3 border-t border-border/60">Sesiones de 1 sola página</p>
        </Card3D>
      </motion.div>
      <motion.div variants={staggerItem3D}>
        <Card3D glow="var(--stats-border)" intensity={4} className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-5 relative overflow-hidden" whileHover={{ y: -3 }}>
          <div className="w-9 h-9 bg-[var(--stats-bg)] border border-[var(--stats-border)] rounded-xl flex items-center justify-center mb-3">
            <Clock className="w-4 h-4 text-[var(--stats-value)]" aria-hidden="true" />
          </div>
          <div className="tabular font-display text-3xl font-bold text-text">
            {isLoading ? <span className="inline-block w-10 h-7 bg-bg-alt rounded animate-pulse" /> : formatDuracion(data?.duracionPromedioSeg ?? 0)}
          </div>
          <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">Duración Promedio</p>
          <p className="text-[0.68rem] text-text-faint mt-3 pt-3 border-t border-border/60">Por sesión</p>
        </Card3D>
      </motion.div>
    </motion.div>
  )
}

// ── Barra de porcentaje horizontal (dispositivos / fuentes) ──
function BarraCategoria({ label, valor, total, delay, icon: Icon }: { label: string; valor: number; total: number; delay: number; icon?: typeof Smartphone }) {
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      {Icon && <Icon className="w-4 h-4 text-text-muted shrink-0" aria-hidden="true" />}
      <span className="text-xs text-text-muted w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-bg-alt rounded-full overflow-hidden">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: pct / 100 }}
          transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: 'left' }}
          className="h-full bg-primary-700 rounded-full"
        />
      </div>
      <span className="text-xs font-semibold text-text w-16 text-right shrink-0">{valor} ({pct}%)</span>
    </div>
  )
}

function EstadoCarga({ isLoading, isError, vacio }: { isLoading: boolean; isError: boolean; vacio: boolean }) {
  if (isLoading) return <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary-700" /></div>
  if (isError) return <div className="py-8 flex flex-col items-center gap-1"><AlertCircle className="w-5 h-5 text-red-400" /><p className="text-xs text-red-500">No se pudo cargar</p></div>
  if (vacio) return <p className="py-8 text-center text-xs text-text-muted">Sin datos en el período seleccionado</p>
  return null
}

interface AnaliticaTabProps {
  desde: string
  hasta: string
}

/** Pestaña "Analítica" de la pantalla de Actividad -- comportamiento de
 *  navegación anónimo (páginas vistas, dispositivos, fuentes de tráfico).
 *  Distinto de la pestaña "Auditoría" (rastro de seguridad, ver AuditoriaTab.tsx). */
export default function AnaliticaTab({ desde, hasta }: AnaliticaTabProps) {
  const rango = { desde, hasta: `${hasta}T23:59:59.999Z` }
  const paginasTop = usePaginasTop(rango)
  const dispositivos = useDispositivos(rango)
  const fuentes = useFuentesTrafico(rango)
  const entradaSalida = useEntradaSalida(rango)

  const maxPagina = Math.max(...(paginasTop.data ?? []).map((p) => p.vistas), 1)
  const totalDispositivos = (dispositivos.data ?? []).reduce((sum, d) => sum + d.sesiones, 0)
  const totalFuentes = (fuentes.data ?? []).reduce((sum, f) => sum + f.sesiones, 0)

  return (
    <div className="space-y-6">
      <motion.p {...fadeUp(0)} className="text-sm text-text-muted">
        Navegación anónima en la plataforma — nunca se registra IP ni identidad, ni siquiera para usuarios con sesión iniciada.
      </motion.p>

      <KpiCards />

      <TendenciaChart />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Páginas más visitadas */}
        <motion.div {...fadeUp(0.1)} className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-5">
          <h3 className="text-sm font-bold text-text mb-4">Páginas Más Visitadas</h3>
          <EstadoCarga isLoading={paginasTop.isLoading} isError={paginasTop.isError} vacio={(paginasTop.data ?? []).length === 0} />
          {!paginasTop.isLoading && !paginasTop.isError && (paginasTop.data ?? []).length > 0 && (
            <div className="space-y-2.5">
              {paginasTop.data!.slice(0, 8).map((p, i) => (
                <div key={p.ruta} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-text truncate flex-1">{p.ruta}</span>
                  <div className="w-28 h-2 bg-bg-alt rounded-full overflow-hidden shrink-0">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: p.vistas / maxPagina }}
                      transition={{ duration: 0.6, delay: 0.1 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                      style={{ transformOrigin: 'left' }}
                      className="h-full bg-primary-700 rounded-full"
                    />
                  </div>
                  <span className="text-xs font-semibold text-text w-10 text-right shrink-0">{p.vistas}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Dispositivos */}
        <motion.div {...fadeUp(0.15)} className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-5">
          <h3 className="text-sm font-bold text-text mb-4">Dispositivos</h3>
          <EstadoCarga isLoading={dispositivos.isLoading} isError={dispositivos.isError} vacio={(dispositivos.data ?? []).length === 0} />
          {!dispositivos.isLoading && !dispositivos.isError && (dispositivos.data ?? []).length > 0 && (
            <div className="space-y-3">
              {dispositivos.data!.map((d, i) => (
                <BarraCategoria
                  key={d.dispositivo}
                  label={DISPOSITIVO_LABEL[d.dispositivo]}
                  icon={DISPOSITIVO_ICONO[d.dispositivo]}
                  valor={d.sesiones}
                  total={totalDispositivos}
                  delay={0.15 + i * 0.05}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Fuentes de tráfico */}
        <motion.div {...fadeUp(0.2)} className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-5">
          <h3 className="text-sm font-bold text-text mb-4">Fuentes de Tráfico</h3>
          <EstadoCarga isLoading={fuentes.isLoading} isError={fuentes.isError} vacio={(fuentes.data ?? []).length === 0} />
          {!fuentes.isLoading && !fuentes.isError && (fuentes.data ?? []).length > 0 && (
            <div className="space-y-3">
              {fuentes.data!.map((f, i) => (
                <BarraCategoria key={f.fuente} label={f.fuente} icon={Globe} valor={f.sesiones} total={totalFuentes} delay={0.2 + i * 0.05} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Entrada / Salida */}
        <motion.div {...fadeUp(0.25)} className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-5">
          <h3 className="text-sm font-bold text-text mb-4">Entrada y Salida</h3>
          <EstadoCarga isLoading={entradaSalida.isLoading} isError={entradaSalida.isError} vacio={false} />
          {!entradaSalida.isLoading && !entradaSalida.isError && entradaSalida.data && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1">
                  <ArrowDownToLine className="w-3 h-3" /> Entradas
                </p>
                {entradaSalida.data.entradas.length === 0
                  ? <p className="text-xs text-text-faint">Sin datos</p>
                  : entradaSalida.data.entradas.slice(0, 5).map((e) => (
                    <div key={e.ruta} className="flex justify-between text-xs py-1 border-b border-border/40 last:border-0">
                      <span className="font-mono text-text truncate mr-2">{e.ruta}</span>
                      <span className="text-text-muted shrink-0">{e.veces}</span>
                    </div>
                  ))}
              </div>
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1">
                  <ArrowUpFromLine className="w-3 h-3" /> Salidas
                </p>
                {entradaSalida.data.salidas.length === 0
                  ? <p className="text-xs text-text-faint">Sin datos</p>
                  : entradaSalida.data.salidas.slice(0, 5).map((s) => (
                    <div key={s.ruta} className="flex justify-between text-xs py-1 border-b border-border/40 last:border-0">
                      <span className="font-mono text-text truncate mr-2">{s.ruta}</span>
                      <span className="text-text-muted shrink-0">{s.veces}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
