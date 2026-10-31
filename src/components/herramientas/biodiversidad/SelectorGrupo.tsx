import { useEffect, useRef, type KeyboardEvent } from 'react'
import GrupoIcono from './GrupoIcono'
import { fmtNum } from './lib/format'
import { GRUPOS, NOMBRES_GRUPO, type Grupo, type GrupoEstado } from './types'

interface Props {
  grupo: Grupo
  grupos: GrupoEstado[] | undefined
  onCambiar: (g: Grupo) => void
}

/** Selector de colección: radiogroup con teclado (flechas, Inicio, Fin) y desplazamiento con imán en móvil. */
export default function SelectorGrupo({ grupo, grupos, onCambiar }: Props) {
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
    <div>
      <p id="bio-grupo-etiqueta" className="bio-eyebrow mb-2.5">Grupo taxonómico</p>
      <div role="radiogroup" aria-labelledby="bio-grupo-etiqueta" className="bio-grupos">
        {GRUPOS.map((g, i) => {
          const info = grupos?.find((x) => x.grupo === g)
          const activo = g === grupo
          return (
            <button
              key={g} ref={(el) => { refs.current[i] = el }} type="button" role="radio" aria-checked={activo}
              tabIndex={activo ? 0 : -1} className="bio-grupo" onClick={() => onCambiar(g)} onKeyDown={(e) => alTeclear(e, i)}
            >
              <GrupoIcono grupo={g} className="bio-grupo-icono" />
              <span className="bio-grupo-nombre">{NOMBRES_GRUPO[g]}</span>
              <span className="bio-grupo-total">
                {info ? <><b>{fmtNum(info.registros)}</b> registros</> : <span className="bio-grupo-vacio" aria-hidden="true" />}
              </span>
              <span className="bio-grupo-metodo">{info ? (info.metodo === 'individual' ? 'Individuales' : 'Agregado') : ' '}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
