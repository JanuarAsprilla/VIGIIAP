import { motion } from 'framer-motion'
import { Wrench, LogIn } from 'lucide-react'
import Card3D from '@/components/ui/Card3D'
import { EASE_OUT_EXPO } from '@/lib/animations'

interface MaintenancePageProps {
  mensaje: string
}

// Se muestra en pantalla completa cuando el backend responde
// { maintenance: true } a cualquier petición — ver maintenanceGate en
// src/middlewares/maintenanceMode.js. admin_sig/super_admin ya autenticados
// nunca reciben esa respuesta (el gate los deja pasar server-side), así que
// esta pantalla solo la ve un visitante sin sesión de administrador. El
// enlace de abajo usa <a> normal (recarga completa) a propósito: navegar con
// react-router no dispara ninguna petición nueva que reevalúe el estado de
// mantenimiento, así que el overlay nunca se quitaría solo.
export default function MaintenancePage({ mensaje }: MaintenancePageProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-hidden"
      style={{ background: 'var(--shell-bg)' }}
      role="alert"
    >
      <div className="orb-1 absolute -top-40 -left-32 w-[480px] h-[480px] rounded-full bg-gold-400/[0.08] blur-[90px] pointer-events-none" aria-hidden="true" />
      <div className="orb-2 absolute -bottom-40 -right-32 w-[420px] h-[420px] rounded-full bg-primary-500/[0.07] blur-[90px] pointer-events-none" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, y: 28, rotateX: 5, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
        style={{ transformPerspective: 1000, transformOrigin: 'top center' }}
        className="glass-panel relative z-10 w-full max-w-lg text-center px-8 py-12 sm:px-12 rounded-3xl"
      >
        <Card3D
          disabled
          className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gold-400/20 to-gold-500/10 flex items-center justify-center"
        >
          <Wrench className="w-7 h-7 text-gold-500" aria-hidden="true" />
        </Card3D>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <h1 className="font-display text-2xl font-bold text-text mb-3">
            Sitio en mantenimiento
          </h1>
          <p className="text-sm text-text-muted leading-relaxed max-w-sm mx-auto mb-8">
            {mensaje}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <a
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border-2 border-border rounded-xl text-sm font-semibold text-text hover:border-primary-800 hover:text-primary-800 transition-colors no-underline"
          >
            <LogIn className="w-4 h-4" />
            Iniciar sesión como administrador
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-10 text-xs text-text-muted/50 font-mono"
        >
          VIGIA-IIAP · Instituto de Investigaciones Ambientales del Pacífico
        </motion.p>
      </motion.div>
    </div>
  )
}
