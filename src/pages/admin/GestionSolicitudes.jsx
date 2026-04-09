import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, X, CheckCircle, XCircle, Clock, Eye,
  Download, Filter, ChevronLeft, ChevronRight,
  User, FileText, MessageSquare,
} from 'lucide-react'
import { SOLICITUDES_TABLE } from '@/lib/constants'
import { fadeUpSm, panelAnim, drawerAnim } from '@/lib/animations'

const fadeUp = fadeUpSm

const ESTADO_BADGE = {
  'En Proceso': 'bg-yellow-100 text-yellow-700',
  'Aprobado':   'bg-green-100 text-green-700',
  'Rechazado':  'bg-red-100 text-red-600',
}

const REVISORES = [
  'Sin asignar',
  'Carlos Rentería',
  'Analista Territorial',
  'María Valencia',
  'Jorge Mena',
]

const PAGE_SIZE = 5

export default function GestionSolicitudes() {
  const [solicitudes, setSolicitudes] = useState(() =>
    SOLICITUDES_TABLE.map((s) => ({ ...s, revisor: 'Sin asignar', nota: '' }))
  )
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [selected, setSelected] = useState(null)
  const [accionModal, setAccionModal] = useState(null) // { type: 'approve'|'reject', sol }
  const [nota, setNota] = useState('')
  const [page, setPage] = useState(1)

  const tipos = [...new Set(SOLICITUDES_TABLE.map((s) => s.tipo))]

  const filtered = solicitudes.filter((s) => {
    const q = search.toLowerCase()
    const matchQ = !q || s.id.toLowerCase().includes(q) || s.tipo.toLowerCase().includes(q) || s.solicitante.toLowerCase().includes(q)
    const matchE = !filtroEstado || s.estado === filtroEstado
    const matchT = !filtroTipo || s.tipo === filtroTipo
    return matchQ && matchE && matchT
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleAction = () => {
    const { type, sol } = accionModal
    setSolicitudes((prev) => prev.map((s) =>
      s.id === sol.id
        ? { ...s, estado: type === 'approve' ? 'Aprobado' : 'Rechazado', estadoColor: type === 'approve' ? 'green' : 'red', notas: nota || s.notas }
        : s
    ))
    if (selected?.id === sol.id) setSelected((prev) => ({ ...prev, estado: type === 'approve' ? 'Aprobado' : 'Rechazado' }))
    setAccionModal(null)
    setNota('')
  }

  const handleRevisor = (id, revisor) => {
    setSolicitudes((prev) => prev.map((s) => s.id === id ? { ...s, revisor } : s))
    if (selected?.id === id) setSelected((prev) => ({ ...prev, revisor }))
  }

  const exportCSV = () => {
    const rows = [['ID', 'Tipo', 'Solicitante', 'Fecha', 'Estado', 'Revisor']]
    filtered.forEach((s) => rows.push([s.id, s.tipo, s.solicitante, s.fecha, s.estado, s.revisor]))
    const csv = rows.map((r) => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'solicitudes.csv'
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[0.7rem] font-bold uppercase tracking-widest text-primary-700">Administración</span>
          <h1 className="font-display text-2xl font-bold text-text mt-0.5">Gestión de Solicitudes</h1>
          <p className="text-sm text-text-muted mt-1">{solicitudes.length} solicitudes en el sistema</p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors shrink-0"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div {...fadeUp(0.08)} className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por ID, tipo o solicitante..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => { setFiltroEstado(e.target.value); setPage(1) }}
          className="px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 transition"
        >
          <option value="">Todos los estados</option>
          <option>En Proceso</option>
          <option>Aprobado</option>
          <option>Rechazado</option>
        </select>
        <select
          value={filtroTipo}
          onChange={(e) => { setFiltroTipo(e.target.value); setPage(1) }}
          className="px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 transition"
        >
          <option value="">Todos los tipos</option>
          {tipos.map((t) => <option key={t}>{t}</option>)}
        </select>
      </motion.div>

      {/* Table */}
      <motion.div {...fadeUp(0.14)} className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-alt/50">
                {['ID', 'Tipo', 'Solicitante', 'Fecha', 'Revisor', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-text-muted">Sin resultados</td></tr>
              )}
              {pageItems.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-b-0 hover:bg-bg-alt/30 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-bold text-primary-800">{s.id}</td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-text">{s.tipo}</p>
                    <p className="text-[0.65rem] text-text-muted">{s.subtipo}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-text-muted">{s.solicitante}</td>
                  <td className="px-5 py-3.5 text-sm text-text-muted">{s.fecha}</td>
                  <td className="px-5 py-3.5">
                    <select
                      value={s.revisor}
                      onChange={(e) => handleRevisor(s.id, e.target.value)}
                      className="text-xs px-2 py-1 border border-border rounded-lg bg-white focus:outline-none focus:border-primary-800 transition"
                    >
                      {REVISORES.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ESTADO_BADGE[s.estado]}`}>
                      {s.estado}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelected(s)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-primary-800 hover:bg-primary-50 transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {s.estado === 'En Proceso' && (
                        <>
                          <button
                            onClick={() => { setAccionModal({ type: 'approve', sol: s }); setNota('') }}
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                            title="Aprobar"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setAccionModal({ type: 'reject', sol: s }); setNota('') }}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Rechazar"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-5 py-3 border-t border-border bg-bg-alt/30 flex items-center justify-between">
          <span className="text-xs text-text-muted">Mostrando {pageItems.length} de {filtered.length}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded-lg text-text-muted hover:text-primary-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-text px-2">{page}/{totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded-lg text-text-muted hover:text-primary-800 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Detail slide drawer */}
      <AnimatePresence>
        {selected && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
              onClick={() => setSelected(null)}
            />
            {/* Drawer */}
            <motion.div
              key="drawer"
              {...drawerAnim}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start justify-between px-6 py-5 border-b border-border bg-bg-alt/40">
                <div>
                  <span className="text-xs font-bold text-primary-800">{selected.id}</span>
                  <h3 className="text-base font-bold text-text mt-0.5">{selected.tipo}</h3>
                  <p className="text-xs text-text-muted mt-0.5">{selected.subtipo}</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Status + meta */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted mb-1">Estado</p>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ESTADO_BADGE[selected.estado]}`}>{selected.estado}</span>
                  </div>
                  <div>
                    <p className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted mb-1">Fecha</p>
                    <p className="text-sm text-text">{selected.fecha}</p>
                  </div>
                  <div>
                    <p className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted mb-1">Solicitante</p>
                    <p className="text-sm font-semibold text-text">{selected.solicitante}</p>
                  </div>
                  <div>
                    <p className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted mb-1">Revisor</p>
                    <p className="text-sm text-text">{selected.revisor || 'Sin asignar'}</p>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <p className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted mb-3">Progreso de la Solicitud</p>
                  <div className="relative">
                    {selected.timeline.map((step, i) => {
                      const isLast = i === selected.timeline.length - 1
                      const isDone = true
                      return (
                        <div key={i} className="flex gap-3 pb-4 last:pb-0">
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white text-[0.55rem] font-bold ${isLast && selected.estado === 'Rechazado' ? 'bg-red-500' : isLast ? 'bg-primary-800' : 'bg-primary-300'}`}>
                              {i + 1}
                            </div>
                            {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
                          </div>
                          <div className="pt-0.5 pb-2">
                            <p className={`text-sm font-semibold ${isLast ? 'text-text' : 'text-text-muted'}`}>{step}</p>
                            {isLast && <p className="text-xs text-text-muted mt-0.5">Estado actual</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted mb-2">Notas Técnicas</p>
                  <div className="bg-bg-alt rounded-xl p-4">
                    <p className="text-sm text-text-muted leading-relaxed">{selected.notas}</p>
                  </div>
                </div>

                {/* Inline action if pending */}
                {selected.estado === 'En Proceso' && (
                  <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-primary-800">Acción rápida</p>
                    <textarea
                      rows={2}
                      value={nota}
                      onChange={(e) => setNota(e.target.value)}
                      placeholder="Nota para el solicitante (opcional)..."
                      className="w-full px-3 py-2 border border-primary-200 bg-white rounded-lg text-sm focus:outline-none focus:border-primary-800 transition resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setAccionModal({ type: 'approve', sol: selected }) }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Aprobar
                      </button>
                      <button
                        onClick={() => { setAccionModal({ type: 'reject', sol: selected }) }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Rechazar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Approve / Reject confirm modal */}
      <AnimatePresence>
        {accionModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div {...panelAnim} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${accionModal.type === 'approve' ? 'bg-green-100' : 'bg-red-100'}`}>
                {accionModal.type === 'approve' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
              </div>
              <h3 className="text-base font-bold text-text text-center mb-1">
                {accionModal.type === 'approve' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}
              </h3>
              <p className="text-sm text-text-muted text-center mb-4">
                {accionModal.sol.id} — {accionModal.sol.tipo}
              </p>
              <div className="mb-4">
                <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1">Nota (opcional)</label>
                <textarea
                  rows={3}
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="Agregar comentario..."
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setAccionModal(null)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 transition-colors">Cancelar</button>
                <button
                  onClick={handleAction}
                  className={`flex-1 py-2.5 text-white rounded-lg text-sm font-semibold transition-colors ${accionModal.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {accionModal.type === 'approve' ? 'Confirmar Aprobación' : 'Confirmar Rechazo'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
