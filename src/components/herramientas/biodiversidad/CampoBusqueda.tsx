import { useEffect, useId, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { sanearBusqueda } from './lib/parametros'

interface Props {
  etiqueta: string
  placeholder: string
  valor: string
  onCambio: (valor: string) => void
  demoraMs?: number
}

/** Búsqueda con espera: solo propaga textos de 2 a 60 caracteres (o vacío) para respetar el contrato de la API. */
export default function CampoBusqueda({ etiqueta, placeholder, valor, onCambio, demoraMs = 350 }: Props) {
  const id = useId()
  const [texto, setTexto] = useState(valor)
  const [previo, setPrevio] = useState(valor)
  const alCambiar = useRef(onCambio)

  if (valor !== previo) {
    setPrevio(valor)
    setTexto(valor)
  }

  useEffect(() => { alCambiar.current = onCambio }, [onCambio])
  useEffect(() => {
    const limpio = sanearBusqueda(texto)
    if (limpio === valor) return
    const t = window.setTimeout(() => alCambiar.current(limpio), demoraMs)
    return () => window.clearTimeout(t)
  }, [texto, valor, demoraMs])

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label htmlFor={id} className="bio-eyebrow">{etiqueta}</label>
      <div className="bio-buscador">
        <Search className="w-4 h-4 shrink-0 text-text-muted" aria-hidden="true" />
        <input
          id={id} type="search" value={texto} maxLength={60} placeholder={placeholder} autoComplete="off"
          onChange={(e) => setTexto(e.target.value)}
        />
        {texto && (
          <button type="button" aria-label="Borrar búsqueda" onClick={() => setTexto('')}><X className="w-4 h-4" aria-hidden="true" /></button>
        )}
      </div>
      {texto.trim().length === 1 && <p className="text-[0.6875rem] text-text-muted">Escribe al menos 2 letras.</p>}
    </div>
  )
}
