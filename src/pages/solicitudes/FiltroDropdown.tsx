import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, ChevronDown, Check } from 'lucide-react'

export const ESTADOS_FILTRO = [
  { value: '',           label: 'Todos los estados' },
  { value: 'Pendiente',  label: 'Pendiente',   color: 'bg-orange-500' },
  { value: 'En Revisión',label: 'En Revisión', color: 'bg-blue-500' },
  { value: 'Aprobado',   label: 'Aprobado',    color: 'bg-green-500' },
  { value: 'Resuelta',   label: 'Resuelta',    color: 'bg-teal-500' },
  { value: 'Rechazado',  label: 'Rechazado',   color: 'bg-red-500' },
]

export function FiltroDropdown({ filtro, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const active = ESTADOS_FILTRO.find((e) => e.value === filtro)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
          filtro ? 'text-primary-800' : 'text-text-muted hover:text-primary-800'
        }`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        {filtro ? active?.label : 'Filtrar por estado'}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-44 bg-white border border-border rounded-xl shadow-lg z-20 py-1 overflow-hidden"
          >
            {ESTADOS_FILTRO.map((op) => (
              <button
                key={op.value}
                onClick={() => { onChange(op.value); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-left transition-colors ${
                  filtro === op.value ? 'bg-primary-50 text-primary-800' : 'text-text hover:bg-bg-alt'
                }`}
              >
                {op.color && <span className={`w-2 h-2 rounded-full shrink-0 ${op.color}`} />}
                {op.label}
                {filtro === op.value && <Check className="w-3 h-3 ml-auto text-primary-800" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
