import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, User, Mail, CheckCircle, AlertCircle, Paperclip, X, FileText, Image } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCreateSolicitud, useUploadSolicitudArchivo } from '@/hooks/useSolicitudes'
import { TRAMITE_TYPES } from '@/lib/constants'
import { fadeUp } from '@/lib/animations'

const MAX_DESC      = 1000
const MAX_ARCHIVOS  = 5
const MAX_MB        = 10
const ACCEPT_TYPES  = '.pdf,.jpg,.jpeg,.png,.webp'

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(mime) {
  return mime === 'application/pdf'
    ? <FileText className="w-4 h-4 text-red-500 shrink-0" />
    : <Image className="w-4 h-4 text-blue-500 shrink-0" />
}

export function NuevaSolicitudForm({ formRef }) {
  const { user, isAuthenticated } = useAuth()
  const [showSuccess, setShowSuccess]     = useState(false)
  const [submittedCorreo, setSubmittedCorreo] = useState('')
  const [archivos, setArchivos]           = useState<File[]>([])
  const [archivoError, setArchivoError]   = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    nombre:      isAuthenticated ? (user?.name ?? '') : '',
    correo:      isAuthenticated ? (user?.email ?? '') : '',
    tipo:        '',
    descripcion: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')
  const createSolicitud   = useCreateSolicitud()
  const uploadArchivo     = useUploadSolicitudArchivo()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setArchivoError('')
    const selected = Array.from(e.target.files ?? []) as File[]
    if (!selected.length) return

    const combined = [...archivos, ...selected]
    if (combined.length > MAX_ARCHIVOS) {
      setArchivoError(`Máximo ${MAX_ARCHIVOS} archivos`)
      e.target.value = ''
      return
    }
    const oversized = selected.find((f) => f.size > MAX_MB * 1024 * 1024)
    if (oversized) {
      setArchivoError(`"${oversized.name}" supera los ${MAX_MB} MB`)
      e.target.value = ''
      return
    }
    setArchivos(combined)
    e.target.value = ''
  }

  const removeArchivo = (idx) =>
    setArchivos((prev) => prev.filter((_, i) => i !== idx))

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
    setServerError('')
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.nombre.trim()) e.nombre = 'Requerido'
    if (!form.correo.trim()) e.correo = 'Requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) e.correo = 'Correo no válido'
    if (!form.tipo) e.tipo = 'Seleccione un tipo de trámite'
    if (!form.descripcion.trim()) e.descripcion = 'Requerido'
    else if (form.descripcion.trim().length < 20) e.descripcion = 'Mínimo 20 caracteres'
    else if (form.descripcion.trim().length > MAX_DESC) e.descripcion = `Máximo ${MAX_DESC} caracteres`
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }

    try {
      const solicitud = await createSolicitud.mutateAsync({
        tipo:        form.tipo,
        descripcion: form.descripcion.trim(),
      })
      // Subir archivos adjuntos si hay, de forma secuencial
      const sol = solicitud as any
      if (archivos.length && sol?.id) {
        for (const file of archivos) {
          await uploadArchivo.mutateAsync({ solicitudId: sol.id, file }).catch(() => {})
        }
      }
      setSubmittedCorreo(form.correo ?? '')
      setForm({
        nombre:      isAuthenticated ? (user?.name ?? '') : '',
        correo:      isAuthenticated ? (user?.email ?? '') : '',
        tipo:        '',
        descripcion: '',
      })
      setArchivos([])
      setErrors({})
      setServerError('')
      setArchivoError('')
      setShowSuccess(true)
    } catch (err) {
      if ((err as any)?.response?.status === 429) {
        setServerError('Has alcanzado el límite de solicitudes por día. Intenta mañana.')
      } else {
        setServerError((err as Error)?.message ?? 'No se pudo enviar la solicitud. Intente de nuevo.')
      }
    }
  }

  return (
    <motion.div ref={formRef} {...fadeUp(0.25)} className="bg-white border border-border rounded-xl p-6">
      <AnimatePresence>
        {showSuccess && (
          <>
            <motion.div key="overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowSuccess(false)}
            />
            <motion.div key="modal"
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center pointer-events-auto">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
                  className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-green-200"
                >
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </motion.div>
                <h3 className="font-display text-xl font-bold text-text mb-2">¡Solicitud enviada!</h3>
                <p className="text-sm text-text-muted leading-relaxed mb-1">Su solicitud fue recibida correctamente.</p>
                <p className="text-sm text-text-muted leading-relaxed mb-2">
                  Le notificaremos a <strong className="text-text">{submittedCorreo}</strong> cuando haya novedades.
                </p>
                <p className="text-xs text-text-muted leading-relaxed mb-5">
                  Recibirá un correo de confirmación. Puede adjuntar documentos adicionales desde «Mis Solicitudes» en cualquier momento.
                </p>
                <button onClick={() => setShowSuccess(false)}
                  className="w-full py-3 bg-primary-800 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors">
                  Entendido
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <h3 className="text-lg font-bold text-text mb-1">Nueva Solicitud</h3>
      <p className="text-sm text-text-muted mb-5">
        Complete el formulario para iniciar un proceso administrativo o consulta técnica.
      </p>

      {serverError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 mb-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nsf-nombre" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
            Nombre Completo <span className="text-orange-500" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" aria-hidden="true" />
            <input id="nsf-nombre" type="text" value={form.nombre} onChange={(e) => set('nombre', e.target.value)}
              placeholder="Nombre completo" readOnly={isAuthenticated}
              aria-describedby={errors.nombre ? 'nsf-nombre-err' : undefined}
              aria-invalid={!!errors.nombre}
              className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${
                isAuthenticated ? 'bg-bg-alt cursor-default' : 'bg-white focus:border-primary-800'
              } ${errors.nombre ? 'border-red-400' : 'border-border'}`}
            />
          </div>
          {errors.nombre && <p id="nsf-nombre-err" role="alert" className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
        </div>

        <div>
          <label htmlFor="nsf-correo" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
            Correo Electrónico <span className="text-orange-500" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" aria-hidden="true" />
            <input id="nsf-correo" type="email" value={form.correo} onChange={(e) => set('correo', e.target.value)}
              placeholder="su@correo.com" readOnly={isAuthenticated}
              aria-describedby={errors.correo ? 'nsf-correo-err' : undefined}
              aria-invalid={!!errors.correo}
              className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${
                isAuthenticated ? 'bg-bg-alt cursor-default' : 'bg-white focus:border-primary-800'
              } ${errors.correo ? 'border-red-400' : 'border-border'}`}
            />
          </div>
          {errors.correo && <p id="nsf-correo-err" role="alert" className="text-xs text-red-500 mt-1">{errors.correo}</p>}
        </div>

        <div>
          <label htmlFor="nsf-tipo" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
            Tipo de Trámite <span className="text-orange-500" aria-hidden="true">*</span>
          </label>
          <select id="nsf-tipo" value={form.tipo} onChange={(e) => set('tipo', e.target.value)}
            aria-describedby={errors.tipo ? 'nsf-tipo-err' : undefined}
            aria-invalid={!!errors.tipo}
            className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${errors.tipo ? 'border-red-400' : 'border-border focus:border-primary-800'}`}
          >
            {TRAMITE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {errors.tipo && <p id="nsf-tipo-err" role="alert" className="text-xs text-red-500 mt-1">{errors.tipo}</p>}
        </div>

        <div>
          <label htmlFor="nsf-descripcion" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
            Descripción <span className="text-orange-500" aria-hidden="true">*</span>
          </label>
          <textarea id="nsf-descripcion" rows={4} value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)}
            placeholder="Describa el trámite, el predio o área de interés, y cualquier información relevante..."
            maxLength={MAX_DESC}
            aria-describedby={errors.descripcion ? 'nsf-desc-err' : 'nsf-desc-hint'}
            aria-invalid={!!errors.descripcion}
            className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition resize-none ${errors.descripcion ? 'border-red-400' : 'border-border focus:border-primary-800'}`}
          />
          <div className="flex items-start justify-between mt-1">
            {errors.descripcion
              ? <p id="nsf-desc-err" role="alert" className="text-xs text-red-500">{errors.descripcion}</p>
              : <p id="nsf-desc-hint" className="text-xs text-text-muted">Mínimo 20 caracteres</p>
            }
            <p className={`text-xs ml-2 shrink-0 ${form.descripcion.length > MAX_DESC * 0.9 ? 'text-orange-500' : 'text-text-muted'}`}>
              {form.descripcion.length} / {MAX_DESC}
            </p>
          </div>
        </div>

        {/* Archivos adjuntos (opcional) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted">
              Documentos adjuntos <span className="text-text-muted font-normal">(opcional, máx. {MAX_ARCHIVOS})</span>
            </label>
            {archivos.length < MAX_ARCHIVOS && (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 text-xs text-primary-700 hover:text-primary-900 font-medium transition-colors">
                <Paperclip className="w-3.5 h-3.5" />
                Adjuntar
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept={ACCEPT_TYPES} multiple className="hidden"
            onChange={handleFileChange} />

          {archivos.length > 0 && (
            <ul className="space-y-1.5 mb-2">
              {archivos.map((f, i) => (
                <li key={i} className="flex items-center gap-2 bg-bg-alt border border-border rounded-lg px-3 py-2">
                  {fileIcon(f.type)}
                  <span className="text-xs text-text truncate flex-1">{f.name}</span>
                  <span className="text-xs text-text-muted shrink-0">{formatBytes(f.size)}</span>
                  <button type="button" onClick={() => removeArchivo(i)}
                    className="text-text-muted hover:text-red-500 transition-colors ml-1" aria-label="Quitar archivo">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {archivos.length === 0 && (
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-border rounded-lg py-3 text-xs text-text-muted hover:border-primary-700 hover:text-primary-700 transition-colors">
              <Paperclip className="w-4 h-4" />
              PDF, JPEG, PNG o WebP — máx. {MAX_MB} MB por archivo
            </button>
          )}
          {archivoError && <p className="text-xs text-red-500 mt-1" role="alert">{archivoError}</p>}
        </div>

        <button type="submit" disabled={createSolicitud.isPending || uploadArchivo.isPending}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-800 text-white rounded-lg text-sm font-bold hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
          {createSolicitud.isPending || uploadArchivo.isPending
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                {uploadArchivo.isPending ? 'Subiendo archivos…' : 'Enviando…'}</>
            : <><Send className="w-4 h-4" aria-hidden="true" />Enviar Solicitud</>
          }
        </button>
      </form>
    </motion.div>
  )
}
