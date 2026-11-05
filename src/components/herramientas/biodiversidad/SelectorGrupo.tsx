import { useEffect, useRef, type KeyboardEvent } from 'react'
import GrupoIcono from './GrupoIcono'
import { estiloGrupo } from './lib/paleta'
import { GRUPOS, NOMBRES_GRUPO, type Grupo } from './types'

interface Props {
  grupo: Grupo
  onCambiar: (g: Grupo) => void
}

/** Selector de colección en píldoras compactas (icono y nombre): radiogroup con teclado (flechas, Inicio, Fin) y desplazamiento en móvil. Los datos del grupo se muestran aparte, en la cabecera. */
export default function SelectorGrupo({ grupo, onCambiar }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  // En móvil la fila se desplaza: el grupo activo debe quedar a la vista sin mover la página.
  useEffect(() => {
    const i = GRUPOS.indexOf(grupo)
    const el = refs.current[i]
    const fila = el?.parentElement
    if (!el || !fila || fila.scrollWidth <= fila.clientWidth) return
    fila.scrollTo({ left: el.offsetLeft - (fila.clientWidth - el.offsetWidth) / 2, behavior: 'auto' })
  }, [grupo])

  function alTeclear(e: KeyboardEvent, i: number) {
    const n = GRUPOS.length
    const destino = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (i + 1) % n
      : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? (i - 1 + n) % n
        : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1
    if (destino < 0) return
    e.preventDefault()
    onCambiar(GRUPOS[destino])
    refs.current[destino]?.focus()
  }

  return (
    <div role="radiogroup" aria-label="Grupo taxonómico" className="bio-grupos">
      {GRUPOS.map((g, i) => {
        const activo = g === grupo
        return (
          <button
            key={g} ref={(el) => { refs.current[i] = el }} type="button" role="radio" aria-checked={activo}
            tabIndex={activo ? 0 : -1} className="bio-grupo bio-tema" style={estiloGrupo(g)} onClick={() => onCambiar(g)} onKeyDown={(e) => alTeclear(e, i)}
          >
            <span className="bio-grupo-chip"><GrupoIcono grupo={g} className="bio-grupo-icono" /></span>
            <span className="bio-grupo-nombre">{NOMBRES_GRUPO[g]}</span>
          </button>
        )
      })}
    </div>
  )
}
