import { insigniasDe } from './lib/conservacion'
import type { Conservacion } from './types'

export default function InsigniasConservacion({ c, compacto = false }: { c: Conservacion; compacto?: boolean }) {
  const lista = insigniasDe(c)
  if (lista.length === 0) return null
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Estado de conservación">
      {lista.map((i) => (
        <li key={i.clave}>
          <span className={`bio-insignia ${i.clase}`} title={i.ayuda}>{compacto && i.clave.length === 2 ? i.clave : i.texto}</span>
        </li>
      ))}
    </ul>
  )
}
