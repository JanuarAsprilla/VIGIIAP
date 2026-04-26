import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Download, PlusCircle, Eye,
  ChevronLeft, ChevronRight, UploadCloud,
  ArrowRight, SlidersHorizontal,
  X, CheckCircle, Send, Clock, Check,
  AlertCircle, ChevronDown, FileText, User, Mail,
} from 'lucide-react'
import { TRAMITE_TYPES } from '@/lib/constants'
import { useSearch } from '@/contexts/SearchContext'
import { useAuth } from '@/contexts/AuthContext'
import { matches } from '@/lib/search'
import { useMisSolicitudes, useCreateSolicitud } from '@/hooks/useSolicitudes'

const PAGE_SIZE = 4

// ── Animation helper ──
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
})

// ── CSV export ──
function exportCSV(rows) {
  const header = 'ID,Tipo,Subtipo,Fecha,Estado'
  const body = rows
    .map((r) => `${r.id},"${r.tipo}","${r.subtipo}",${r.fecha},${r.estado}`)
    .join('\n')
  const blob = new Blob([header + '\n' + body], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'solicitudes_vigiiap.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ── Status Badge ──
function StatusBadge({ estado, color }) {
  const styles = {
    green:  'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    orange: 'bg-orange-100 text-orange-700',
    blue:   'bg-blue-100 text-blue-700',
    red:    'bg-red-100 text-red-700',
  }
  const dotStyles = {
    green:  'bg-green-500',
    yellow: 'bg-yellow-500',
    orange: 'bg-orange-500',
    blue:   'bg-blue-500',
    red:    'bg-red-500',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${styles[color]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[color]}`} />
      {estado}
    </span>
  )
}

// ── Detalle Modal ──
function DetalleSolicitudModal({ sol, onClose, onNueva }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const isRechazado = sol.estado === 'Rechazado'
  const isAprobado  = sol.estado === 'Aprobado'

  // Usar el timeline calculado en la normalización del hook
  const steps    = sol.timeline ?? ['Recibida', 'Pendiente', sol.estado]
  const activeIdx = steps.indexOf(sol.estado)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detalle-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border">
          <div>
            <span className="text-[0.65rem] font-bold uppercase tracking-wider text-primary-700">
              {sol.id}
            </span>
            <h3 id="detalle-modal-title" className="text-base font-bold text-text mt-0.5 leading-tight">
              {sol.tipo}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">{sol.subtipo} · {sol.fecha}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors shrink-0 ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Estado actual */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Estado actual</span>
            <StatusBadge estado={sol.estado} color={sol.estadoColor} />
          </div>

          {/* Timeline */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-3">
              Seguimiento del trámite
            </span>
            <div className="flex items-center gap-0">
              {steps.map((step, i) => {
                const done = i <= activeIdx
                const isLast = i === steps.length - 1
                const isReject = step === 'Rechazado'
                return (
                  <div key={step} className="flex items-center flex-1 min-w-0">
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                        done
                          ? isReject
                            ? 'bg-red-500 border-red-500'
                            : isLast && isAprobado
                              ? 'bg-green-500 border-green-500'
                              : 'bg-primary-800 border-primary-800'
                          : 'bg-white border-border'
                      }`}>
                        {done
                          ? isReject
                            ? <X className="w-3.5 h-3.5 text-white" />
                            : <Check className="w-3.5 h-3.5 text-white" />
                          : <span className="w-2 h-2 rounded-full bg-border" />
                        }
                      </div>
                      <span className={`text-[0.6rem] font-semibold mt-1.5 text-center leading-tight ${
                        done ? (isReject ? 'text-red-600' : 'text-primary-800') : 'text-text-muted'
                      }`}>
                        {step}
                      </span>
                    </div>
                    {!isLast && (
                      <div className={`h-0.5 flex-1 mx-1 rounded-full transition-colors ${
                        i < activeIdx ? 'bg-primary-800' : 'bg-border'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Solicitante */}
          <div className="flex items-center gap-2 p-3 bg-bg-alt rounded-lg">
            <User className="w-4 h-4 text-text-muted shrink-0" aria-hidden="true" />
            <div>
              <span className="block text-[0.6rem] font-bold uppercase tracking-wider text-text-muted">Solicitante</span>
              <span className="text-sm font-semibold text-text">{sol.solicitante}</span>
            </div>
          </div>

          {/* Notas */}
          <div className={`p-3 rounded-lg border ${
            isRechazado
              ? 'bg-red-50 border-red-200'
              : isAprobado
                ? 'bg-green-50 border-green-200'
                : 'bg-primary-50 border-primary-200'
          }`}>
            <div className="flex items-start gap-2">
              {isRechazado
                ? <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
                : isAprobado
                  ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" aria-hidden="true" />
                  : <Clock className="w-4 h-4 text-primary-700 shrink-0 mt-0.5" aria-hidden="true" />
              }
              <p className={`text-xs leading-relaxed ${
                isRechazado ? 'text-red-800' : isAprobado ? 'text-green-800' : 'text-primary-800'
              }`}>
                {sol.notas}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            {isAprobado && (
              <button className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
                <Download className="w-4 h-4" aria-hidden="true" />
                Descargar Certificado
              </button>
            )}
            {isRechazado && (
              <button
                onClick={() => { onClose(); onNueva() }}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
              >
                <PlusCircle className="w-4 h-4" aria-hidden="true" />
                Nueva Solicitud
              </button>
            )}
            <button
              onClick={onClose}
              className={`${isAprobado || isRechazado ? 'flex-1' : 'w-full'} py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 transition-colors`}
            >
              Cerrar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── Filtro Dropdown ──
const ESTADOS_FILTRO = [
  { value: '', label: 'Todos los estados' },
  { value: 'En Proceso', label: 'En Proceso', color: 'bg-yellow-500' },
  { value: 'Aprobado', label: 'Aprobado', color: 'bg-green-500' },
  { value: 'Rechazado', label: 'Rechazado', color: 'bg-red-500' },
]

function FiltroDropdown({ filtro, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const active = ESTADOS_FILTRO.find((e) => e.value === filtro)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
          filtro ? 'text-primary-800' : 'text-text-muted hover:text-primary-800'
        }`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        {filtro ? active?.label : 'Filtrar por estado'}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-44 bg-white border border-border rounded-xl shadow-lg z-20 py-1 overflow-hidden"
          >
            {ESTADOS_FILTRO.map((op) => (
              <button
                key={op.value}
                onClick={() => { onChange(op.value); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-left transition-colors ${
                  filtro === op.value ? 'bg-primary-50 text-primary-800' : 'text-text hover:bg-bg-alt'
                }`}
              >
                {op.color && <span className={`w-2 h-2 rounded-full shrink-0 ${op.color}`} />}
                {op.label}
                {filtro === op.value && <Check className="w-3 h-3 ml-auto text-primary-800" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Solicitudes Table ──
function SolicitudesTable({ rows, onVerDetalle, filtro, onFiltroChange, totalAll, page, totalPages, onPrev, onNext }) {
  const desde = (page - 1) * PAGE_SIZE + 1
  const hasta = Math.min(page * PAGE_SIZE, rows.length + (page - 1) * PAGE_SIZE)

  return (
    <motion.div
      {...fadeUp(0.2)}
      className="bg-white border border-border rounded-xl overflow-hidden"
    >
      {/* Table header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h3 className="text-base font-bold text-text">Solicitudes Recientes</h3>
        <FiltroDropdown filtro={filtro} onChange={onFiltroChange} />
      </div>

      {/* Table */}
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

      {/* Pagination footer */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-bg-alt/30">
        <span className="text-xs text-text-muted">
          {rows.length > 0
            ? `Mostrando ${desde}–${hasta} de ${totalAll} solicitudes`
            : `0 solicitudes${filtro ? ` con estado "${filtro}"` : ''}`}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrev}
            disabled={page === 1}
            className="w-7 h-7 rounded-md border border-border bg-white text-text-muted flex items-center justify-center hover:bg-primary-800 hover:text-white hover:border-primary-800 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Página anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="w-8 text-center text-xs font-semibold text-text-muted">
            {page}/{totalPages || 1}
          </span>
          <button
            onClick={onNext}
            disabled={page >= totalPages}
            className="w-7 h-7 rounded-md border border-border bg-white text-text-muted flex items-center justify-center hover:bg-primary-800 hover:text-white hover:border-primary-800 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Página siguiente"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ── New Request Form ──
function NuevaSolicitudForm({ formRef }) {
  const { user, isAuthenticated } = useAuth()
  const [step, setStep] = useState('form') // 'form' | 'success'
  const [form, setForm] = useState({
    nombre: isAuthenticated ? user?.name : '',
    correo: isAuthenticated ? user?.email : '',
    tipo: '',
    descripcion: '',
  })
  const [archivo, setArchivo] = useState(null)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const fileInputRef = useRef(null)
  const createSolicitud = useCreateSolicitud()

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
    setServerError('')
  }

  const validate = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'Requerido'
    if (!form.correo.trim()) e.correo = 'Requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) e.correo = 'Correo no válido'
    if (!form.tipo) e.tipo = 'Seleccione un tipo'
    if (!form.descripcion.trim()) e.descripcion = 'Requerido'
    else if (form.descripcion.trim().length < 20) e.descripcion = 'Mínimo 20 caracteres'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }

    try {
      await createSolicitud.mutateAsync({
        tipo:        form.tipo,
        descripcion: form.descripcion.trim(),
      })
      setStep('success')
    } catch (err) {
      setServerError(err.message ?? 'No se pudo enviar la solicitud. Intente de nuevo.')
    }
  }

  const handleReset = () => {
    setStep('form')
    setForm({
      nombre: isAuthenticated ? user?.name : '',
      correo: isAuthenticated ? user?.email : '',
      tipo: '',
      descripcion: '',
    })
    setArchivo(null)
    setErrors({})
    setServerError('')
  }

  if (step === 'success') {
    return (
      <motion.div
        ref={formRef}
        {...fadeUp(0.25)}
        className="bg-white border border-border rounded-xl p-6 text-center"
      >
        <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-primary-800" />
        </div>
        <h3 className="text-base font-bold text-text mb-1">Solicitud Enviada</h3>
        <p className="text-sm text-text-muted leading-relaxed mb-6">
          Su solicitud fue recibida. Le notificaremos a{' '}
          <strong className="text-text">{form.correo}</strong> sobre el estado del trámite.
        </p>
        <button
          onClick={handleReset}
          className="w-full py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 transition-colors"
        >
          Hacer otra solicitud
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div
      ref={formRef}
      {...fadeUp(0.25)}
      className="bg-white border border-border rounded-xl p-6"
    >
      <h3 className="text-lg font-bold text-text mb-1">Nueva Solicitud</h3>
      <p className="text-sm text-text-muted mb-5">
        Complete el formulario para iniciar un nuevo proceso administrativo o consulta técnica.
      </p>

      {serverError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 mb-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre */}
        <div>
          <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
            Nombre Completo <span className="text-orange-500" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              placeholder="Nombre completo"
              readOnly={isAuthenticated}
              className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${
                isAuthenticated ? 'bg-bg-alt cursor-default' : 'bg-white focus:border-primary-800'
              } ${errors.nombre ? 'border-red-400' : 'border-border'}`}
            />
          </div>
          {errors.nombre && <p className="text-xs text-red-500 mt-1" role="alert">{errors.nombre}</p>}
        </div>

        {/* Correo */}
        <div>
          <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
            Correo Electrónico <span className="text-orange-500" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" aria-hidden="true" />
            <input
              type="email"
              value={form.correo}
              onChange={(e) => set('correo', e.target.value)}
              placeholder="su@correo.com"
              readOnly={isAuthenticated}
              className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${
                isAuthenticated ? 'bg-bg-alt cursor-default' : 'bg-white focus:border-primary-800'
              } ${errors.correo ? 'border-red-400' : 'border-border'}`}
            />
          </div>
          {errors.correo && <p className="text-xs text-red-500 mt-1" role="alert">{errors.correo}</p>}
        </div>

        {/* Tipo de trámite */}
        <div>
          <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
            Tipo de Trámite <span className="text-orange-500" aria-hidden="true">*</span>
          </label>
          <select
            value={form.tipo}
            onChange={(e) => set('tipo', e.target.value)}
            className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${errors.tipo ? 'border-red-400' : 'border-border focus:border-primary-800'}`}
          >
            {TRAMITE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {errors.tipo && <p className="text-xs text-red-500 mt-1" role="alert">{errors.tipo}</p>}
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
            Descripción <span className="text-orange-500" aria-hidden="true">*</span>
          </label>
          <textarea
            rows={3}
            value={form.descripcion}
            onChange={(e) => set('descripcion', e.target.value)}
            placeholder="Describa el trámite, el predio o área de interés, y cualquier información relevante..."
            className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition resize-none ${errors.descripcion ? 'border-red-400' : 'border-border focus:border-primary-800'}`}
          />
          {errors.descripcion
            ? <p className="text-xs text-red-500 mt-1" role="alert">{errors.descripcion}</p>
            : <p className="text-xs text-text-muted mt-1 text-right">{form.descripcion.length} / 500</p>
          }
        </div>

        {/* File upload */}
        <div>
          <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
            Documentos Adjuntos
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="sr-only"
            aria-label="Cargar documento"
            onChange={(e) => setArchivo(e.target.files[0] || null)}
          />
          {archivo ? (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-primary-50 border border-primary-200 rounded-lg">
              <FileText className="w-4 h-4 text-primary-700 shrink-0" aria-hidden="true" />
              <span className="text-sm text-primary-800 font-medium truncate flex-1">{archivo.name}</span>
              <button
                type="button"
                onClick={() => setArchivo(null)}
                className="text-primary-600 hover:text-primary-800 shrink-0"
                aria-label="Quitar archivo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary-800 hover:bg-primary-800/[0.02] transition-colors"
            >
              <UploadCloud className="w-6 h-6 text-text-muted mx-auto mb-1.5" aria-hidden="true" />
              <p className="text-xs text-text-muted">
                Haga clic para adjuntar archivo
              </p>
              <p className="text-[0.65rem] text-text-muted mt-0.5">PDF, JPG — Máx. 10MB</p>
            </button>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={createSolicitud.isPending}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-800 text-white rounded-lg text-sm font-bold hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {createSolicitud.isPending
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Send className="w-4 h-4" aria-hidden="true" />Enviar Solicitud</>
          }
        </button>
      </form>
    </motion.div>
  )
}

// ── Mis Solicitudes (API) ──
function MisSolicitudes({ onVerDetalle }) {
  const { data, isLoading } = useMisSolicitudes()
  const mis = data?.data ?? []

  if (isLoading || mis.length === 0) return null

  return (
    <motion.div {...fadeUp(0.3)} className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-sm font-bold text-text">Mis Solicitudes</h3>
          <p className="text-[0.65rem] text-text-muted mt-0.5">{mis.length} solicitud{mis.length !== 1 ? 'es' : ''} registrada{mis.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <div className="divide-y divide-border max-h-72 overflow-y-auto">
        {mis.map((s) => (
          <div key={s._id} className="flex items-center gap-3 px-5 py-3 hover:bg-bg-alt/30 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-[0.6rem] font-bold text-primary-800">{s.id}</p>
              <p className="text-xs font-semibold text-text truncate">{s.tipo}</p>
              <p className="text-[0.6rem] text-text-muted">{s.fecha}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-full ${
                s.estadoColor === 'green' ? 'bg-green-100 text-green-700'
                : s.estadoColor === 'red'  ? 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700'
              }`}>{s.estado}</span>
              <button
                onClick={() => onVerDetalle(s)}
                className="p-1 rounded-lg text-text-muted hover:text-primary-800 hover:bg-primary-50 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
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
      <Link
        to="/guia-usuario"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-800 no-underline hover:text-primary-600 transition-colors"
      >
        Consultar Guía Técnica
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </motion.div>
  )
}

// ── Bottom KPIs ──
function BottomStats({ rows }) {
  const total    = rows.length
  const proceso  = rows.filter((r) => r.estado === 'En Proceso').length
  const aprobado = rows.filter((r) => r.estado === 'Aprobado').length
  const tasaStr  = total > 0 ? `${Math.round((aprobado / total) * 100)}%` : '—'
  const kpis = [
    { label: 'Total',      value: String(total) },
    { label: 'En Proceso', value: String(proceso) },
    { label: 'Aprobadas',  value: tasaStr },
    { label: 'Rechazadas', value: String(rows.filter((r) => r.estado === 'Rechazado').length) },
  ]
  return (
    <motion.div
      {...fadeUp(0.4)}
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      {kpis.map((kpi) => (
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
  const [filtroEstado, setFiltroEstado] = useState('')
  const [page, setPage] = useState(1)
  const [detalleItem, setDetalleItem] = useState(null)
  const formRef = useRef(null)

  const { data } = useMisSolicitudes()
  const allRows = data?.data ?? []

  // Reset page on search/filter change
  const handleFiltro = (val) => { setFiltroEstado(val); setPage(1) }

  // Filter rows: search + estado filter
  const allFiltered = allRows.filter((s) => {
    const searchOk = matches([s.id, s.tipo, s.subtipo, s.estado], query)
    const filtroOk = !filtroEstado || s.estado === filtroEstado
    return searchOk && filtroOk
  })

  const totalPages = Math.ceil(allFiltered.length / PAGE_SIZE)
  const pageRows = allFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Focus first editable field after scroll
    setTimeout(() => {
      const first = formRef.current?.querySelector('input:not([readonly]), select, textarea')
      first?.focus()
    }, 400)
  }

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
          <button
            onClick={() => exportCSV(allFiltered)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-border rounded-lg text-sm font-semibold text-text hover:border-primary-800 hover:text-primary-800 transition-colors"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Exportar Reporte
          </button>
          <button
            onClick={scrollToForm}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" aria-hidden="true" />
            Nueva Solicitud
          </button>
        </div>
      </motion.div>

      {/* ── Main content: Table + Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left: Table */}
        <div className="space-y-6">
          <SolicitudesTable
            rows={pageRows}
            onVerDetalle={setDetalleItem}
            filtro={filtroEstado}
            onFiltroChange={handleFiltro}
            totalAll={allFiltered.length}
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </div>

        {/* Right: Form + Mis Solicitudes + Help */}
        <div className="space-y-6">
          <NuevaSolicitudForm formRef={formRef} />
          <MisSolicitudes onVerDetalle={setDetalleItem} />
          <AyudaCTA />
        </div>
      </div>

      {/* ── Bottom KPIs ── */}
      <BottomStats rows={allRows} />

      {/* ── Detalle Modal ── */}
      <AnimatePresence>
        {detalleItem && (
          <DetalleSolicitudModal
            sol={detalleItem}
            onClose={() => setDetalleItem(null)}
            onNueva={scrollToForm}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
