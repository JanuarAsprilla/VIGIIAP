import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Compass, FileCheck2, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const STORAGE_KEY = 'vigiiap_welcome_seen'

/**
 * Aviso de bienvenida — una sola vez por navegador, antes de que alguien sin
 * sesión toque cualquier función. Explica la diferencia entre entrar como
 * visitante (rápido, sin datos, contenido público) y solicitar acceso
 * institucional (registro, acceso completo) — ninguna de las dos rutas es
 * obvia sin esto.
 */
export default function WelcomeGate() {
  const { isAuthenticated, loginVisitante } = useAuth()
  const [open, setOpen] = useState(false)
  const [entering, setEntering] = useState(false)

  useEffect(() => {
    if (isAuthenticated) return
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- solo corre una vez al montar, no en cada render
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true)
    } catch { /* localStorage no disponible — modo privado; no bloquea nada, solo no se recuerda */ }
  }, [isAuthenticated])

  const dismiss = useCallback(() => {
    setOpen(false)
    try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* ídem */ }
  }, [])

  useEffect(() => {
    if (!open) return
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [open, dismiss])

  const handleVisitante = async () => {
    setEntering(true)
    try { await loginVisitante() } finally { dismiss() }
  }

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-gate-title"
          onClick={(e) => { if (e.target === e.currentTarget) dismiss() }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: 'var(--card-bg)' }}
          >
            <div className="flex items-start justify-between px-5 pt-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--brand-gradient)' }}
              >
                <Compass className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <button
                onClick={dismiss}
                aria-label="Cerrar"
                className="p-1.5 -mr-1.5 -mt-1.5 rounded-lg text-text-muted hover:text-text hover:bg-bg-alt transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="px-5 pt-3 pb-5">
              <h2 id="welcome-gate-title" className="font-display text-lg font-bold text-text leading-tight">
                Bienvenido a VIGIA-IIAP
              </h2>
              <p className="text-sm text-text-muted leading-relaxed mt-1.5">
                Entra como <strong className="text-text">visitante</strong> para consultar mapas y documentos
                públicos al instante, sin registro. Si tu trabajo requiere acceso completo
                (Geovisor, herramientas, solicitudes), pide tu acceso institucional.
              </p>

              <div className="flex flex-col gap-2 mt-5">
                <button
                  onClick={handleVisitante}
                  disabled={entering}
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                  style={{ background: 'var(--brand-gradient)' }}
                >
                  <Compass className="w-4 h-4" aria-hidden="true" />
                  {entering ? 'Entrando...' : 'Continuar como visitante'}
                </button>
                <Link
                  to="/solicitar-acceso"
                  onClick={dismiss}
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold no-underline border border-border text-text hover:border-primary-800 hover:text-primary-800 transition-colors"
                >
                  <FileCheck2 className="w-4 h-4" aria-hidden="true" />
                  Solicitar acceso institucional
                </Link>
                <button
                  onClick={dismiss}
                  className="text-xs text-text-muted hover:text-text transition-colors mt-1"
                >
                  Ahora no, solo quiero mirar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
