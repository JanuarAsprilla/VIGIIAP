import { useState } from 'react'
import { validatePasswordStrength, validatePasswordMatch, passwordCriteria } from '@/lib/validators'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mail, Building2, Shield, Bell, Palette,
  Lock, Eye, EyeOff, CheckCircle, AlertCircle,
  Camera, LogOut, ChevronRight, Layers, Monitor, Sun,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useUI } from '@/contexts/UIContext'
import { useNavigate, Link } from 'react-router-dom'
import { useUpdatePassword } from '@/hooks/useUsuarios'

// ── Section wrapper ──
function Section({ title, description, children }) {
  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="font-semibold text-text">{title}</h3>
        {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ── Field row ──
function FieldRow({ label, value, editable, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-0.5">{label}</p>
        {children ?? <p className="text-sm text-text font-medium">{value}</p>}
      </div>
      {editable && (
        <span className="text-xs text-primary-800 font-semibold shrink-0 cursor-pointer hover:text-primary-600 transition-colors">
          Editar
        </span>
      )}
    </div>
  )
}

// ── Password strength meter ──
function PasswordStrengthMeter({ value }) {
  const criteria = passwordCriteria(value)
  const met      = Object.values(criteria).filter(Boolean).length
  if (!value) return null
  const bars = [
    met <= 1 ? 'bg-red-400'   : 'bg-bg-alt',
    met >= 2 ? 'bg-amber-400' : 'bg-bg-alt',
    met >= 3 ? 'bg-amber-400' : 'bg-bg-alt',
    met >= 4 ? 'bg-green-500' : 'bg-bg-alt',
  ]
  const label =
    met <= 1 ? { text: 'Muy débil',  color: 'text-red-500'   } :
    met === 2 ? { text: 'Débil',     color: 'text-amber-500' } :
    met === 3 ? { text: 'Moderada',  color: 'text-amber-600' } :
               { text: 'Segura',     color: 'text-green-600' }
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {bars.map((cls, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${cls}`} />
        ))}
      </div>
      <p className={`text-xs font-semibold ${label.color}`}>{label.text}</p>
    </motion.div>
  )
}

// ── Password section ──
function CambiarPassword() {
  const [form, setForm] = useState({ actual: '', nueva: '', confirmar: '' })
  const [show, setShow] = useState({ actual: false, nueva: false, confirmar: false })
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState('')
  const updatePassword = useUpdatePassword()

  const set = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: undefined })); setServerError('') }

  const validate = () => {
    const e = {}
    if (!form.actual)         e.actual    = 'Ingrese su contraseña actual'
    const nuevaErr            = validatePasswordStrength(form.nueva)
    if (nuevaErr)             e.nueva     = nuevaErr
    const confirmarErr        = validatePasswordMatch(form.nueva, form.confirmar)
    if (confirmarErr)         e.confirmar = confirmarErr
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    try {
      await updatePassword.mutateAsync({ currentPassword: form.actual, newPassword: form.nueva })
      setSuccess(true)
      setForm({ actual: '', nueva: '', confirmar: '' })
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      setServerError(err.message ?? 'No se pudo actualizar la contraseña.')
    }
  }

  const inputCls = (err) =>
    `w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm text-text placeholder:text-text-muted bg-white focus:outline-none focus:ring-2 transition ${
      err ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10'
          : 'border-border focus:border-primary-800 focus:ring-primary-800/10'
    }`

  const PasswordInput = ({ field, placeholder }) => (
    <div className="relative">
      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
      <input
        type={show[field] ? 'text' : 'password'}
        value={form[field]}
        onChange={(e) => set(field, e.target.value)}
        placeholder={placeholder}
        className={inputCls(errors[field])}
      />
      <button
        type="button"
        onClick={() => setShow((p) => ({ ...p, [field]: !p[field] }))}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
      >
        {show[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
      <AnimatePresence>
        {errors[field] && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />{errors[field]}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2.5 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Contraseña actualizada correctamente.
          </motion.div>
        )}
        {serverError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {serverError}
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
          Contraseña actual
        </label>
        <PasswordInput field="actual" placeholder="Tu contraseña actual" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
          Nueva contraseña
        </label>
        <PasswordInput field="nueva" placeholder="Mín. 8 caracteres, mayúscula, número o símbolo" />
        <PasswordStrengthMeter value={form.nueva} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
          Confirmar nueva contraseña
        </label>
        <PasswordInput field="confirmar" placeholder="Repita la nueva contraseña" />
      </div>

      <button type="submit" disabled={updatePassword.isPending}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-60 transition-colors">
        {updatePassword.isPending
          ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <Shield className="w-4 h-4" />}
        Actualizar contraseña
      </button>
    </form>
  )
}

// ── Notificaciones section ──
function Notificaciones() {
  const { notifPrefs: prefs, setNotifPrefs: setPrefs } = useUI()

  const toggle = (k) => setPrefs((p) => ({ ...p, [k]: !p[k] }))

  const items = [
    { key: 'noticias',   label: 'Nuevas noticias',           desc: 'Alertas cuando se publique contenido nuevo' },
    { key: 'solicitudes', label: 'Estado de solicitudes',    desc: 'Cambios en el estado de tus trámites' },
    { key: 'mapas',      label: 'Actualizaciones de mapas',  desc: 'Nuevas capas o versiones de mapas' },
    { key: 'email',      label: 'Resumen por correo',        desc: 'Recibir resumen semanal de actividad' },
  ]

  return (
    <div className="space-y-0 divide-y divide-border">
      {items.map(({ key, label, desc }) => (
        <div key={key} className="flex items-center justify-between gap-4 py-3">
          <div>
            <p className="text-sm font-medium text-text">{label}</p>
            <p className="text-xs text-text-muted">{desc}</p>
          </div>
          <button
            onClick={() => toggle(key)}
            aria-pressed={prefs[key]}
            className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${prefs[key] ? 'bg-primary-800' : 'bg-border'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${prefs[key] ? 'left-5' : 'left-1'}`} />
          </button>
        </div>
      ))}
    </div>
  )
}

