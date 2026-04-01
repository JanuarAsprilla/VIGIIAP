import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ClipboardList, Download, PlusCircle, Eye,
  ChevronLeft, ChevronRight, UploadCloud,
  Headphones, ArrowRight, SlidersHorizontal,
} from 'lucide-react'
import {
  SOLICITUDES_KPIS, SOLICITUDES_TABLE, TRAMITE_TYPES,
} from '@/lib/constants'
import { useSearch } from '@/contexts/SearchContext'
import { matches } from '@/lib/search'

// ── Animation helper ──
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
})

// ── Status Badge ──
function StatusBadge({ estado, color }) {
  const styles = {
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700',
  }

  const dotStyles = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${styles[color]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[color]}`} />
      {estado}
    </span>
  )
}

// ── Solicitudes Table ──
function SolicitudesTable({ rows }) {
  return (
    <motion.div
      {...fadeUp(0.2)}
      className="bg-white border border-border rounded-xl overflow-hidden"
    >
      {/* Table header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h3 className="text-base font-bold text-text">Solicitudes Recientes</h3>
        <button className="inline-flex items-center gap-2 text-xs font-medium text-text-muted hover:text-primary-800 transition-colors">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtrar por estado
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bg-alt/50">
              <th className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted px-6 py-3">
                ID
              </th>
              <th className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted px-4 py-3">
                Tipo de Trámite
              </th>
              <th className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted px-4 py-3">
                Fecha
              </th>
              <th className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted px-4 py-3">
                Estado
              </th>
              <th className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted px-4 py-3">
                Acción
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows.map((sol) => (
              <tr
                key={sol.id}
                className="border-b border-border last:border-b-0 hover:bg-bg-alt/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-primary-800">{sol.id}</span>
                </td>
                <td className="px-4 py-4">
                  <div>
                    <span className="block text-sm font-semibold text-text">{sol.tipo}</span>
                    <span className="block text-xs text-text-muted mt-0.5">{sol.subtipo}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-text-muted">{sol.fecha}</span>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge estado={sol.estado} color={sol.estadoColor} />
                </td>
                <td className="px-4 py-4">
                  <button
                    className="w-8 h-8 rounded-lg border border-border bg-white flex items-center justify-center text-text-muted hover:bg-primary-800 hover:border-primary-800 hover:text-white transition-colors"
                    title="Ver detalle"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-text-muted">
                  No se encontraron solicitudes para la búsqueda actual.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-bg-alt/30">
        <span className="text-xs text-text-muted">Mostrando {rows.length} de 24 solicitudes</span>
        <div className="flex items-center gap-1">
          <button
            disabled
            className="w-7 h-7 rounded-md border border-border bg-white text-text-muted flex items-center justify-center opacity-50"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button className="w-7 h-7 rounded-md border border-border bg-white text-text-muted flex items-center justify-center hover:bg-primary-800 hover:text-white hover:border-primary-800 transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ── New Request Form ──
function NuevaSolicitudForm() {
  return (
    <motion.div
      {...fadeUp(0.25)}
      className="bg-white border border-border rounded-xl p-6"
    >
      <h3 className="text-lg font-bold text-text mb-1">Nueva Solicitud</h3>
      <p className="text-sm text-text-muted mb-6">
        Complete el formulario para iniciar un nuevo proceso administrativo o consulta técnica.
      </p>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
            Nombre Completo
          </label>
          <input
            type="text"
            placeholder="Ej. Juan Pérez"
            className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
          />
        </div>

        {/* Tramite type */}
        <div>
          <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
            Tipo de Trámite
          </label>
          <select className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition">
            {TRAMITE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* File upload */}
        <div>
          <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
            Carga de Documentos
          </label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary-800 hover:bg-primary-800/[0.02] transition-colors">
            <UploadCloud className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-muted">
              Arrastre sus archivos aquí o{' '}
              <span className="text-primary-800 font-medium">explore</span>
            </p>
            <p className="text-[0.7rem] text-text-muted mt-1">
              PDF, JPG (Máx. 10MB)
            </p>
          </div>
        </div>

        {/* Submit button */}
        <button className="w-full px-6 py-3 bg-primary-800 text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors">
          Enviar Solicitud
        </button>
      </div>
    </motion.div>
  )
}

// ── Help CTA ──
function AyudaCTA() {
  return (
    <motion.div
      {...fadeUp(0.35)}
      className="bg-primary-50 border border-primary-200 rounded-xl p-5"
    >
      <h4 className="text-sm font-bold text-primary-900 mb-1.5">
        ¿Necesitas ayuda técnica?
      </h4>
      <p className="text-xs text-primary-800/70 leading-relaxed mb-3">
        Nuestro equipo de soporte especializado está disponible para
        guiarte en trámites complejos.
      </p>
      <a
        href="#"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-800 no-underline hover:text-primary-600 transition-colors"
      >
        Consultar Guía Técnica
        <ArrowRight className="w-3.5 h-3.5" />
      </a>
    </motion.div>
  )
}

// ── Bottom KPIs ──
function BottomStats() {
  return (
    <motion.div
      {...fadeUp(0.4)}
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      {SOLICITUDES_KPIS.map((kpi) => (
        <div
          key={kpi.label}
          className="bg-white border border-border rounded-xl px-5 py-4 text-center"
        >
          <span className="block text-[0.6rem] font-bold uppercase tracking-widest text-text-muted mb-1">
            {kpi.label}
          </span>
          <span className="block font-display text-3xl font-bold text-text">
            {kpi.value}
          </span>
        </div>
      ))}
    </motion.div>
  )
}

// ── Main Solicitudes Page ──
export default function Solicitudes() {
  const { query } = useSearch()
  const filteredRows = SOLICITUDES_TABLE.filter((s) =>
    matches([s.id, s.tipo, s.subtipo, s.estado], query)
  )

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <motion.div
        {...fadeUp(0)}
        className="flex flex-col md:flex-row md:items-start md:justify-between gap-4"
      >
        <div>
          <span className="inline-block text-[0.7rem] font-bold uppercase tracking-widest text-primary-700 mb-2">
            Módulo Administrativo
          </span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-text leading-tight mb-3">
            Gestión de Solicitudes{' '}
            <span className="block">y Trámites</span>
          </h1>
          <p className="text-sm text-text-muted leading-relaxed max-w-lg">
            Seguimiento en tiempo real de trámites de certificación territorial
            y consultas técnicas del Chocó Biogeográfico.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 shrink-0">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-border rounded-lg text-sm font-semibold text-text hover:border-primary-800 hover:text-primary-800 transition-colors">
            <Download className="w-4 h-4" />
            Exportar Reporte
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
            <PlusCircle className="w-4 h-4" />
            Nueva Solicitud
          </button>
        </div>
      </motion.div>

      {/* ── Main content: Table + Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left: Table */}
        <div className="space-y-6">
          <SolicitudesTable rows={filteredRows} />
        </div>

        {/* Right: Form + Help */}
        <div className="space-y-6">
          <NuevaSolicitudForm />
          <AyudaCTA />
        </div>
      </div>

      {/* ── Bottom KPIs ── */}
      <BottomStats />
    </div>
  )
}