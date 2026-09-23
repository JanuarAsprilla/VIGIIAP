import type { FormatoCoordenadas } from '../types'

const OPCIONES: { value: FormatoCoordenadas; label: string }[] = [
  { value: 'dd', label: 'DD (grados decimales)' },
  { value: 'dms', label: 'DMS (grados, min, seg)' },
  { value: 'utm', label: 'UTM' },
]

interface FormatoToggleProps {
  formato: FormatoCoordenadas
  onChange: (formato: FormatoCoordenadas) => void
}

/** La validación siempre corre en decimal -- esto solo cambia cómo se
 *  muestran las coordenadas en la tabla y en los popups del mapa. */
export default function FormatoToggle({ formato, onChange }: FormatoToggleProps) {
  return (
    <div className="flex items-center gap-3 bg-bg-alt rounded-xl px-4 py-2.5">
      <span className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted">Formato de coordenadas</span>
      <div className="flex gap-1.5">
        {OPCIONES.map(({ value, label }) => (
          <button key={value} type="button" onClick={() => onChange(value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              formato === value ? 'bg-primary-800 text-white border-primary-800' : 'bg-[var(--card-bg)] text-text border-border hover:border-primary-800'
            }`}>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