// ── Apariencia section ──
function Apariencia() {
  const { density, setDensity } = useUI()

  const densityOptions = [
    { value: 'compact', label: 'Compacto', Icon: Layers,  desc: 'Más contenido en pantalla' },
    { value: 'normal',  label: 'Normal',   Icon: Monitor, desc: 'Espaciado equilibrado'    },
    { value: 'comodo',  label: 'Cómodo',   Icon: Sun,     desc: 'Mayor legibilidad'         },
  ]

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
          Densidad del contenido
        </p>
        <div className="grid grid-cols-3 gap-3">
          {densityOptions.map(({ value, label, Icon, desc }) => (
            <button
              key={value}
              onClick={() => setDensity(value)}
              className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-2 text-center transition-all ${
                density === value
                  ? 'bg-primary-50 border-primary-800 text-primary-800'
                  : 'border-border text-text-muted hover:border-primary-300 hover:text-text'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-bold">{label}</span>
              <span className="text-[0.65rem] leading-tight opacity-70">{desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main ──
export default function Perfil() {
  const { user, logout } = useAuth()
  const { density } = useUI()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const roleColor = {
    'Administrador SIG': 'bg-red-100 text-red-700',
    'Investigador':      'bg-gold-100 text-gold-700',
    'Público':           'bg-primary-100 text-primary-700',
  }[user?.role] ?? 'bg-bg-alt text-text-muted'

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="page-header-tag">Cuenta de Usuario</p>
        <h1 className="page-header-title">Mi Perfil</h1>
        <p className="page-header-description">
          Gestione su información personal, seguridad y preferencias del portal.
        </p>
      </div>

      {/* Avatar card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white border border-border rounded-2xl p-6 flex items-center gap-5"
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl flex items-center justify-center shadow-md">
            <span className="text-white text-2xl font-bold font-display">{user?.initials}</span>
          </div>
          <button
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-border rounded-full flex items-center justify-center hover:bg-bg-alt transition-colors shadow-sm"
            title="Cambiar foto"
          >
            <Camera className="w-3.5 h-3.5 text-text-muted" />
          </button>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-xl font-bold text-text">{user?.name}</h2>
          <p className="text-sm text-text-muted mb-2">{user?.email}</p>
          <span className={`inline-block text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${roleColor}`}>
            {user?.role}
          </span>
        </div>

        {/* Density badge */}
        <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
          <span className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted">Vista</span>
          <span className="text-xs font-semibold text-text capitalize">{density}</span>
        </div>
      </motion.div>

      {/* Información personal */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <Section
          title="Información Personal"
          description="Datos de su cuenta registrados en el sistema"
        >
          <div className="divide-y divide-border">
            <FieldRow label="Nombre completo" value={user?.name} editable />
            <FieldRow label="Correo electrónico">
              <div className="flex items-center gap-2">
                <span className="text-sm text-text font-medium">{user?.email}</span>
                <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-2.5 h-2.5" />
                  Verificado
                </span>
              </div>
            </FieldRow>
            <FieldRow label="Institución">
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span className="text-sm text-text font-medium">Instituto de Investigaciones Ambientales del Pacífico</span>
              </div>
            </FieldRow>
            <FieldRow label="Perfil de acceso">
              <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${roleColor}`}>
                {user?.role}
              </span>
            </FieldRow>
          </div>
        </Section>
      </motion.div>

      {/* Seguridad */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <Section
          title="Seguridad"
          description="Actualice su contraseña periódicamente para proteger su cuenta"
        >
          <CambiarPassword />
        </Section>
      </motion.div>

      {/* Notificaciones */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.20, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <Section
          title="Notificaciones"
          description="Configure qué alertas desea recibir del sistema"
        >
          <Notificaciones />
        </Section>
      </motion.div>

      {/* Apariencia */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <Section
          title="Apariencia"
          description="Ajuste la presentación visual del portal"
        >
          <Apariencia />
        </Section>
      </motion.div>

      {/* Acciones de cuenta */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white border border-border rounded-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-text">Acciones de Cuenta</h3>
        </div>
        <div className="divide-y divide-border">
          <Link
            to="/solicitudes"
            className="flex items-center justify-between px-6 py-4 hover:bg-bg-alt transition-colors no-underline group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-bg-alt rounded-xl flex items-center justify-center">
                <User className="w-4 h-4 text-text-muted" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text group-hover:text-primary-800 transition-colors">
                  Mis Solicitudes
                </p>
                <p className="text-xs text-text-muted">Ver trámites y solicitudes radicadas</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary-800 transition-colors" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-red-50 transition-colors group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                <LogOut className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-orange-600">Cerrar Sesión</p>
                <p className="text-xs text-text-muted">Salir del portal VIGIIAP</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-orange-400 group-hover:text-orange-600 transition-colors" />
          </button>
        </div>
      </motion.div>

      {/* Footer */}
      <p className="text-center text-[0.65rem] text-text-muted/50 font-mono pb-4">
        VIGIIAP v1.0 · © {new Date().getFullYear()} IIAP · Chocó Biogeográfico
      </p>
    </div>
  )
}
