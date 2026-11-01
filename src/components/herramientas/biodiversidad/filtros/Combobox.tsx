import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronDown, Loader2, X } from 'lucide-react'

export interface OpcionCombo {
  valor: string
  etiqueta: string
  /** Texto secundario, p. ej. el conteo de registros. */
  detalle?: string
}

interface Props {
  etiqueta: string
  placeholder?: string
  /** Texto de la opción elegida; null si no hay selección. */
  seleccion: string | null
  opciones: OpcionCombo[]
  cargando?: boolean
  error?: boolean
  deshabilitado?: boolean
  /** Explica por qué está deshabilitado. */
  motivo?: string | null
  vacio?: string
  /** Se llama al abrir la lista (para pedir las opciones solo entonces). */
  onAbrir?: () => void
  onCerrar?: () => void
  /** Texto escrito por la persona (sin esperar: el padre decide el debounce). */
  onTexto?: (texto: string) => void
  onElegir: (opcion: OpcionCombo) => void
  onLimpiar: () => void
  /** Permite confirmar texto libre con Enter (búsqueda por nombre). */
  onEnterTexto?: (texto: string) => void
  /** La lista ya viene filtrada por el servidor: no se vuelve a filtrar en el cliente. */
  filtradoRemoto?: boolean
  ocultarEtiqueta?: boolean
  idEntrada?: string
}

const quitarAcentos = (t: string) => t.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

/** Combobox accesible (patrón ARIA 1.2 «list autocomplete»): flechas, Enter, Escape, Inicio/Fin, y anuncio de opciones. */
export default function Combobox({
  etiqueta, placeholder, seleccion, opciones, cargando = false, error = false, deshabilitado = false, motivo, vacio = 'Sin coincidencias',
  onAbrir, onCerrar, onTexto, onElegir, onLimpiar, onEnterTexto, filtradoRemoto = false, ocultarEtiqueta = false, idEntrada,
}: Props) {
  const base = useId()
  const idInput = idEntrada ?? `${base}-in`
  const idLista = `${base}-lista`
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState('')
  const [activo, setActivo] = useState(-1)
  const lista = useRef<HTMLUListElement>(null)

  const visibles = filtradoRemoto || !texto
    ? opciones
    : opciones.filter((o) => quitarAcentos(o.etiqueta).includes(quitarAcentos(texto)))

  useEffect(() => {
    if (!abierto || activo < 0) return
    lista.current?.querySelector<HTMLElement>(`[data-i="${activo}"]`)?.scrollIntoView?.({ block: 'nearest' })
  }, [activo, abierto])

  function abrir() {
    if (deshabilitado || abierto) return
    setAbierto(true)
    onAbrir?.()
  }

  function cerrar() {
    if (!abierto) return
    setAbierto(false)
    setActivo(-1)
    setTexto('')
    onTexto?.('')
    onCerrar?.()
  }

  function elegir(o: OpcionCombo) {
    onElegir(o)
    setAbierto(false)
    setActivo(-1)
    setTexto('')
    onTexto?.('')
    onCerrar?.()
  }

  function alTeclear(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!abierto) abrir()
      setActivo((i) => Math.min(visibles.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActivo((i) => Math.max(0, i - 1))
    } else if (e.key === 'Home' && abierto) {
      e.preventDefault(); setActivo(0)
    } else if (e.key === 'End' && abierto) {
      e.preventDefault(); setActivo(visibles.length - 1)
    } else if (e.key === 'Enter') {
      if (abierto && activo >= 0 && visibles[activo]) { e.preventDefault(); elegir(visibles[activo]) }
      else if (onEnterTexto && texto.trim().length >= 2) { e.preventDefault(); onEnterTexto(texto.trim()); cerrar() }
    } else if (e.key === 'Escape' && abierto) {
      e.preventDefault(); e.stopPropagation(); cerrar()
    }
  }

  const estado = cargando ? 'Cargando opciones' : error ? 'No se pudieron cargar las opciones' : visibles.length === 0 ? vacio : ''
  const mostrado = abierto ? texto : seleccion ?? ''

  return (
    <div className="bio-combo">
      <label htmlFor={idInput} className={ocultarEtiqueta ? 'sr-only' : 'bio-eyebrow'}>{etiqueta}</label>
      <div className={`bio-buscador bio-combo-caja ${deshabilitado ? 'bio-combo-off' : ''}`}>
        <input
          id={idInput} type="text" role="combobox" autoComplete="off" spellCheck={false} maxLength={80}
          aria-expanded={abierto} aria-controls={idLista} aria-autocomplete="list" aria-haspopup="listbox"
          aria-activedescendant={abierto && activo >= 0 ? `${base}-o${activo}` : undefined}
          aria-describedby={motivo ? `${base}-motivo` : undefined}
          disabled={deshabilitado}
          placeholder={seleccion ? undefined : placeholder ?? 'Todos'}
          value={mostrado}
          onFocus={abrir} onClick={abrir} onBlur={cerrar} onKeyDown={alTeclear}
          onChange={(e) => { setTexto(e.target.value); setActivo(onEnterTexto ? -1 : 0); onTexto?.(e.target.value); if (!abierto) abrir() }}
        />
        {cargando && <Loader2 className="w-4 h-4 shrink-0 animate-spin text-text-muted" aria-hidden="true" />}
        {seleccion && !deshabilitado ? (
          <button type="button" aria-label={`Quitar ${etiqueta}`} onMouseDown={(e) => e.preventDefault()} onClick={onLimpiar}>
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        ) : <ChevronDown className="w-4 h-4 shrink-0 text-text-muted" aria-hidden="true" />}
      </div>
      {motivo && <p id={`${base}-motivo`} className="bio-combo-motivo">{motivo}</p>}
      {abierto && (
        <ul id={idLista} ref={lista} role="listbox" aria-label={etiqueta} className="bio-combo-lista" data-lenis-prevent>
          {visibles.map((o, i) => (
            <li
              key={o.valor} id={`${base}-o${i}`} data-i={i} role="option" aria-selected={o.etiqueta === seleccion}
              className={i === activo ? 'bio-combo-activa' : undefined}
              onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setActivo(i)} onClick={() => elegir(o)}
            >
              <span className="bio-combo-nombre">{o.etiqueta}</span>
              {o.detalle && <span className="bio-combo-detalle">{o.detalle}</span>}
            </li>
          ))}
          {estado && <li role="presentation" className="bio-combo-estado">{estado}</li>}
        </ul>
      )}
      <p className="sr-only" role="status" aria-live="polite">
        {abierto ? (estado || `${visibles.length} ${visibles.length === 1 ? 'opción' : 'opciones'}`) : ''}
      </p>
    </div>
  )
}
