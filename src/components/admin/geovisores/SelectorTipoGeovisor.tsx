import { TIPOS_GEOVISOR, type TipoGeovisor } from './tiposGeovisor'

/** Primera decisión del formulario: qué clase de geovisor se va a armar. */
export default function SelectorTipoGeovisor({ value, onChange }: {
  value: TipoGeovisor
  onChange: (tipo: TipoGeovisor) => void
}) {
  return (
    <div role="radiogroup" aria-labelledby="gv-tipo-label" className="space-y-1.5">
      <p id="gv-tipo-label" className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted">
        Tipo de geovisor
      </p>
      <div className="grid grid-cols-2 gap-2">
        {TIPOS_GEOVISOR.map(({ id, label, desc, Icon }) => {
          const activo = value === id
          return (
            <button key={id} type="button" role="radio" aria-checked={activo} onClick={() => onChange(id)}
              className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-colors ${
                activo ? 'border-primary-600 bg-primary-600/8' : 'border-border bg-[var(--card-bg)] hover:bg-bg-alt'
              }`}>
              <Icon className={`w-4 h-4 ${activo ? 'text-primary-700' : 'text-text-muted'}`} aria-hidden="true" />
              <span className={`text-xs font-bold leading-tight ${activo ? 'text-primary-800' : 'text-text'}`}>{label}</span>
              <span className="text-[0.62rem] text-text-muted leading-snug">{desc}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
