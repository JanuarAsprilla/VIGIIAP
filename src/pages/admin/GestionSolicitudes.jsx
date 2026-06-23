/* Hallmark · macrostructure: Workbench · genre: admin-crud
 * tokens: design.md · stamp: 2026-05-25
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, X, CheckCircle, XCircle, Clock, Eye,
  Download, ChevronLeft, ChevronRight, Loader2,
  Mail, User, FileText, Send, MessageSquare, AlertCircle,
} from 'lucide-react'
import { fadeUpSm, panelAnim, drawerAnim, EASE_OUT_EXPO } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'
import { useSolicitudesAdmin, useUpdateEstadoSolicitud, useResponderSolicitud } from '@/hooks/useSolicitudes'
import { useToast, ToastContainer } from '@/components/Toast'

const fadeUp = fadeUpSm

const ESTADO_BADGE = {
  'Pendiente':   'bg-orange-100 text-orange-700',
  'En Revisión': 'bg-blue-100 text-blue-700',
  'Aprobado':    'bg-green-100 text-green-700',
  'Rechazado':   'bg-red-100 text-red-600',
  'Resuelta':    'bg-teal-100 text-teal-700',
}

const PAGE_SIZE = 10

function SectionLabel({ children }) {
  return (
    <p className="text-[0.6rem] font-bold uppercase tracking-widest text-text-muted mb-2">
      {children}
    </p>
  )
}

export default function GestionSolicitudes() {
  const { data } = useSolicitudesAdmin({ limit: 200 })
  const solicitudes = data?.data ?? []
  const updateEstado = useUpdateEstadoSolicitud()
  const responderMutation = useResponderSolicitud()
  const { toasts, toast, dismiss } = useToast()

  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [selected, setSelected] = useState(null)
  const [accionModal, setAccionModal] = useState(null)
  const [nota, setNota] = useState('')
  const [respuesta, setRespuesta] = useState('')
  const [page, setPage] = useState(1)

  const tipos = [...new Set(solicitudes.map((s) => s.tipo))]

  const filtered = solicitudes.filter((s) => {
    const q = search.toLowerCase()
    const matchQ = !q || s.id.toLowerCase().includes(q) || s.tipo.toLowerCase().includes(q) || (s.solicitante ?? '').toLowerCase().includes(q)
    const matchE = !filtroEstado || s.estado === filtroEstado
    const matchT = !filtroTipo || s.tipo === filtroTipo
    return matchQ && matchE && matchT
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleMarcarRevision = async (sol) => {
    try {
      await updateEstado.mutateAsync({ id: sol._id, estado: 'En Revisión' })
      if (selected?._id === sol._id)
        setSelected((prev) => ({ ...prev, estado: 'En Revisión', timeline: ['Recibida', 'Pendiente', 'En Revisión'] }))
      toast(`Solicitud ${sol.id} marcada en revisión`, 'info')
    } catch {
      toast('Error al actualizar la solicitud', 'error')
    }
  }

  const handleAction = async () => {
    const { type, sol } = accionModal
    const nuevoEstado = type === 'approve' ? 'Aprobado' : 'Rechazado'
    try {
      await updateEstado.mutateAsync({ id: sol._id, estado: nuevoEstado, nota })
      if (selected?._id === sol._id)
        setSelected((prev) => ({ ...prev, estado: nuevoEstado, notas: nota || prev.notas }))
      setAccionModal(null)
      setNota('')
      toast(
        type === 'approve'
          ? `Solicitud ${sol.id} aprobada — se notificó al solicitante`
          : `Solicitud ${sol.id} rechazada — se notificó al solicitante`,
        type === 'approve' ? 'success' : 'error'
      )
    } catch {
      toast('Error al procesar la solicitud', 'error')
    }
  }

  const handleResponder = async () => {
    if (!respuesta.trim() || respuesta.trim().length < 10) {
      toast('La respuesta debe tener al menos 10 caracteres', 'error')
      return
    }
    try {
      await responderMutation.mutateAsync({ id: selected._id, respuesta: respuesta.trim() })
      setSelected((prev) => ({
        ...prev,
        estado: 'Resuelta',
        notas: respuesta.trim(),
        timeline: ['Recibida', 'Pendiente', 'En Revisión', 'Resuelta'],
      }))
      setRespuesta('')
      toast(`Respuesta enviada — solicitud ${selected.id} marcada como resuelta`, 'success')
    } catch {
      toast('Error al enviar la respuesta', 'error')
    }
  }

  const exportCSV = () => {
    // csvField: elimina CRLF y escapa comillas dobles para prevenir inyección en CSV
    const csvField = (val) => {
      const s = String(val ?? '').replace(/\r\n|\n|\r/g, ' ')
      return `"${s.replace(/"/g, '""')}"`
    }
    const rows = [['ID', 'Tipo', 'Solicitante', 'Email', 'Fecha', 'Estado']]
    filtered.forEach((s) => rows.push([s.id, s.tipo, s.solicitante, s.email, s.fecha, s.estado]))
    const csv = rows.map((r) => r.map(csvField).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'solicitudes.csv'
    a.click()
  }

  const isResolved = (s) => !s?.accionesValidas?.length
  const canAct     = (s) => !!s?.accionesValidas?.length
  const canDo      = (s, accion) => s?.accionesValidas?.includes(accion) ?? false

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
          <option>Pendiente</option>
          <option>En Revisión</option>
          <option>Aprobado</option>
          <option>Resuelta</option>
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
      <Card3D
        initial={{ opacity: 0, y: 20, rotateX: 4, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  rotateX: 0, scale: 1    }}
        transition={{ delay: 0.14, duration: 0.5, ease: EASE_OUT_EXPO }}
        style={{ transformPerspective: 900 }}
        glow="rgba(26,86,50,0.12)"
        intensity={3}
        className="bg-white border border-border/70 rounded-xl overflow-hidden"
        whileHover={{ y: -2 }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-alt/50">
                {['ID', 'Tipo', 'Solicitante', 'Antigüedad', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-text-muted">Sin resultados</td></tr>
              )}
              {pageItems.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-b-0 hover:bg-bg-alt/30 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-bold text-primary-800">{s.id}</td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-text">{s.tipo}</p>
                    <p className="text-[0.65rem] text-text-muted line-clamp-1">{s.subtipo}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-text">{s.solicitante}</p>
                    <p className="text-[0.65rem] text-text-muted">{s.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold ${
                      s.diasPendiente >= 7 && canAct(s)
                        ? 'text-red-600'
                        : s.diasPendiente >= 3 && canAct(s)
                        ? 'text-orange-500'
                        : 'text-text-muted'
                    }`}>
                      {s.diasPendiente === 0 ? 'Hoy' : `${s.diasPendiente}d`}
                    </span>
                    {s.diasPendiente >= 7 && canAct(s) && (
                      <span className="ml-1 text-[0.55rem] font-bold text-red-500 uppercase">urgente</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ESTADO_BADGE[s.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                      {s.estado}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setSelected(s); setRespuesta('') }}
                        className="p-1.5 rounded-lg text-text-muted hover:text-primary-800 hover:bg-primary-50 transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {canDo(s, 'En Revisión') && (
                        <button
                          onClick={() => handleMarcarRevision(s)}
                          disabled={updateEstado.isPending}
                          className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 disabled:opacity-50 transition-colors"
                          title="Marcar en revisión"
                        >
                          {updateEstado.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {canDo(s, 'Aprobado') && (
                        <button
                          onClick={() => { setAccionModal({ type: 'approve', sol: s }); setNota('') }}
                          disabled={updateEstado.isPending}
                          className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 disabled:opacity-50 transition-colors"
                          title="Aprobar"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDo(s, 'Rechazado') && (
                        <button
                          onClick={() => { setAccionModal({ type: 'reject', sol: s }); setNota('') }}
                          disabled={updateEstado.isPending}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                          title="Rechazar"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      </Card3D>

      {/* ── Detail Drawer ── */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
              onClick={() => setSelected(null)}
            />
            <motion.div
              key="drawer"
              {...drawerAnim}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-start justify-between px-6 py-5 border-b border-border bg-bg-alt/40 shrink-0">
                <div>
                  <span className="text-xs font-bold text-primary-800">{selected.id}</span>
                  <h3 className="text-base font-bold text-text mt-0.5">{selected.tipo}</h3>
                  <span className={`inline-block mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${ESTADO_BADGE[selected.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                    {selected.estado}
                  </span>
                </div>
                <button onClick={() => setSelected(null)} className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto divide-y divide-border">

                {/* 1 — Información del solicitante */}
                <div className="px-6 py-4 space-y-3">
                  <SectionLabel>Solicitante</SectionLabel>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-primary-700" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text leading-tight">{selected.solicitante || 'Sin nombre'}</p>
                      {selected.email && (
                        <a
                          href={`mailto:${selected.email}`}
                          className="text-xs text-primary-700 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Mail className="w-3 h-3" />
                          {selected.email}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <p className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted mb-0.5">Fecha de envío</p>
                      <p className="text-sm text-text">{selected.fecha}</p>
                    </div>
                    <div>
                      <p className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted mb-0.5">Antigüedad</p>
                      <p className={`text-sm font-semibold ${
                        selected.diasPendiente >= 7 && canAct(selected) ? 'text-red-600'
                        : selected.diasPendiente >= 3 && canAct(selected) ? 'text-orange-500'
                        : 'text-text'
                      }`}>
                        {selected.diasPendiente === 0 ? 'Hoy' : `${selected.diasPendiente} día${selected.diasPendiente !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted mb-0.5">Revisado por</p>
                      <p className="text-sm text-text">{selected.revisor ?? <span className="text-text-muted italic">Sin asignar</span>}</p>
                    </div>
                    <div>
                      <p className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted mb-0.5">ID único</p>
                      <p className="text-sm font-mono text-primary-800">{selected.id}</p>
                    </div>
                  </div>
                </div>

                {/* 2 — Detalle de la solicitud */}
                <div className="px-6 py-4 space-y-3">
                  <SectionLabel>Detalle de la solicitud</SectionLabel>
                  <div className="flex items-start gap-2.5">
                    <FileText className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted mb-0.5">Tipo de trámite</p>
                      <p className="text-sm font-semibold text-text">{selected.tipo}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Descripción</p>
                    <div className="bg-bg-alt rounded-lg p-3">
                      <p className="text-sm text-text leading-relaxed">
                        {selected.descripcion || selected.subtipo || 'Sin descripción'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3 — Seguimiento / Timeline */}
                <div className="px-6 py-4">
                  <SectionLabel>Historial del trámite</SectionLabel>
                  <div className="relative space-y-0">
                    {selected.timeline.map((step, i) => {
                      const isLast = i === selected.timeline.length - 1
                      const isReject = step === 'Rechazado'
                      const isTeal = step === 'Resuelta'
                      return (
                        <div key={i} className="flex gap-3 pb-4 last:pb-0">
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white text-[0.55rem] font-bold ${
                              isLast && isReject ? 'bg-red-500'
                              : isLast && isTeal  ? 'bg-teal-500'
                              : isLast            ? 'bg-primary-800'
                              : 'bg-primary-300'
                            }`}>
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

                {/* 4 — Respuesta enviada (si ya está resuelta) */}
                {selected.estado === 'Resuelta' && selected.notas && (
                  <div className="px-6 py-4">
                    <SectionLabel>Respuesta enviada al solicitante</SectionLabel>
                    <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-teal-800 leading-relaxed">{selected.notas}</p>
                      </div>
                      <p className="text-[0.6rem] text-teal-600 mt-2">
                        Respuesta enviada por correo al solicitante
                      </p>
                    </div>
                  </div>
                )}

                {/* 5 — Respuesta del admin con nota anterior */}
                {selected.notas && selected.estado !== 'Resuelta' && (
                  <div className="px-6 py-4">
                    <SectionLabel>Nota interna</SectionLabel>
                    <div className="bg-bg-alt rounded-xl p-3">
                      <p className="text-sm text-text-muted leading-relaxed">{selected.notas}</p>
                    </div>
                  </div>
                )}

                {/* 6 — Comunicación / Enviar respuesta (solo si puede resolverse) */}
                {canDo(selected, 'Resuelta') && (
                  <div className="px-6 py-4 space-y-3">
                    <SectionLabel>Comunicación con el solicitante</SectionLabel>
                    <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary-700" />
                        <p className="text-xs font-bold text-primary-800">Enviar respuesta y resolver</p>
                      </div>
                      <p className="text-[0.65rem] text-primary-700 leading-relaxed">
                        Escribe la respuesta formal. Se enviará al correo del solicitante y
                        la solicitud quedará marcada como <strong>Resuelta</strong>.
                      </p>
                      <textarea
                        rows={4}
                        value={respuesta}
                        onChange={(e) => setRespuesta(e.target.value)}
                        placeholder="Redacta la respuesta oficial. Incluye resultados del trámite, observaciones técnicas o instrucciones..."
                        className="w-full px-3 py-2.5 border border-primary-200 bg-white rounded-lg text-sm focus:outline-none focus:border-primary-800 transition resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <p className={`text-xs ${respuesta.trim().length < 10 ? 'text-text-muted' : 'text-primary-700'}`}>
                          {respuesta.trim().length} / 2000 caracteres
                        </p>
                        <button
                          onClick={handleResponder}
                          disabled={responderMutation.isPending || respuesta.trim().length < 10}
                          className="flex items-center gap-2 px-4 py-2 bg-primary-800 text-white rounded-lg text-xs font-bold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {responderMutation.isPending
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Send className="w-3.5 h-3.5" />
                          }
                          Enviar y resolver
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7 — Acciones de estado (transiciones válidas) */}
                {canAct(selected) && (
                  <div className="px-6 py-4 space-y-2">
                    <SectionLabel>Cambiar estado</SectionLabel>
                    <div className="flex flex-wrap gap-2">
                      {canDo(selected, 'En Revisión') && (
                        <button
                          onClick={() => handleMarcarRevision(selected)}
                          disabled={updateEstado.isPending}
                          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-60 transition-colors"
                        >
                          {updateEstado.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                          En revisión
                        </button>
                      )}
                      {canDo(selected, 'Aprobado') && (
                        <button
                          onClick={() => { setAccionModal({ type: 'approve', sol: selected }) }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Aprobar
                        </button>
                      )}
                      {canDo(selected, 'Rechazado') && (
                        <button
                          onClick={() => { setAccionModal({ type: 'reject', sol: selected }) }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Rechazar
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Resolved state info */}
                {isResolved(selected) && selected.estado !== 'Resuelta' && (
                  <div className="px-6 py-4">
                    <div className="flex items-start gap-2.5 p-3 bg-bg-alt rounded-xl">
                      <AlertCircle className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                      <p className="text-xs text-text-muted leading-relaxed">
                        Esta solicitud fue marcada como <strong>{selected.estado}</strong>.
                        El solicitante fue notificado por correo electrónico.
                      </p>
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
                <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1">
                  Nota para el solicitante (opcional)
                </label>
                <textarea
                  rows={3}
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="Agregar comentario o motivo..."
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setAccionModal(null)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 transition-colors">Cancelar</button>
                <button
                  onClick={handleAction}
                  disabled={updateEstado.isPending}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-white rounded-lg text-sm font-semibold disabled:opacity-60 transition-colors ${accionModal.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {updateEstado.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {accionModal.type === 'approve' ? 'Confirmar Aprobación' : 'Confirmar Rechazo'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
