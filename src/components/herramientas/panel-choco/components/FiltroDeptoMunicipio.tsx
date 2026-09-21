interface DeptoOpcion {
  id: string
  name: string
}

interface FiltroDeptoMunicipioProps {
  departamentos: DeptoOpcion[]
  municipios: string[]
  deptoSeleccionado: string
  municipioSeleccionado: string
  onDeptoChange: (id: string) => void
  onMunicipioChange: (nombre: string) => void
}

const selectClass = 'px-3 py-2 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition'

export default function FiltroDeptoMunicipio({
  departamentos, municipios, deptoSeleccionado, municipioSeleccionado, onDeptoChange, onMunicipioChange,
}: FiltroDeptoMunicipioProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted">Filtrar:</span>
      <select
        aria-label="Filtrar por departamento"
        value={deptoSeleccionado}
        onChange={(e) => onDeptoChange(e.target.value)}
        className={selectClass}
      >
        <option value="todos">Todos los departamentos</option>
        {departamentos.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
      <select
        aria-label="Filtrar por municipio"
        value={municipioSeleccionado}
        onChange={(e) => onMunicipioChange(e.target.value)}
        disabled={deptoSeleccionado === 'todos'}
        className={`${selectClass} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <option value="todos">Todos los municipios</option>
        {municipios.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  )
}
