import { useState, useEffect, type FormEvent } from 'react'
import type { FormErrors } from '@/types/forms'
import { motion } from 'framer-motion'
import { Headphones, X, CheckCircle, Send } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { CONSULTA_TYPES } from './documentos.constants'

export function SoporteDocumentalModal({ onClose }: { onClose: () => void }) {
  const { user, isAuthenticated } = useAuth()
  const [step, setStep] = useState('form')
  const [form, setForm] = useState({
    nombre:     isAuthenticated ? (user?.name ?? '') : '',
    correo:     isAuthenticated ? (user?.email ?? '') : '',
    tipo:       '',
    descripcion: '',
  })
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const set = (key: keyof typeof form, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validate = () => {
    const e: FormErrors = {}
    if (!form.nombre.trim()) e.nombre = 'Requerido'
    if (!form.correo.trim()) e.correo = 'Requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) e.correo = 'Correo no válido'
    if (!form.tipo) e.tipo = 'Requerido'
    if (!form.descripcion.trim()) e.descripcion = 'Requerido'
    else if (form.descripcion.trim().length < 20) e.descripcion = 'Mínimo 20 caracteres'
    return e
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setStep('success')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="soporte-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {step === 'success' ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-primary-800" />
            </div>
            <h3 className="font-display text-xl font-bold text-text mb-2">Solicitud Enviada</h3>
            <p className="text-sm text-text-muted leading-relaxed mb-2">
              Su consulta fue recibida correctamente. El equipo de gestión documental
              del IIAP le responderá a{' '}
              <strong className="text-text">{form.correo}</strong>{' '}
              en un plazo máximo de 24 horas hábiles.
            </p>
            <p className="text-xs text-text-muted mb-8">
              También puede comunicarse directamente a{' '}
              <a href="mailto:soportegis@iiap.org.co" className="text-primary-800 hover:underline">
                soportegis@iiap.org.co
              </a>
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
            >
              Entendido
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary-800 rounded-lg flex items-center justify-center">
                  <Headphones className="w-4 h-4 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h3 id="soporte-modal-title" className="text-base font-bold text-text leading-tight">
                    Soporte Documental
                  </h3>
                  <p className="text-xs text-text-muted">Gestión de Datos — IIAP</p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sm-nombre" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Nombre <span className="text-orange-500" aria-hidden="true">*</span>
                  </label>
                  <input id="sm-nombre" type="text" value={form.nombre}
                    onChange={(e) => set('nombre', e.target.value)}
                    placeholder="Su nombre completo" readOnly={isAuthenticated}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${
                      isAuthenticated ? 'bg-bg-alt cursor-default' : 'bg-[var(--card-bg)] focus:border-primary-800'
                    } ${errors.nombre ? 'border-red-400' : 'border-border'}`}
                  />
                  {errors.nombre && <p className="text-xs text-red-500 mt-1" role="alert">{errors.nombre}</p>}
                </div>
                <div>
                  <label htmlFor="sm-correo" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Correo <span className="text-orange-500" aria-hidden="true">*</span>
                  </label>
                  <input id="sm-correo" type="email" value={form.correo}
                    onChange={(e) => set('correo', e.target.value)}
                    placeholder="su@correo.com" readOnly={isAuthenticated}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${
                      isAuthenticated ? 'bg-bg-alt cursor-default' : 'bg-[var(--card-bg)] focus:border-primary-800'
                    } ${errors.correo ? 'border-red-400' : 'border-border'}`}
                  />
                  {errors.correo && <p className="text-xs text-red-500 mt-1" role="alert">{errors.correo}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="sm-tipo" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                  Tipo de consulta <span className="text-orange-500" aria-hidden="true">*</span>
                </label>
                <select id="sm-tipo" value={form.tipo} onChange={(e) => set('tipo', e.target.value)}
                  className={`w-full px-3 py-2.5 bg-[var(--card-bg)] border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${errors.tipo ? 'border-red-400' : 'border-border focus:border-primary-800'}`}
                >
                  {CONSULTA_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {errors.tipo && <p className="text-xs text-red-500 mt-1" role="alert">{errors.tipo}</p>}
              </div>

              <div>
                <label htmlFor="sm-desc" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                  Descripción <span className="text-orange-500" aria-hidden="true">*</span>
                </label>
                <textarea id="sm-desc" rows={4} value={form.descripcion}
                  onChange={(e) => set('descripcion', e.target.value)}
                  placeholder="Describa con detalle el documento o formato que necesita..."
                  className={`w-full px-3 py-2.5 bg-[var(--card-bg)] border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition resize-none ${errors.descripcion ? 'border-red-400' : 'border-border focus:border-primary-800'}`}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.descripcion
                    ? <p className="text-xs text-red-500" role="alert">{errors.descripcion}</p>
                    : <span />
                  }
                  <span className="text-xs text-text-muted ml-auto">{form.descripcion.length} / 500</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 transition-colors"
                >
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                  Enviar Solicitud
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}
