import { X } from 'lucide-react'
import FiltroConservacion from '../FiltroConservacion'
import type { Aplicabilidad } from '../lib/aplicabilidad'
import {
  NIVELES_TAXON, cambiosConservacion, contarFiltros, type CambiosUrl, type Filtros,
} from '../lib/filtros'
import { resumenTerritorio } from '../lib/territorio'
import type { Grupo, Metodo, MunicipioConteo, ParamsApi } from '../types'
import SeccionCalidad from './SeccionCalidad'
import SeccionFiltro from './SeccionFiltro'
import SeccionFuente from './SeccionFuente'
import SeccionTaxonomia from './SeccionTaxonomia'
import SeccionTerritorio from './SeccionTerritorio'
import SeccionTiempo from './SeccionTiempo'

interface Props {
  grupo: Grupo
  metodo: Metodo
  filtros: Filtros
  apl: Aplicabilidad
  municipios: MunicipioConteo[]
  /** Parámetros de `/opciones` con los filtros actuales. */
  paramsOpciones: ParamsApi
  desde: number
  hasta: number
  /** Texto de resultado para el pie (mismo que anuncia el lector de pantalla). */
  resultado: string
  onCambio: (cambios: CambiosUrl) => void
  onLimpiar: () => void
  /** Solo en la hoja móvil. */
  onCerrar?: () => void
  idTitulo: string
}

const cuenta = (...valores: unknown[]) => valores.filter((v) => v !== null && v !== false && v !== '').length

export default function PanelFiltros({
  grupo, metodo, filtros: f, apl, municipios, paramsOpciones, desde, hasta, resultado, onCambio, onLimpiar, onCerrar, idTitulo,
}: Props) {
  const total = contarFiltros(f)
  return (
    <div className="bio-filtros">
      <header className="bio-filtros-cab">
        <div className="min-w-0">
          <h2 id={idTitulo} className="section-title">Filtros</h2>
          <p className="text-xs text-text-muted">{total === 0 ? 'Acota los datos para llegar a lo que buscas.' : `${total} ${total === 1 ? 'filtro activo' : 'filtros activos'}`}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button type="button" className="bio-boton bio-boton-chico" disabled={total === 0} onClick={onLimpiar}>Limpiar todo</button>
          {onCerrar && (
            <button type="button" className="bio-ctl" onClick={onCerrar} aria-label="Cerrar los filtros"><X className="w-4 h-4" aria-hidden="true" /></button>
          )}
        </div>
      </header>
      <div className="bio-filtros-cuerpo">
        <SeccionFiltro titulo="Territorio" activos={cuenta(f.departamento, f.municipio)} resumen={resumenTerritorio(f, municipios)} abierta>
          <SeccionTerritorio filtros={f} municipios={municipios} onCambio={onCambio} />
        </SeccionFiltro>
        <SeccionFiltro titulo="Taxonomía" activos={cuenta(...NIVELES_TAXON.map((n) => f[n]), f.especie, f.buscar)} abierta>
          <SeccionTaxonomia grupo={grupo} metodo={metodo} filtros={f} params={paramsOpciones} motivo={apl.motivoTaxonomia} onCambio={onCambio} />
        </SeccionFiltro>
        <SeccionFiltro titulo="Conservación" activos={cuenta(f.conservacion)} abierta>
          <FiltroConservacion
            conservacion={f.conservacion} amenaza={f.amenaza} deshabilitado={!apl.conservacion}
            onCambio={(c, a) => onCambio(cambiosConservacion(c, a))}
          />
          {apl.motivoConservacion && <p className="bio-seccion-aviso">{apl.motivoConservacion}</p>}
        </SeccionFiltro>
        <SeccionFiltro titulo="Fuente de datos" activos={cuenta(f.entidad, f.conjunto)} noAplica={apl.fuente ? null : apl.motivoFuente}>
          <SeccionFuente grupo={grupo} filtros={f} params={paramsOpciones} onCambio={onCambio} />
        </SeccionFiltro>
        <SeccionFiltro titulo="Tiempo y evidencia" activos={cuenta(f.anioDesde, f.anioHasta, f.evidencia)} noAplica={apl.tiempo ? null : apl.motivoRegistro}>
          <SeccionTiempo grupo={grupo} filtros={f} params={paramsOpciones} desde={desde} hasta={hasta} onCambio={onCambio} />
        </SeccionFiltro>
        <SeccionFiltro titulo="Calidad del dato" activos={cuenta(f.conFoto, f.conUbicacion)} noAplica={apl.calidad ? null : apl.motivoRegistro}>
          <SeccionCalidad filtros={f} onCambio={onCambio} />
        </SeccionFiltro>
      </div>
      <footer className="bio-filtros-pie">
        <p aria-hidden="true">{resultado}</p>
        {onCerrar && <button type="button" className="bio-boton bio-boton-lleno" onClick={onCerrar}>Ver resultados</button>}
      </footer>
    </div>
  )
}
