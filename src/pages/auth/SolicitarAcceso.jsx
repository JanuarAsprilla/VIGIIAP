import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus, ArrowLeft, CheckCircle, Mail, User,
  Building2, FileText, Briefcase, AlertCircle,
} from 'lucide-react'
import AuthLayout from '@/components/AuthLayout'

const ROLES = [
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
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ nombre: '', email: '', institucion: '', rol: '', motivo: '', terminos: false })
  const [errors, setErrors] = useState({})

  const set = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: undefined })) }

  const validate = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido'
    if (!form.email.trim()) e.email = 'El correo es requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Correo no válido'
    if (!form.institucion.trim()) e.institucion = 'La institución es requerida'
    if (!form.rol) e.rol = 'Seleccione un perfil de acceso'
    if (!form.motivo.trim()) e.motivo = 'Describa el motivo de la solicitud'
    else if (form.motivo.trim().length < 30) e.motivo = 'Mínimo 30 caracteres'
    if (!form.terminos) e.terminos = 'Debe aceptar los términos para continuar'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSent(true)
  }

  return (
    <AuthLayout>
      <AnimatePresence mode="wait">
        {sent ? (
          /* ── Success ── */
          <motion.div key="success"
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-4">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
              className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-primary-100">
              <CheckCircle className="w-10 h-10 text-primary-700" />
            </motion.div>
            <h2 className="font-display text-2xl font-bold text-text mb-2">Solicitud Enviada</h2>
            <p className="text-sm text-text-muted leading-relaxed mb-2 max-w-sm mx-auto">
              Su solicitud fue recibida correctamente. El administrador del sistema la revisará
              y le enviará las credenciales a{' '}
              <strong className="text-text">{form.email}</strong>.
            </p>
            <p className="text-xs text-text-muted mb-8">
              Tiempo estimado de respuesta: <strong>1–3 días hábiles</strong>
            </p>
            <div className="flex flex-col gap-2">
              <Link to="/login"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary-800 text-white rounded-xl text-sm font-semibold no-underline hover:bg-primary-700 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Ir al inicio de sesión
              </Link>
              <Link to="/"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-border text-text-muted rounded-xl text-sm font-semibold no-underline hover:border-primary-800 hover:text-primary-800 transition-colors">
                Explorar el portal
              </Link>
            </div>
          </motion.div>
        ) : (
          /* ── Form ── */
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mb-7">
              <h2 className="font-display text-2xl font-bold text-text mb-1">Solicitar Acceso</h2>
              <p className="text-sm text-text-muted">
                Complete el formulario. Un administrador revisará su solicitud y le enviará las credenciales.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Nombre */}
              <Field label="Nombre Completo" icon={User} error={errors.nombre}>
                <input type="text" value={form.nombre} onChange={(e) => set('nombre', e.target.value)}
                  placeholder="Ej. Juan Pérez García" className={inputCls(errors.nombre)} />
              </Field>

              {/* Email */}
              <Field label="Correo Electrónico" icon={Mail} error={errors.email}>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                  placeholder="correo@institucion.org" className={inputCls(errors.email)} />
              </Field>

              {/* Institución */}
              <Field label="Institución / Organización" icon={Building2} error={errors.institucion}>
                <input type="text" value={form.institucion} onChange={(e) => set('institucion', e.target.value)}
                  placeholder="Nombre de la institución" className={inputCls(errors.institucion)} />
              </Field>

              {/* Rol */}
              <Field label="Perfil de Acceso Requerido" icon={Briefcase} error={errors.rol}>
                <select value={form.rol} onChange={(e) => set('rol', e.target.value)}
                  className={inputCls(errors.rol).replace('pl-10', 'pl-10')}>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </Field>

              {/* Motivo */}
              <Field label="Motivo de la Solicitud" icon={FileText} error={errors.motivo}
                hint="Describa para qué proyecto o investigación necesita acceso">
                <textarea rows={3} value={form.motivo} onChange={(e) => set('motivo', e.target.value)}
                  placeholder="Indique el proyecto, institución y propósito del acceso solicitado..."
                  className={`${inputCls(errors.motivo)} resize-none`} />
              </Field>

              {/* Términos */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.terminos}
                    onChange={(e) => set('terminos', e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-primary-800 rounded shrink-0" />
                  <span className="text-xs text-text-muted leading-relaxed">
                    Acepto los{' '}
                    <Link to="/terminos" className="font-semibold text-primary-800 hover:underline no-underline">
                      Términos y Condiciones
                    </Link>
                    {' '}de uso del portal VIGIIAP y el tratamiento de mis datos personales por el IIAP.
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

              <button type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary-800 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors shadow-sm">
                <UserPlus className="w-4 h-4" />
                Enviar Solicitud
              </button>
            </form>

            <div className="text-center mt-6 pt-5 border-t border-border">
              <Link to="/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-800 no-underline hover:text-primary-600 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Ya tengo cuenta — Iniciar sesión
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}
