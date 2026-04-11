import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus, ArrowLeft, CheckCircle, Mail, User,
  Building2, FileText, Briefcase, AlertCircle,
} from 'lucide-react'
import AuthLayout from '@/components/AuthLayout'
import { useAuth } from '@/contexts/AuthContext'
import {
  validateEmail, validateRequired, validateMinLength,
  validateSelect, validateCheckbox,
} from '@/lib/validators'

const PERFILES = [
  { value: '',              label: 'Seleccione el perfil de acceso...' },
  { value: 'investigador',  label: 'Investigador / Científico'          },
  { value: 'tecnico',       label: 'Técnico SIG / Analista Territorial' },
  { value: 'institucional', label: 'Funcionario Institucional'          },
  { value: 'publico',       label: 'Usuario Público General'            },
]

function Field({ label, icon: Icon, error, hint, children }) {
  return (
    <div>
      <label className="block text-[0.8rem] font-semibold text-text mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted pointer-events-none" />}
        {children}
      </div>
      {hint && !error && <p className="text-[0.7rem] text-text-muted mt-1">{hint}</p>}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />{error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

const inputCls = (err) =>
  `w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm text-text placeholder:text-text-muted bg-white focus:outline-none focus:ring-2 transition ${
    err ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10'
        : 'border-border focus:border-primary-800 focus:ring-primary-800/10'
  }`

export default function SolicitarAcceso() {
  const { register } = useAuth()
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [form, setForm] = useState({
    nombre: '', email: '', password: '', institucion: '',
    perfil: '', motivo: '', terminos: false,
  })
  const [errors, setErrors] = useState({})

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }))
    setErrors((p) => ({ ...p, [k]: undefined }))
    setServerError('')
  }

  const validate = () => {
    const e = {}
    if (validateRequired(form.nombre, 'El nombre completo'))      e.nombre     = validateRequired(form.nombre, 'El nombre completo')
    if (validateEmail(form.email))                                e.email      = validateEmail(form.email)
    if (!form.password || form.password.length < 8)              e.password   = 'Mínimo 8 caracteres'
    if (validateRequired(form.institucion, 'La institución'))     e.institucion= validateRequired(form.institucion, 'La institución')
    if (validateSelect(form.perfil, 'un perfil'))                 e.perfil     = validateSelect(form.perfil, 'un perfil')
    if (validateMinLength(form.motivo, 10, 'El motivo'))          e.motivo     = validateMinLength(form.motivo, 10, 'El motivo')
    if (validateCheckbox(form.terminos, 'Debe aceptar los términos')) e.terminos = validateCheckbox(form.terminos, 'Debe aceptar los términos')
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await register({
        nombre:      form.nombre,
        email:       form.email,
        password:    form.password,
        institucion: form.institucion,
        motivo:      `[${form.perfil}] ${form.motivo}`,
      })
      setSent(true)
    } catch (err) {
      setServerError(err.message ?? 'No se pudo enviar la solicitud. Intente de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div key="success"
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }} className="text-center py-4">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
              className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-primary-100">
              <CheckCircle className="w-10 h-10 text-primary-700" />
            </motion.div>
            <h2 className="font-display text-2xl font-bold text-text mb-2">Solicitud Enviada</h2>
            <p className="text-sm text-text-muted leading-relaxed mb-2 max-w-sm mx-auto">
              Su solicitud fue recibida. Un administrador la revisará y le enviará las credenciales a{' '}
              <strong className="text-text">{form.email}</strong>.
            </p>
            <p className="text-xs text-text-muted mb-8">Tiempo estimado: <strong>1–3 días hábiles</strong></p>
            <div className="flex flex-col gap-2">
              <Link to="/login"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary-800 text-white rounded-xl text-sm font-semibold no-underline hover:bg-primary-700 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Ir al inicio de sesión
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mb-7">
              <h2 className="font-display text-2xl font-bold text-text mb-1">Solicitar Acceso</h2>
              <p className="text-sm text-text-muted">Complete el formulario. Un administrador revisará su solicitud.</p>
            </div>

            <AnimatePresence>
              {serverError && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{serverError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Field label="Nombre Completo" icon={User} error={errors.nombre}>
                <input type="text" value={form.nombre} onChange={(e) => set('nombre', e.target.value)}
                  placeholder="Ej. Juan Pérez García" className={inputCls(errors.nombre)} />
              </Field>

              <Field label="Correo Electrónico" icon={Mail} error={errors.email}>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                  placeholder="correo@institucion.org" className={inputCls(errors.email)} />
              </Field>

              <Field label="Contraseña" icon={FileText} error={errors.password}
                hint="Mínimo 8 caracteres">
                <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)}
                  placeholder="Cree una contraseña segura" className={inputCls(errors.password)} />
              </Field>

              <Field label="Institución / Organización" icon={Building2} error={errors.institucion}>
                <input type="text" value={form.institucion} onChange={(e) => set('institucion', e.target.value)}
                  placeholder="Nombre de la institución" className={inputCls(errors.institucion)} />
              </Field>

              <Field label="Perfil de Acceso Requerido" icon={Briefcase} error={errors.perfil}>
                <select value={form.perfil} onChange={(e) => set('perfil', e.target.value)}
                  className={inputCls(errors.perfil)}>
                  {PERFILES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </Field>

              <Field label="Motivo de la Solicitud" icon={FileText} error={errors.motivo}
                hint="Describa para qué proyecto o investigación necesita acceso">
                <textarea rows={3} value={form.motivo} onChange={(e) => set('motivo', e.target.value)}
                  placeholder="Indique el proyecto, institución y propósito del acceso solicitado..."
                  className={`${inputCls(errors.motivo)} resize-none`} />
              </Field>

              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.terminos}
                    onChange={(e) => set('terminos', e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-primary-800 rounded shrink-0" />
                  <span className="text-xs text-text-muted leading-relaxed">
                    Acepto los{' '}
                    <Link to="/terminos" className="font-semibold text-primary-800 hover:underline no-underline">
                      Términos y Condiciones
                    </Link>{' '}
                    y el tratamiento de mis datos personales por el IIAP.
                  </span>
                </label>
                <AnimatePresence>
                  {errors.terminos && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.terminos}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary-800 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm">
                {loading
                  ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><UserPlus className="w-4 h-4" />Enviar Solicitud</>
                }
              </button>
            </form>

            <div className="text-center mt-6 pt-5 border-t border-border">
              <Link to="/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-800 no-underline hover:text-primary-600 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Ya tengo cuenta — Iniciar sesión
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}
