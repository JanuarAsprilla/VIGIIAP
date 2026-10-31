import { useMemo } from 'react'
import type { CambiosUrl, Filtros } from '../lib/filtros'
import { opcionesTerritorio } from '../lib/territorio'
import type { MunicipioConteo } from '../types'
import Combobox from './Combobox'

interface Props {
  filtros: Filtros
  municipios: MunicipioConteo[]
  onCambio: (cambios: CambiosUrl) => void
}

/** Departamento y municipio se encadenan: elegir un municipio fija su departamento; cambiar de departamento suelta el
 *  municipio; quitar el municipio conserva el departamento. Las cifras siguen el resto de filtros activos. */
export default function SeccionTerritorio({ filtros, municipios, onCambio }: Props) {
  const { departamentos, municipios: opcMunicipios } = useMemo(
    () => opcionesTerritorio(municipios, filtros.departamento), [municipios, filtros.departamento],
  )
  const nombreMunicipio = useMemo(
    () => (filtros.municipio ? municipios.find((m) => m.codigo_municipal === filtros.municipio)?.municipio ?? null : null),
    [municipios, filtros.municipio],
  )
  return (
    <div className="grid gap-3" role="group" aria-label="Territorio, de lo general a lo específico">
      <Combobox
        etiqueta="Departamento" placeholder="Todos los departamentos" seleccion={filtros.departamento} opciones={departamentos}
        onElegir={(o) => onCambio({ departamento: o.valor, municipio: null })}
        onLimpiar={() => onCambio({ departamento: null, municipio: null })}
      />
      <Combobox
        etiqueta="Municipio" placeholder={filtros.departamento ? `Todos en ${filtros.departamento}` : 'Todos los municipios'}
        seleccion={nombreMunicipio} opciones={opcMunicipios} vacio="Ningún municipio coincide"
        onElegir={(o) => {
          const m = municipios.find((x) => x.codigo_municipal === o.valor)
          if (m) onCambio({ municipio: m.codigo_municipal, departamento: m.departamento })
        }}
        onLimpiar={() => onCambio({ municipio: null })}
      />
    </div>
  )
}
