import { motion } from 'framer-motion'
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { fadeUp } from '@/lib/animations'
import { StatusBadge } from './StatusBadge'
import { FiltroDropdown } from './FiltroDropdown'
import { PAGE_SIZE } from './solicitudes.utils'

export function SolicitudesTable({ rows, onVerDetalle, filtro, onFiltroChange, totalAll, page, totalPages, onPrev, onNext }) {
  const desde = (page - 1) * PAGE_SIZE + 1
  const hasta = Math.min(page * PAGE_SIZE, rows.length + (page - 1) * PAGE_SIZE)

  return (
    <motion.div {...fadeUp(0.2)} className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h3 className="text-base font-bold text-text">Solicitudes Recientes</h3>
        <FiltroDropdown filtro={filtro} onChange={onFiltroChange} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bg-alt/50">
              <th className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted px-6 py-3">ID</th>
              <th className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted px-4 py-3">Tipo de Trámite</th>
              <th className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted px-4 py-3">Fecha</th>
              <th className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted px-4 py-3">Estado</th>
              <th className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows.map((sol) => (
              <tr key={sol.id} className="border-b border-border last:border-b-0 hover:bg-bg-alt/30 transition-colors">
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
                    onClick={() => onVerDetalle(sol)}
                    className="w-8 h-8 rounded-lg border border-border bg-white flex items-center justify-center text-text-muted hover:bg-primary-800 hover:border-primary-800 hover:text-white transition-colors"
                    title={`Ver detalle de ${sol.id}`}
                    aria-label={`Ver detalle de ${sol.id}`}
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

      <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-bg-alt/30">
        <span className="text-xs text-text-muted">
          {rows.length > 0
            ? `Mostrando ${desde}–${hasta} de ${totalAll} solicitudes`
            : `0 solicitudes${filtro ? ` con estado "${filtro}"` : ''}`}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={onPrev} disabled={page === 1}
            className="w-7 h-7 rounded-md border border-border bg-white text-text-muted flex items-center justify-center hover:bg-primary-800 hover:text-white hover:border-primary-800 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Página anterior">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="w-8 text-center text-xs font-semibold text-text-muted">
            {page}/{totalPages || 1}
          </span>
          <button onClick={onNext} disabled={page >= totalPages}
            className="w-7 h-7 rounded-md border border-border bg-white text-text-muted flex items-center justify-center hover:bg-primary-800 hover:text-white hover:border-primary-800 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Página siguiente">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
