import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import { fadeUpSm } from '@/lib/animations'
import { useAuth } from '@/contexts/AuthContext'
import { puedeVerModulo } from '@/lib/permisosModulo'
import type { ModuloClave } from '@/lib/constants/modulos'
import AuditoriaTab from './AuditoriaTab'
import ReportesTab from './ReportesTab'
import AnaliticaTab from './AnaliticaTab'

const fadeUp = fadeUpSm

function hoyISO(offsetDias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDias)
  return d.toISOString().slice(0, 10)
}

type Pestana = 'auditoria' | 'reportes' | 'analitica'

const PESTANAS: { clave: Pestana; label: string; modulo: ModuloClave }[] = [
  { clave: 'auditoria', label: 'Registro de Auditoría', modulo: 'actividad' },
  { clave: 'reportes',  label: 'Reportes',              modulo: 'reportes' },
  { clave: 'analitica', label: 'Analítica de Uso',      modulo: 'actividad' },
]

function esPestana(valor: string | null): valor is Pestana {
  return valor === 'auditoria' || valor === 'reportes' || valor === 'analitica'
}

/**
 * Pantalla de Actividad del panel admin -- tres pestañas sobre datos
 * deliberadamente distintos: "Auditoría" es el rastro de seguridad
 * (audit_log, ligado a usuario/IP); "Reportes" son agregados por período
 * sobre esa misma auditoría (antes una página aparte, /admin/reportes);
 * "Analítica" es comportamiento de navegación anónimo
 * (analytics_sessions/pageviews, sin IP ni identidad). Viven juntas aquí
 * porque las tres responden "qué pasa en la plataforma", pero el backend las
 * mantiene en tablas y módulos separados a propósito -- "Auditoría" y
 * "Analítica" se gatean con el módulo 'actividad', "Reportes" con 'reportes'
 * (el mismo split de permisos que ya existía entre las dos pantallas).
 */
export default function Actividad() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const pestanasVisibles = useMemo(
    () => PESTANAS.filter((p) => puedeVerModulo(user, p.modulo)),
    [user],
  )

  const pestanaParam = searchParams.get('tab')
  const pestana: Pestana | undefined = esPestana(pestanaParam) && pestanasVisibles.some((p) => p.clave === pestanaParam)
    ? pestanaParam
    : pestanasVisibles[0]?.clave

  const cambiarPestana = (clave: Pestana) => setSearchParams({ tab: clave }, { replace: true })

  const [fechaDesde, setFechaDesde] = useState(hoyISO(-14))
  const [fechaHasta, setFechaHasta] = useState(hoyISO(0))

  return (
    <div className="space-y-6">
      <motion.div {...fadeUp(0)}>
        <span className="text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: 'var(--hero-eyebrow-text)' }}>Administración</span>
        <h1 className="font-display text-2xl font-bold text-text mt-0.5">Actividad</h1>
      </motion.div>

      {pestanasVisibles.length === 0 ? (
        <p className="text-sm text-text-muted">No tienes acceso a ninguna sección de esta pantalla.</p>
      ) : (
        <>
          <motion.div {...fadeUp(0.05)} className="flex flex-wrap items-center justify-between gap-4 border-b border-border">
            <div className="flex gap-1">
              {pestanasVisibles.map((p) => (
                <button
                  key={p.clave}
                  onClick={() => cambiarPestana(p.clave)}
                  className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                    pestana === p.clave
                      ? 'border-primary-800 text-primary-800'
                      : 'border-transparent text-text-muted hover:text-text'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {pestana === 'analitica' && (
              <div className="flex items-center gap-2 pb-2">
                <label className="flex items-center gap-1.5 px-3 py-2 bg-[var(--card-bg)] border border-border rounded-xl text-sm text-text-muted">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <input
                    type="date" aria-label="Desde" value={fechaDesde} max={fechaHasta}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="bg-transparent focus:outline-none text-text"
                  />
                </label>
                <span className="text-xs text-text-muted">a</span>
                <label className="flex items-center gap-1.5 px-3 py-2 bg-[var(--card-bg)] border border-border rounded-xl text-sm text-text-muted">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <input
                    type="date" aria-label="Hasta" value={fechaHasta} min={fechaDesde}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="bg-transparent focus:outline-none text-text"
                  />
                </label>
              </div>
            )}
          </motion.div>

          {pestana === 'auditoria' && <AuditoriaTab />}
          {pestana === 'reportes' && <ReportesTab />}
          {pestana === 'analitica' && <AnaliticaTab desde={fechaDesde} hasta={fechaHasta} />}
        </>
      )}
    </div>
  )
}
