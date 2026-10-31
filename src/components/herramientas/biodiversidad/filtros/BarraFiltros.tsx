import type { RefObject } from 'react'
import { Camera, ShieldAlert, SlidersHorizontal, Sprout, TriangleAlert, X } from 'lucide-react'
import { MOTIVO_AGREGADO, type Aplicabilidad } from '../lib/aplicabilidad'
import type { ChipFiltro } from '../lib/chips'
import { cambiosConservacion, cambiosEspecie, contarFiltros, type CambiosUrl, type Filtros } from '../lib/filtros'
import type { Grupo, Metodo, TipoConservacion } from '../types'
import SelectorEspecie from './SelectorEspecie'

interface Props {
  grupo: Grupo
  metodo: Metodo
  filtros: Filtros
  apl: Aplicabilidad
  chips: ChipFiltro[]
  resumen: string
  panelAbierto: boolean
  botonPanel: RefObject<HTMLButtonElement | null>
  onTogglePanel: () => void
  onCambio: (cambios: CambiosUrl) => void
  onLimpiar: () => void
}

const ATAJOS: { tipo: TipoConservacion; texto: string; Icono: typeof Camera }[] = [
  { tipo: 'amenazada', texto: 'Amenazadas', Icono: ShieldAlert },
  { tipo: 'endemica', texto: 'Endémicas', Icono: Sprout },
  { tipo: 'invasora', texto: 'Invasoras', Icono: TriangleAlert },
]

/** Entrada principal de los filtros: búsqueda de especie, atajos de un clic, botón del panel, chips activos y resumen. */
export default function BarraFiltros({
  grupo, metodo, filtros: f, apl, chips, resumen, panelAbierto, botonPanel, onTogglePanel, onCambio, onLimpiar,
}: Props) {
  const total = contarFiltros(f)
  return (
    <section className="bio-fbarra bio-panel" aria-label="Búsqueda y filtros">
      <div className="bio-fbarra-fila">
        <div className="bio-fbarra-busqueda">
          <SelectorEspecie
            grupo={grupo} metodo={metodo} filtros={f} etiqueta="Buscar una especie" ocultarEtiqueta idEntrada="bio-busqueda-especie"
            placeholder="Buscar una especie por nombre científico" permitirTextoLibre
            onEspecie={(clave, nombre) => onCambio(cambiosEspecie(clave, nombre))}
            onBuscar={(t) => onCambio({ buscar: t || null, especie: null, nombre_especie: null })}
            onLimpiar={() => onCambio({ especie: null, nombre_especie: null, buscar: null })}
          />
        </div>
        <button
          ref={botonPanel} type="button" className="bio-boton bio-boton-panel" aria-expanded={panelAbierto} aria-controls="bio-panel-filtros"
          aria-haspopup={panelAbierto ? undefined : 'dialog'} onClick={onTogglePanel}
        >
          <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          Filtros
          {total > 0 && <span className="bio-seccion-cuenta" aria-label={`${total} activos`}>{total}</span>}
        </button>
      </div>
      <div className="bio-atajos" role="group" aria-label="Atajos de filtro">
        <span className="bio-eyebrow">Atajos</span>
        {ATAJOS.map(({ tipo, texto, Icono }) => (
          <button
            key={tipo} type="button" className="bio-boton bio-boton-chico" aria-pressed={f.conservacion === tipo}
            disabled={!apl.conservacion} title={apl.motivoConservacion ?? undefined}
            onClick={() => onCambio(f.conservacion === tipo ? cambiosConservacion(null, null) : cambiosConservacion(tipo, null))}
          >
            <Icono className="w-3.5 h-3.5" aria-hidden="true" />{texto}
          </button>
        ))}
        <button
          type="button" className="bio-boton bio-boton-chico" aria-pressed={f.conFoto} disabled={!apl.calidad}
          title={apl.calidad ? undefined : MOTIVO_AGREGADO} onClick={() => onCambio({ con_foto: f.conFoto ? null : '1' })}
        >
          <Camera className="w-3.5 h-3.5" aria-hidden="true" />Con foto
        </button>
      </div>
      <div className="bio-fbarra-resumen">
        <p className="bio-resumen-texto" role="status" aria-live="polite">{resumen}</p>
        {chips.length > 0 && (
          <ul className="bio-chips" aria-label="Filtros activos">
            {chips.map((c) => (
              <li key={c.clave} className="bio-chip-filtro">
                <span>{c.etiqueta}</span>
                <button type="button" aria-label={c.quitarEtiqueta} onClick={() => onCambio(c.quitar)}><X className="w-3.5 h-3.5" aria-hidden="true" /></button>
              </li>
            ))}
            <li><button type="button" className="bio-limpiar" onClick={onLimpiar}>Limpiar todo</button></li>
          </ul>
        )}
      </div>
    </section>
  )
}
