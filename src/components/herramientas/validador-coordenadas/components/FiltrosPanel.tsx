import type { FiltrosState, OrigenPunto, EstadoCoordenada } from '../types'

const CHIPS: { value: OrigenPunto; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'agregado', label: 'Agregados manualmente' },
  { value: 'movido', label: 'Movidos manualmente' },
  { value: 'confirmado', label: 'Confirmados como válidos' },
]

interface FiltrosPanelProps {
  filtros: FiltrosState
  deptos: string[]
  munis: string[]
  errores: string[]
  onChange: (patch: Partial<FiltrosState>) => void
}

/** Filtros por estado/depto/municipio/tipo de error + chips de origen del
 *  punto (agregado/movido/confirmado) -- mismos criterios que el original. */
export default function FiltrosPanel({ filtros, deptos, munis, errores, onChange }: FiltrosPanelProps) {
  const selectCls = 'w-full px-3 py-2 text-xs border border-border rounded-lg bg-[var(--card-bg)] text-text focus:outline-none focus:ring-2 focus:ring-primary-400'

  return (
    <div className="bg-bg-alt rounded-xl p-4 space-y-3">
      <p className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted">Filtros</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <select value={filtros.estado} onChange={(e) => onChange({ estado: e.target.value as EstadoCoordenada })} className={selectCls}>
          <option value="">Estado: todos</option>
          <option value="VÁLIDA">Válida</option>
          <option value="SOSPECHOSA">Sospechosa</option>
          <option value="INVÁLIDA">Inválida</option>
        </select>
        <select value={filtros.depto} onChange={(e) => onChange({ depto: e.target.value })} className={selectCls}>
          <option value="">Departamento: todos</option>
          {deptos.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filtros.muni} onChange={(e) => onChange({ muni: e.target.value })} className={selectCls}>
          <option value="">Municipio detectado: todos</option>
          {munis.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filtros.error} onChange={(e) => onChange({ error: e.target.value })} className={selectCls}>
          <option value="">Tipo de error: todos</option>
          {errores.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {CHIPS.map(({ value, label }) => (
          <button key={value} type="button" onClick={() => onChange({ origen: value })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filtros.origen === value ? 'bg-primary-800 text-white border-primary-800' : 'bg-[var(--card-bg)] text-text border-border hover:border-primary-800'
            }`}>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
