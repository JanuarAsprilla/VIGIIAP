import { Columns2, Columns3, Rows } from 'lucide-react'
import type { Columnas } from '@/hooks/useColumnasGrid'

const OPCIONES = [
  { n: 1 as const, Icon: Rows, etiqueta: '1 columna' },
  { n: 2 as const, Icon: Columns2, etiqueta: '2 columnas' },
  { n: 3 as const, Icon: Columns3, etiqueta: '3 columnas' },
]

/** Conmutador 1/2/3 columnas de una cuadrícula (mismo control en Mapas y Herramientas). */
export default function SelectorColumnas({ columnas, onChange }: { columnas: Columnas; onChange: (n: Columnas) => void }) {
  return (
    <div role="group" aria-label="Columnas de la cuadrícula" className="flex items-center gap-1 p-1 bg-[var(--card-bg)] border border-border rounded-xl">
      {OPCIONES.map(({ n, Icon, etiqueta }) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          title={etiqueta}
          aria-label={etiqueta}
          aria-pressed={columnas === n}
          className={`p-2 rounded-lg transition-colors ${
            columnas === n ? 'bg-primary-800 text-white' : 'text-text-muted hover:bg-bg-alt hover:text-text'
          }`}
        >
          <Icon className="w-4 h-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}
