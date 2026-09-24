import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import { fadeUpSm } from '@/lib/animations'
import AuditoriaTab from './AuditoriaTab'
import AnaliticaTab from './AnaliticaTab'

const fadeUp = fadeUpSm

function hoyISO(offsetDias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDias)
  return d.toISOString().slice(0, 10)
}

type Pestana = 'auditoria' | 'analitica'

const PESTANAS: { clave: Pestana; label: string }[] = [
  { clave: 'auditoria', label: 'Registro de Auditoría' },
  { clave: 'analitica', label: 'Analítica de Uso' },
]

/**
 * Pantalla de Actividad del panel admin -- dos pestañas sobre datos
 * deliberadamente distintos: "Auditoría" es el rastro de seguridad
 * (audit_log, ligado a usuario/IP); "Analítica" es comportamiento de
 * navegación anónimo (analytics_sessions/pageviews, sin IP ni identidad).
 * Viven juntas aquí porque ambas responden "qué pasa en la plataforma", pero
 * el backend las mantiene en tablas y módulos separados a propósito.
 */
export default function Actividad() {
  const [pestana, setPestana] = useState<Pestana>('auditoria')
  const [fechaDesde, setFechaDesde] = useState(hoyISO(-14))
  const [fechaHasta, setFechaHasta] = useState(hoyISO(0))

  return (
    <div className="space-y-6">
      <motion.div {...fadeUp(0)}>
        <span className="text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: 'var(--hero-eyebrow-text)' }}>Administración</span>
        <h1 className="font-display text-2xl font-bold text-text mt-0.5">Actividad</h1>
      </motion.div>

      <motion.div {...fadeUp(0.05)} className="flex flex-wrap items-center justify-between gap-4 border-b border-border">
        <div className="flex gap-1">
          {PESTANAS.map((p) => (
            <button
              key={p.clave}
              onClick={() => setPestana(p.clave)}
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

      {pestana === 'auditoria' ? <AuditoriaTab /> : <AnaliticaTab desde={fechaDesde} hasta={fechaHasta} />}
    </div>
  )
}
