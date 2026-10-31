import { useId } from 'react'

interface Props<T extends string> {
  etiqueta: string
  valor: T
  opciones: Record<T, string>
  onCambio: (v: T) => void
}

export default function SelectorOrden<T extends string>({ etiqueta, valor, opciones, onCambio }: Props<T>) {
  const id = useId()
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="bio-eyebrow">{etiqueta}</label>
      <select id={id} className="bio-campo" value={valor} onChange={(e) => onCambio(e.target.value as T)}>
        {(Object.entries(opciones) as [T, string][]).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
      </select>
    </div>
  )
}
