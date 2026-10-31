import {
  CAMPO_DE_NIVEL, NIVELES_TAXON, NOMBRE_NIVEL, cambiosEspecie, cambiosTaxon, type CambiosUrl, type Filtros,
} from '../lib/filtros'
import type { Grupo, Metodo, ParamsApi } from '../types'
import ComboOpciones from './ComboOpciones'
import SelectorEspecie from './SelectorEspecie'

interface Props {
  grupo: Grupo
  metodo: Metodo
  filtros: Filtros
  params: ParamsApi
  motivo: string | null
  onCambio: (cambios: CambiosUrl) => void
}

/** Cascada Reino → Filo → Clase → Orden → Familia → Género → Especie: cada nivel ofrece solo lo que existe dado lo elegido arriba. */
export default function SeccionTaxonomia({ grupo, metodo, filtros, params, motivo, onCambio }: Props) {
  return (
    <div className="grid gap-3" role="group" aria-label="Taxonomía, de lo general a lo específico">
      {NIVELES_TAXON.map((nivel) => (
        <ComboOpciones
          key={nivel} grupo={grupo} campo={CAMPO_DE_NIVEL[nivel]} etiqueta={NOMBRE_NIVEL[nivel]} params={params}
          seleccion={filtros[nivel]} deshabilitado={motivo !== null} motivo={null}
          onElegir={(valor) => onCambio(cambiosTaxon(nivel, valor))}
          onLimpiar={() => onCambio(cambiosTaxon(nivel, null))}
        />
      ))}
      <SelectorEspecie
        grupo={grupo} metodo={metodo} filtros={filtros} etiqueta="Especie" placeholder="Escribe un nombre científico"
        deshabilitado={motivo !== null} onEspecie={(clave, nombre) => onCambio(cambiosEspecie(clave, nombre))}
        onLimpiar={() => onCambio({ especie: null, nombre_especie: null, buscar: null })}
      />
      {motivo && <p className="bio-seccion-aviso">{motivo}</p>}
    </div>
  )
}
