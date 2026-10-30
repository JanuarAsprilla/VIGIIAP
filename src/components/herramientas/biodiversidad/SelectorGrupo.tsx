import { GRUPOS, NOMBRES_GRUPO, type Grupo, type Metodo } from './types'

interface Props {
  grupo: Grupo
  metodos: Partial<Record<Grupo, Metodo>>
  onCambiar: (g: Grupo) => void
}

export default function SelectorGrupo({ grupo, metodos, onCambiar }: Props) {
  return (
    <fieldset>
      <legend className="bio-eyebrow mb-2">Grupo taxonómico</legend>
      <div className="flex flex-wrap gap-2">
        {GRUPOS.map((g) => (
          <label key={g} className="bio-chip cursor-pointer">
            <input
              type="radio"
              name="bio-grupo"
              value={g}
              checked={g === grupo}
              onChange={() => onCambiar(g)}
            />
            <span className="text-sm font-semibold leading-tight">{NOMBRES_GRUPO[g]}</span>
            <small>{metodos[g] === 'agregado' ? 'agregado' : metodos[g] === 'individual' ? 'individual' : ' '}</small>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
