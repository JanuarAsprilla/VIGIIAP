import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PlusCircle, Send, X, CheckCircle } from 'lucide-react'
import { validateRequired, validateMinLength, validateSelect } from '@/lib/validators'

const TOOL_TYPES = [
  { value: '',                label: 'Seleccione el tipo de herramienta...' },
  { value: 'analisis-espacial', label: 'Análisis Espacial'               },
  { value: 'conversion',       label: 'Conversión de Datos'               },
  { value: 'visualizacion',    label: 'Visualización Cartográfica'         },
  { value: 'campo',            label: 'Captura en Campo'                   },
  { value: 'estadistica',      label: 'Estadística Ambiental'              },
  { value: 'otro',             label: 'Otro'                               },
]

export default function SolicitarHerramientaModal({ onClose }) {
  const [step,   setStep]   = useState('form') // 'form' | 'success'
  const [form,   setForm]   = useState({ nombre: '', tipo: '', descripcion: '', justificacion: '' })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }))
    setErrors((p) => ({ ...p, [k]: undefined }))
  }

  const validate = () => {
    const e = {}
    const nombreErr = validateRequired(form.nombre, 'El nombre')
    const tipoErr   = validateSelect(form.tipo, 'un tipo de herramienta')
    const descErr   = validateMinLength(form.descripcion, 20, 'La descripción')
    if (nombreErr) e.nombre = nombreErr
    if (tipoErr)   e.tipo   = tipoErr
    if (descErr)   e.descripcion = descErr
    return e
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setStep('success')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="solicitar-herramienta-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {step === 'success' ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-primary-800" />
            </div>
            <h3 className="font-display text-xl font-bold text-text mb-2">Solicitud Enviada</h3>
            <p className="text-sm text-text-muted leading-relaxed mb-2">
              Su solicitud para <strong className="text-text">"{form.nombre}"</strong> fue registrada.
              El equipo SIG del IIAP la revisará y le notificará por correo.
            </p>
            <p className="text-xs text-text-muted mb-8">Tiempo estimado de respuesta: 3–5 días hábiles</p>
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
                  <PlusCircle className="w-4 h-4 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h3 id="solicitar-herramienta-title" className="text-base font-bold text-text leading-tight">
                    Solicitar Nueva Herramienta
                  </h3>
                  <p className="text-xs text-text-muted">Equipo SIG — IIAP</p>
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

            <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
              <div>
                <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                  Nombre de la herramienta <span className="text-orange-500" aria-hidden="true">*</span>
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => set('nombre', e.target.value)}
                  placeholder="ej. Análisis de Fragmentación de Hábitat"
                  className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${
                    errors.nombre ? 'border-red-400' : 'border-border focus:border-primary-800'
                  }`}
                />
                {errors.nombre && <p className="text-xs text-red-500 mt-1" role="alert">{errors.nombre}</p>}
              </div>

              <div>
                <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                  Tipo de herramienta <span className="text-orange-500" aria-hidden="true">*</span>
                </label>
                <select
                  value={form.tipo}
                  onChange={(e) => set('tipo', e.target.value)}
                  className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${
                    errors.tipo ? 'border-red-400' : 'border-border focus:border-primary-800'
                  }`}
                >
                  {TOOL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {errors.tipo && <p className="text-xs text-red-500 mt-1" role="alert">{errors.tipo}</p>}
              </div>

              <div>
                <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                  Descripción funcional <span className="text-orange-500" aria-hidden="true">*</span>
                </label>
                <textarea
                  rows={3}
                  value={form.descripcion}
                  onChange={(e) => set('descripcion', e.target.value)}
                  placeholder="¿Qué debería hacer esta herramienta? ¿Qué datos procesa?"
                  className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${
                    errors.descripcion ? 'border-red-400' : 'border-border focus:border-primary-800'
                  }`}
                />
                <div className="flex justify-between mt-1">
                  {errors.descripcion
                    ? <p className="text-xs text-red-500" role="alert">{errors.descripcion}</p>
                    : <span />
                  }
                  <span className="text-xs text-text-muted ml-auto">{form.descripcion.length}/300</span>
                </div>
              </div>

              <div>
                <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                  Justificación o caso de uso{' '}
                  <span className="text-text-muted font-normal normal-case">(opcional)</span>
                </label>
                <textarea
                  rows={2}
                  value={form.justificacion}
                  onChange={(e) => set('justificacion', e.target.value)}
                  placeholder="¿Para qué proyecto o investigación la necesita?"
                  className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm resize-none focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
                />
              </div>

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
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
                >
                  <Send className="w-4 h-4" />
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
