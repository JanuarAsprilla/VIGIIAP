import { motion } from 'framer-motion'
import { Layers, Monitor, Sun, CheckCircle } from 'lucide-react'
import { useUI } from '@/contexts/UIContext'
import { panelAnim } from './panelAnim'

const DENSITY_OPTIONS = [
  { value: 'compact', label: 'Compacto', Icon: Layers  },
  { value: 'normal',  label: 'Normal',   Icon: Monitor },
  { value: 'comodo',  label: 'Cómodo',   Icon: Sun     },
]

export default function AjustesPanel({ onClose }) {
  const { density, setDensity, notifications, setNotifications } = useUI()

  return (
    <motion.div
      {...panelAnim}
      className="absolute top-full right-0 mt-2 w-64 bg-white border border-border rounded-xl shadow-float overflow-hidden z-50"
    >
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-bold text-text">Ajustes rápidos</p>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
            Densidad del contenido
          </p>
          <div className="flex gap-2">
            {DENSITY_OPTIONS.map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => setDensity(value)}
                aria-pressed={density === value}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border text-[0.65rem] font-bold uppercase tracking-wider transition-colors ${
                  density === value
                    ? 'bg-primary-800 border-primary-800 text-white'
                    : 'border-border text-text-muted hover:border-primary-800 hover:text-primary-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
          <p className="text-[0.65rem] text-text-muted mt-1.5 text-center">
            Ajusta el espaciado del área de contenido
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-text">Notificaciones</p>
            <p className="text-xs text-text-muted">Alertas de nuevos datos</p>
          </div>
          <button
            onClick={() => setNotifications((v) => !v)}
            aria-pressed={notifications}
            aria-label={notifications ? 'Desactivar notificaciones' : 'Activar notificaciones'}
            className={`relative w-10 h-6 rounded-full transition-colors ${
              notifications ? 'bg-primary-800' : 'bg-border'
            }`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
              notifications ? 'left-5' : 'left-1'
            }`} />
          </button>
        </div>
      </div>

      <div className="px-4 pb-4 pt-2 border-t border-border">
        <button
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-primary-800 hover:text-primary-600 transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          Listo
        </button>
      </div>
    </motion.div>
  )
}
