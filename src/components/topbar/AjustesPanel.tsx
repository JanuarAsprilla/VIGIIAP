import { motion } from 'framer-motion'
import { Layers, Monitor, Sun, Moon, CheckCircle, type LucideIcon } from 'lucide-react'
import { useUI, type Density } from '@/contexts/UIContext'
import { useTheme } from '@/contexts/ThemeContext'
import { panelAnim } from './panelAnim'

const DENSITY_OPTIONS: { value: Density; label: string; Icon: LucideIcon }[] = [
  { value: 'compact',     label: 'Compacto', Icon: Layers  },
  { value: 'normal',      label: 'Normal',   Icon: Monitor },
  { value: 'comfortable', label: 'Cómodo',   Icon: Sun     },
]

export default function AjustesPanel({ onClose }: { onClose: () => void }) {
  const { density, setDensity, notifications, setNotifications } = useUI()
  const { isDark, toggleTheme } = useTheme()

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

        {/* Tema claro / oscuro */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-text">Tema visual</p>
            <p className="text-xs text-text-muted">
              {isDark ? 'Modo oscuro activo' : 'Modo claro activo'}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            aria-pressed={isDark}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="relative w-10 h-6 rounded-full transition-colors"
            style={{ background: isDark ? '#1A5632' : 'rgba(26,86,50,0.15)' }}
          >
            <span
              className="absolute top-1 w-4 h-4 rounded-full shadow-sm transition-all flex items-center justify-center"
              style={{
                left: isDark ? '1.25rem' : '0.25rem',
                background: isDark ? '#4ade80' : '#1A5632',
              }}
            >
              {isDark
                ? <Moon className="w-2.5 h-2.5 text-[#060f09]" />
                : <Sun className="w-2.5 h-2.5 text-white" />
              }
            </span>
          </button>
        </div>

        {/* Notificaciones */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-text">Notificaciones</p>
            <p className="text-xs text-text-muted">Alertas de nuevos datos</p>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
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
