import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Plus, Tag } from 'lucide-react'

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) handler() }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}

interface CategoryComboboxProps {
  id?: string
  value: string
  onChange: (v: string) => void
  /** Categorías/temáticas ya conocidas — sugeridas como opciones existentes. */
  options: string[]
  placeholder?: string
  existingLabel?: string
  createLabel?: string
}

/**
 * Selector de categoría compartido por Documentos, Mapas y Geovisores —
 * permite elegir una opción existente o escribir una nueva al vuelo. Todos
 * los módulos leen sus opciones de la misma tabla `categorias` (vía
 * useCategoriasList) para que crear una categoría en un módulo la haga
 * visible de inmediato en los demás.
 */
export default function CategoryCombobox({
  id, value, onChange, options,
  placeholder = 'Selecciona o escribe una categoría nueva…',
  existingLabel = 'Categorías existentes',
  createLabel = 'Crear categoría',
}: CategoryComboboxProps) {
  const [input, setInput] = useState(value || '')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false))

  // Sincronizar si el valor externo cambia (ej: al abrir el modal de edición)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- resync intencional de input controlado
  useEffect(() => { setInput(value || '') }, [value])

  const filtered = options.filter((c) =>
    !input.trim() || c.toLowerCase().includes(input.toLowerCase())
  )
  const isNew = input.trim() !== '' &&
    !options.some((c) => c.toLowerCase() === input.trim().toLowerCase())

  const select = (cat: string) => { onChange(cat); setInput(cat); setOpen(false) }

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
        <input
          id={id}
          type="text"
          value={input}
          placeholder={placeholder}
          onChange={(e) => { setInput(e.target.value); onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          className="w-full pl-8 pr-8 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {open && (filtered.length > 0 || isNew) && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 top-full mt-1 w-full bg-[var(--card-bg)] border border-border rounded-xl shadow-xl overflow-hidden"
            style={{ maxHeight: '14rem', overflowY: 'auto' }}
          >
            {filtered.length > 0 && (
              <div className="px-3 pt-2.5 pb-1">
                <span className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted">
                  {existingLabel}
                </span>
              </div>
            )}
            {filtered.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => select(cat)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                  value === cat
                    ? 'bg-primary-500/12 text-primary-700 font-semibold'
                    : 'text-text hover:bg-bg-alt'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                {cat}
              </button>
            ))}
            {isNew && (
              <button
                type="button"
                onClick={() => select(input.trim())}
                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-primary-800 hover:bg-primary-500/10 border-t border-border transition-colors flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                {createLabel}: <em className="not-italic font-bold">&ldquo;{input.trim()}&rdquo;</em>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
