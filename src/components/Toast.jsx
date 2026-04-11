import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

const ICONS = {
  success: CheckCircle,
  error:   AlertCircle,
  info:    Info,
}
const STYLES = {
  success: 'bg-green-600',
  error:   'bg-red-600',
  info:    'bg-primary-800',
}

// ── Hook ──
export function useToast() {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, toast, dismiss }
}

// ── Container ──
export function ToastContainer({ toasts, dismiss }) {
  return (
    <div className="fixed bottom-6 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || ICONS.info
          const style = STYLES[t.type] || STYLES.info
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={`pointer-events-auto flex items-center gap-3 pl-4 pr-3 py-3 rounded-xl shadow-2xl text-white text-sm font-medium min-w-[220px] max-w-xs ${style}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="p-0.5 rounded-lg hover:bg-white/20 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
