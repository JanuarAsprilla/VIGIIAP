import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, User, Mail, UploadCloud, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCreateSolicitud } from '@/hooks/useSolicitudes'
import { TRAMITE_TYPES } from '@/lib/constants'
import { fadeUp } from '@/lib/animations'

export function NuevaSolicitudForm({ formRef }) {
  const { user, isAuthenticated } = useAuth()
  const [showSuccess, setShowSuccess] = useState(false)
  const [submittedCorreo, setSubmittedCorreo] = useState('')
  const [form, setForm] = useState({
    nombre:     isAuthenticated ? user?.name : '',
    correo:     isAuthenticated ? user?.email : '',
    tipo:       '',
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
      setSubmittedCorreo(form.correo)
      setForm({
        nombre:     isAuthenticated ? user?.name : '',
        correo:     isAuthenticated ? user?.email : '',
        tipo:       '',
        descripcion: '',
      })
      setArchivo(null)
      setErrors({})
      setServerError('')
      setShowSuccess(true)
    } catch (err) {
      setServerError(err.message ?? 'No se pudo enviar la solicitud. Intente de nuevo.')
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
                <p className="text-sm text-text-muted leading-relaxed mb-6">
                  Le notificaremos a <strong className="text-text">{submittedCorreo}</strong> cuando haya novedades.
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
        Complete el formulario para iniciar un nuevo proceso administrativo o consulta técnica.
      </p>

      {serverError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 mb-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
            Nombre Completo <span className="text-orange-500" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" aria-hidden="true" />
            <input type="text" value={form.nombre} onChange={(e) => set('nombre', e.target.value)}
              placeholder="Nombre completo" readOnly={isAuthenticated}
              className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${
                isAuthenticated ? 'bg-bg-alt cursor-default' : 'bg-white focus:border-primary-800'
              } ${errors.nombre ? 'border-red-400' : 'border-border'}`}
            />
          </div>
          {errors.nombre && <p className="text-xs text-red-500 mt-1" role="alert">{errors.nombre}</p>}
        </div>

        <div>
          <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
            Correo Electrónico <span className="text-orange-500" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" aria-hidden="true" />
            <input type="email" value={form.correo} onChange={(e) => set('correo', e.target.value)}
              placeholder="su@correo.com" readOnly={isAuthenticated}
              className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${
                isAuthenticated ? 'bg-bg-alt cursor-default' : 'bg-white focus:border-primary-800'
              } ${errors.correo ? 'border-red-400' : 'border-border'}`}
            />
          </div>
          {errors.correo && <p className="text-xs text-red-500 mt-1" role="alert">{errors.correo}</p>}
        </div>

        <div>
          <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
            Tipo de Trámite <span className="text-orange-500" aria-hidden="true">*</span>
          </label>
          <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)}
            className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${errors.tipo ? 'border-red-400' : 'border-border focus:border-primary-800'}`}
          >
            {TRAMITE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {errors.tipo && <p className="text-xs text-red-500 mt-1" role="alert">{errors.tipo}</p>}
        </div>

        <div>
          <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
            Descripción <span className="text-orange-500" aria-hidden="true">*</span>
          </label>
          <textarea rows={3} value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)}
            placeholder="Describa el trámite, el predio o área de interés, y cualquier información relevante..."
            className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition resize-none ${errors.descripcion ? 'border-red-400' : 'border-border focus:border-primary-800'}`}
          />
          {errors.descripcion
            ? <p className="text-xs text-red-500 mt-1" role="alert">{errors.descripcion}</p>
            : <p className="text-xs text-text-muted mt-1 text-right">{form.descripcion.length} / 500</p>
          }
        </div>

        <div>
          <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
            Documentos Adjuntos
          </label>
          <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
            className="sr-only" aria-label="Cargar documento"
            onChange={(e) => setArchivo(e.target.files[0] || null)}
          />
          {archivo ? (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-primary-50 border border-primary-200 rounded-lg">
              <FileText className="w-4 h-4 text-primary-700 shrink-0" aria-hidden="true" />
              <span className="text-sm text-primary-800 font-medium truncate flex-1">{archivo.name}</span>
              <button type="button" onClick={() => setArchivo(null)}
                className="text-primary-600 hover:text-primary-800 shrink-0" aria-label="Quitar archivo">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary-800 hover:bg-primary-800/[0.02] transition-colors">
              <UploadCloud className="w-6 h-6 text-text-muted mx-auto mb-1.5" aria-hidden="true" />
              <p className="text-xs text-text-muted">Haga clic para adjuntar archivo</p>
              <p className="text-[0.65rem] text-text-muted mt-0.5">PDF, JPG — Máx. 10MB</p>
            </button>
          )}
        </div>

        <button type="submit" disabled={createSolicitud.isPending}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-800 text-white rounded-lg text-sm font-bold hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
          {createSolicitud.isPending
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Send className="w-4 h-4" aria-hidden="true" />Enviar Solicitud</>
          }
        </button>
      </form>
    </motion.div>
  )
}
