import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Layers, Check } from 'lucide-react'
import { BASEMAPS } from '@/lib/constants/basemaps'

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) handler()
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [ref, handler])
}

export default function BasemapGaleria({ basemapId, onChange }: { basemapId: string; onChange: (id: string) => void }) {
  const [abierto, setAbierto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setAbierto(false))

  const actual = BASEMAPS.find((b) => b.id === basemapId) ?? BASEMAPS[0]

  return (
    <div ref={ref} className="absolute top-3 right-3 z-[1000]">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        title="Cambiar mapa base"
        className="flex items-center gap-2 px-3 py-2 bg-[var(--card-bg)]/95 backdrop-blur-sm border border-border rounded-xl shadow-md text-xs font-semibold text-text hover:border-primary-600 transition-colors"
      >
        <Layers className="w-4 h-4 text-primary-700" aria-hidden="true" />
        {actual.nombre}
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-48 p-1.5 bg-[var(--card-bg)]/95 backdrop-blur-sm border border-border rounded-xl shadow-lg grid grid-cols-1 gap-0.5"
          >
            {BASEMAPS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => { onChange(b.id); setAbierto(false) }}
                className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  b.id === basemapId ? 'bg-primary-800/10 text-primary-800' : 'text-text hover:bg-bg-alt'
                }`}
              >
                {b.nombre}
                {b.id === basemapId && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
