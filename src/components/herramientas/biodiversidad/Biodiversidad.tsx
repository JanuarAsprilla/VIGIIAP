import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useBiodiversidadEstado, useBiodiversidadMunicipios } from '@/hooks/useBiodiversidad'
import './biodiversidad.css'
import AcercaDatos from './AcercaDatos'
import DetalleSeleccion from './DetalleSeleccion'
import { Cargando, PanelError, PanelVacio } from './EstadoConsulta'
import Indicadores from './Indicadores'
import Pestanas from './Pestanas'
import RankingPanel from './RankingPanel'
import SelectorGrupo from './SelectorGrupo'
import { etiquetaMetodo, metodosPorGrupo } from './lib/metodo'
import TablaMunicipios from './TablaMunicipios'
import { calcularCortes } from './lib/escala'
import { calcularIndicadores, resumenPorDepartamento } from './lib/derivar'
import { fmtFecha } from './lib/format'
import { actualizarParametros, leerParametros, type Vista } from './lib/parametros'
import PanelMapa from './mapa/PanelMapa'
import SeccionRegistros from './registros/SeccionRegistros'
import { NOMBRES_GRUPO, type Grupo, type MunicipioConteo } from './types'

const SIN_MUNICIPIOS: MunicipioConteo[] = []

export default function Biodiversidad() {
  const [busqueda, setBusqueda] = useSearchParams()
  const p = useMemo(() => leerParametros(busqueda), [busqueda])
  const estado = useBiodiversidadEstado()
  const munQ = useBiodiversidadMunicipios(p.grupo)

  const mun = munQ.data
  const municipios = mun?.municipios ?? SIN_MUNICIPIOS
  const metodos = useMemo(() => metodosPorGrupo(estado.data?.grupos), [estado.data])
  const info = estado.data?.grupos.find((g) => g.grupo === p.grupo)
  const metodo = mun?.metodo ?? info?.metodo
  const esIndividual = metodo === 'individual'

  const datos = useMemo(() => new Map(municipios.map((m) => [m.codigo_municipal, m])), [municipios])
  const cortes = useMemo(() => calcularCortes(municipios.map((m) => m.registros)), [municipios])
  const indicadores = useMemo(() => (mun ? calcularIndicadores(municipios) : null), [mun, municipios])
  const departamentos = useMemo(() => resumenPorDepartamento(municipios), [municipios])
  const maximo = useMemo(() => Math.max(0, ...municipios.map((m) => m.registros)), [municipios])
  const ranking = useMemo(() => [...municipios].sort((a, b) => b.registros - a.registros), [municipios])

  const municipioSel = p.municipio ? datos.get(p.municipio) ?? null : null
  const deptoSel = municipioSel ? null : departamentos.find((d) => d.departamento === p.departamento) ?? null
  const deptoActivo = municipioSel?.departamento ?? p.departamento
  const visibles = deptoActivo ? municipios.filter((m) => m.departamento === deptoActivo) : municipios
  const vista: Vista = esIndividual ? p.vista ?? 'registros' : 'municipios'

  function cambiar(cambios: Record<string, string | number | null>) {
    const resetPagina = !('pagina' in cambios)
    setBusqueda(actualizarParametros(busqueda, resetPagina ? { ...cambios, pagina: null } : cambios), { replace: false })
  }

  function cambiarGrupo(g: Grupo) {
    cambiar({ grupo: g, municipio: null, departamento: null, anio_desde: null, anio_hasta: null, vista: null })
  }

  function seleccionarMunicipio(codigo: string | null) {
    const m = codigo ? datos.get(codigo) : null
    cambiar({ municipio: m ? m.codigo_municipal : null, departamento: m ? m.departamento : p.departamento })
  }

  function limpiarSeleccion() {
    cambiar({ municipio: null, departamento: null })
  }

  const filtrosActivos = { departamento: deptoActivo, municipio: p.municipio, anioDesde: p.anioDesde, anioHasta: p.anioHasta }

  return (
    <div className="bio-root space-y-6">
      <header className="bio-panel p-4 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="bio-eyebrow">Chocó biogeográfico · datos de GBIF</p>
            <p className="font-display text-[clamp(2rem,5vw,3.25rem)] font-bold leading-none mt-2 text-text" aria-live="polite">
              {NOMBRES_GRUPO[p.grupo]}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="bio-insignia">{etiquetaMetodo(metodo)}</span>
              <span className="bio-insignia tabular-nums">{(mun ?? info) ? `${(mun ?? info)!.desde}–${(mun ?? info)!.hasta}` : '2000–2025'}</span>
              {info && <span className="text-xs text-text-muted">Fuente al {fmtFecha(info.fecha_fuente)}</span>}
            </div>
          </div>
          <p className="text-sm text-text-muted max-w-md leading-relaxed">
            {metodo === 'agregado'
              ? 'Inventario agregado: solo existe el conteo de registros por municipio, no los registros individuales.'
              : 'Registros de ocurrencia publicados en GBIF, ubicados por municipio. Los conteos reflejan esfuerzo de muestreo.'}
          </p>
        </div>
        <SelectorGrupo grupo={p.grupo} metodos={metodos} onCambiar={cambiarGrupo} />
      </header>

      {munQ.isError && !mun ? (
        <PanelError error={munQ.error} onReintentar={() => void munQ.refetch()} />
      ) : (
        <>
          <Indicadores datos={indicadores} cargando={!mun} />
          {mun && municipios.every((m) => m.registros === 0) ? (
            <PanelVacio titulo="Sin registros" detalle="Este grupo no tiene registros en el periodo consultado." />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] items-start">
              <PanelMapa
                datos={datos} cortes={cortes} maximo={maximo} seleccionado={municipioSel?.codigo_municipal ?? null}
                departamento={deptoActivo} cargandoDatos={!mun || munQ.isPlaceholderData} onSeleccionar={seleccionarMunicipio}
              />
              <div className="space-y-6">
                <DetalleSeleccion
                  municipio={municipioSel}
                  puesto={municipioSel ? ranking.findIndex((m) => m.codigo_municipal === municipioSel.codigo_municipal) + 1 : null}
                  totalGrupo={indicadores?.registros ?? 0}
                  departamento={deptoSel}
                  onLimpiar={limpiarSeleccion}
                />
                {mun ? (
                  <RankingPanel
                    municipios={municipios} seleccionado={municipioSel?.codigo_municipal ?? null} departamento={p.departamento}
                    onMunicipio={seleccionarMunicipio} onDepartamento={(d) => cambiar({ departamento: d, municipio: null })}
                  />
                ) : <Cargando etiqueta="Cargando ranking" className="h-96" />}
              </div>
            </div>
          )}

          {mun && (
            <section className="bio-panel p-4 sm:p-5" aria-label="Detalle de los datos">
              {esIndividual ? (
                <Pestanas
                  etiqueta="Vista de detalle" activa={vista} onCambiar={(v) => cambiar({ vista: v })}
                  pestanas={[
                    { id: 'registros', titulo: 'Registros', contenido: (
                      <SeccionRegistros
                        grupo={p.grupo} municipios={municipios} valores={filtrosActivos} pagina={p.pagina}
                        desde={mun.desde} hasta={mun.hasta} onCambio={cambiar}
                        onLimpiar={() => cambiar({ municipio: null, departamento: null, anio_desde: null, anio_hasta: null })}
                      />
                    ) },
                    { id: 'municipios', titulo: 'Municipios', contenido: (
                      <TablaMunicipios municipios={visibles} seleccionado={municipioSel?.codigo_municipal ?? null} onSeleccionar={seleccionarMunicipio} />
                    ) },
                  ]}
                />
              ) : (
                <div className="space-y-4">
                  <div>
                    <h2 className="section-title">Tabla de municipios</h2>
                    <p className="text-sm text-text-muted mt-1">
                      {NOMBRES_GRUPO[p.grupo]} se publica como inventario agregado: el servicio entrega solo el conteo por municipio, sin registros individuales.
                    </p>
                  </div>
                  <TablaMunicipios municipios={visibles} seleccionado={municipioSel?.codigo_municipal ?? null} onSeleccionar={seleccionarMunicipio} />
                </div>
              )}
            </section>
          )}
        </>
      )}

      <AcercaDatos estado={estado.data} error={estado.error} cargando={estado.isPending} onReintentar={() => void estado.refetch()} />
    </div>
  )
}
