import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlusCircle, X, ChevronRight, CheckCircle } from 'lucide-react'
import { ANALYSIS_TYPES, ANALYSIS_DEPARTMENTS } from '@/lib/constants'

export default function NuevoAnalisisModal({ onClose }) {
  const [step, setStep] = useState('form') // 'form' | 'success'
  const [form, setForm] = useState({ nombre: '', tipo: '', departamento: '', notas: '' })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'Requerido'
    if (!form.tipo) e.tipo = 'Requerido'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setStep('success')
  }

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative bg-white rounded-2xl shadow-float w-full max-w-md overflow-hidden"
        >
          {step === 'success' ? (
            /* ── Success state ── */
            <div className="p-8 text-center">
              <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-primary-800" />
              </div>
              <h3 className="font-display text-xl font-bold text-text mb-2">Análisis Creado</h3>
              <p className="text-sm text-text-muted mb-2">
                <strong className="text-text">"{form.nombre}"</strong> ha sido registrado correctamente.
              </p>
              <p className="text-xs text-text-muted mb-6">
                El equipo técnico procesará su solicitud en las próximas 24 horas hábiles.
              </p>
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
              >
                Entendido
              </button>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary-800 rounded-lg flex items-center justify-center">
                    <PlusCircle className="w-4.5 h-4.5 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 id="modal-title" className="text-base font-bold text-text leading-tight">Nuevo Análisis</h3>
                    <p className="text-xs text-text-muted">Solicitud de análisis territorial</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Cerrar modal"
                  className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Nombre del análisis <span className="text-orange-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Cobertura Cuenca Atrato 2026"
                    value={form.nombre}
                    onChange={(e) => set('nombre', e.target.value)}
                    className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${errors.nombre ? 'border-red-400 focus:border-red-400' : 'border-border focus:border-primary-800'}`}
                  />
                  {errors.nombre && <p className="text-xs text-red-500 mt-1" role="alert">{errors.nombre}</p>}
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Tipo de análisis <span className="text-orange-500" aria-hidden="true">*</span>
                  </label>
                  <select
                    value={form.tipo}
                    onChange={(e) => set('tipo', e.target.value)}
                    className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${errors.tipo ? 'border-red-400 focus:border-red-400' : 'border-border focus:border-primary-800'}`}
                  >
                    {ANALYSIS_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  {errors.tipo && <p className="text-xs text-red-500 mt-1" role="alert">{errors.tipo}</p>}
                </div>

                {/* Departamento */}
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Área de interés
                  </label>
                  <select
                    value={form.departamento}
                    onChange={(e) => set('departamento', e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
                  >
                    {ANALYSIS_DEPARTMENTS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Notas adicionales
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describa el objetivo del análisis o capas de interés..."
                    value={form.notas}
                    onChange={(e) => set('notas', e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition resize-none"
                  />
                </div>

                {/* Capas sugeridas */}
                {form.tipo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex flex-wrap gap-2 pt-1"
                  >
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted w-full">
                      Capas recomendadas
                    </span>
                    {['Mapas Temáticos', 'Geovisor SIAT-PC', 'Red Hídrica'].map((c) => (
                      <span key={c} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-800 rounded-full text-xs font-medium">
                        <ChevronRight className="w-3 h-3" aria-hidden="true" />
                        {c}
                      </span>
                    ))}
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
                  >
                    Iniciar Análisis
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
