import { motion } from 'framer-motion'
import { X, type LucideIcon } from 'lucide-react'

/**
 * Panel centrado con scrim de fondo — mismo material Liquid Glass que
 * LoginPanel (ver src/components/topbar/LoginPanel.tsx), pero centrado en
 * pantalla en vez de anclado bajo un botón del TopBar, porque estos dos no
 * se disparan desde un trigger fijo: se abren desde enlaces dentro del
 * propio panel de login, o desde una URL directa (/recuperar-password,
 * /solicitar-acceso) que redirige aquí con el modal ya elegido.
 */
export default function CenteredAuthPanel({ title, icon: Icon, onClose, children }: {
  title: string
  icon: LucideIcon
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-40 bg-black/35 backdrop-blur-3xl"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="centered-auth-panel-title"
          className="glass-panel pointer-events-auto w-full max-w-md max-h-[85vh] rounded-2xl overflow-hidden flex flex-col"
        >
          <div
            className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-border"
            style={{ background: 'var(--card-bg)' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--brand-gradient)' }}>
                <Icon className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <h2 id="centered-auth-panel-title" className="font-display text-base font-bold text-text">{title}</h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="p-1.5 -mr-1 rounded-lg text-text-muted hover:text-text hover:bg-bg-alt transition-colors shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {children}
          </div>
        </motion.div>
      </div>
    </>
  )
}
