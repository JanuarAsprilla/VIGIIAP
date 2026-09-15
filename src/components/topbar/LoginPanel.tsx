/**
 * Panel de acceso anclado bajo el botón "Ingresar" del TopBar — reemplaza la
 * navegación a una página aparte. A diferencia de los demás paneles del
 * TopBar (Soporte, Notificaciones, Ajustes), este sí lleva un scrim de fondo:
 * iniciar sesión es una tarea que bloquea el flujo, no un ajuste rápido que
 * se consulta de paso — por eso oscurece el resto de la pantalla para que la
 * persona se enfoque solo en esto (ver Apple HIG: "dim to focus, separate to
 * keep flow").
 */
import { motion } from 'framer-motion'
import { User, X } from 'lucide-react'
import LoginForm from '@/components/auth/LoginForm'
import { panelAnim } from './panelAnim'

export default function LoginPanel({ onClose, from }: { onClose: () => void; from?: string }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-lg"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        {...panelAnim}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-panel-title"
        className="glass-panel absolute top-full right-0 mt-2 w-[380px] max-w-[92vw] max-h-[85vh] rounded-2xl z-50 overflow-hidden flex flex-col"
      >
        <div
          className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-border"
          style={{ background: 'var(--card-bg)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--brand-gradient)' }}>
              <User className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <h2 id="login-panel-title" className="font-display text-base font-bold text-text">Iniciar sesión</h2>
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
          <LoginForm from={from} onClose={onClose} showHeading={false} />
        </div>
      </motion.div>
    </>
  )
}
