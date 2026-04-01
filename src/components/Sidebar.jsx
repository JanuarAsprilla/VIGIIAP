import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { PlusCircle, LogOut, X, Map, FileText, Globe, ChevronRight, CheckCircle } from 'lucide-react'
import { NAV_LINKS } from '@/lib/constants'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

const ANALYSIS_TYPES = [
  { value: '', label: 'Seleccione un tipo' },
  { value: 'cobertura', label: 'Cobertura Vegetal' },
  { value: 'hidrologia', label: 'Análisis Hidrológico' },
  { value: 'biodiversidad', label: 'Biodiversidad y Especies' },
  { value: 'conflictos', label: 'Conflictos de Uso del Suelo' },
  { value: 'zonificacion', label: 'Zonificación Ambiental' },
  { value: 'otro', label: 'Otro' },
]

const DEPARTMENTS = [
  { value: '', label: 'Todo el Chocó Biogeográfico' },
  { value: 'choco', label: 'Chocó' },
  { value: 'valle', label: 'Valle del Cauca' },
  { value: 'cauca', label: 'Cauca' },
  { value: 'narino', label: 'Nariño' },
]

// ── Nuevo Análisis Modal ──
function NuevoAnalisisModal({ onClose }) {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
                  <PlusCircle className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text leading-tight">Nuevo Análisis</h3>
                  <p className="text-xs text-text-muted">Solicitud de análisis territorial</p>
                </div>
              </div>
              <button
                onClick={onClose}
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
                  Nombre del análisis <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Cobertura Cuenca Atrato 2026"
                  value={form.nombre}
                  onChange={(e) => set('nombre', e.target.value)}
                  className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${errors.nombre ? 'border-red-400 focus:border-red-400' : 'border-border focus:border-primary-800'}`}
                />
                {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                  Tipo de análisis <span className="text-orange-500">*</span>
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
                {errors.tipo && <p className="text-xs text-red-500 mt-1">{errors.tipo}</p>}
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
                  {DEPARTMENTS.map((d) => (
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
                      <ChevronRight className="w-3 h-3" />
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
  )
}

export default function Sidebar({ mobileOpen, onClose }) {
  const { isAuthenticated, logout } = useAuth()
  const [showModal, setShowModal] = useState(false)

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 no-underline" onClick={onClose}>
          <div className="w-9 h-9 bg-primary-800 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <div className="leading-tight">
            <span className="block text-sm font-bold text-text tracking-wide">VIGIIAP</span>
            <span className="block text-[0.65rem] text-text-muted uppercase tracking-wider">
              Chocó Biogeográfico
            </span>
          </div>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium no-underline transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-800 border border-primary-200'
                  : 'text-text-light hover:bg-bg-alt hover:text-text border border-transparent'
              }`
            }
          >
            <link.icon className="w-[18px] h-[18px] shrink-0" />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom — SOLO cuando hay sesión activa */}
      {isAuthenticated && (
        <div className="p-3 border-t border-border space-y-1">
          <button
            onClick={() => setShowModal(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nuevo Análisis</span>
          </button>
          <button
            onClick={() => { logout(); onClose?.(); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-orange-500 hover:bg-orange-500/5 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}
    </>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[200px] bg-white border-r border-border flex-col z-40">
        {sidebarContent}
      </aside>

      {/* Mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-[240px] bg-white z-50 flex flex-col shadow-float lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Nuevo Análisis Modal */}
      <AnimatePresence>
        {showModal && (
          <NuevoAnalisisModal onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
