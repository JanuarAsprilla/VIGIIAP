import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Tag } from 'lucide-react'

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
  /** Categorías/temáticas seleccionables -- ya asignadas a este módulo desde Gestión de Categorías. */
  options: string[]
  placeholder?: string
  existingLabel?: string
}

/**
 * Selector de categoría compartido por Documentos, Mapas y Geovisores --
 * SOLO permite elegir entre las opciones ya asignadas a ese módulo desde
 * Gestión de Categorías, nunca escribir una nueva al vuelo: la creación (y
 * la asignación de a qué módulo pertenece) vive exclusivamente allá, para
 * que nunca quede una categoría "huérfana" sin saber a dónde pertenece.
 * El campo de texto solo filtra la lista -- el valor del formulario nunca
 * cambia hasta que se hace clic en una opción real.
 */
export default function CategoryCombobox({
  id, value, onChange, options,
  placeholder = 'Selecciona una categoría…',
  existingLabel = 'Categorías disponibles',
}: CategoryComboboxProps) {
  const [input, setInput] = useState(value || '')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const commitAndClose = () => {
    setOpen(false)
    // Si lo que quedó escrito no corresponde a una opción real, se descarta
    // -- nunca se envía texto libre como si fuera una categoría elegida.
    setInput(value || '')
  }
  useClickOutside(ref, commitAndClose)

  // Sincronizar si el valor externo cambia (ej: al abrir el modal de edición)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- resync intencional de input controlado
  useEffect(() => { setInput(value || '') }, [value])

  const filtered = options.filter((c) =>
    !input.trim() || c.toLowerCase().includes(input.toLowerCase())
  )

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
          onChange={(e) => { setInput(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Escape') commitAndClose() }}
          autoComplete="off"
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
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 top-full mt-1 w-full bg-[var(--card-bg)] border border-border rounded-xl shadow-xl overflow-hidden"
            style={{ maxHeight: '14rem', overflowY: 'auto' }}
          >
            {filtered.length > 0 ? (
              <>
                <div className="px-3 pt-2.5 pb-1">
                  <span className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted">
                    {existingLabel}
                  </span>
                </div>
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
              </>
            ) : (
              <p className="px-4 py-3 text-xs text-text-muted">
                {options.length === 0
                  ? 'No hay categorías asignadas a este módulo todavía. Créalas desde Gestión de Categorías.'
                  : 'Ninguna categoría coincide con la búsqueda.'}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
