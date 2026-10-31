import { lazy, Suspense, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useBiodiversidadEstado, useBiodiversidadMunicipios } from '@/hooks/useBiodiversidad'
import './biodiversidad.css'
import AcercaDatos from './AcercaDatos'
import DetalleSeleccion from './DetalleSeleccion'
import { Cargando, PanelError, PanelVacio } from './EstadoConsulta'
import Pestanas from './Pestanas'
import RankingPanel from './RankingPanel'
import SelectorGrupo from './SelectorGrupo'
import TablaMunicipios from './TablaMunicipios'
import { calcularCortes } from './lib/escala'
import { calcularIndicadores, resumenPorDepartamento } from './lib/derivar'
import { fmtFecha } from './lib/format'
import { etiquetaMetodo } from './lib/metodo'
import { valorMetrica, METRICA_INICIAL, type Metrica } from './lib/metrica'
import { actualizarParametros, leerParametros, type Vista } from './lib/parametros'
import PanelMapa from './mapa/PanelMapa'
import { NOMBRES_GRUPO, type Amenaza, type EspecieResumen, type Grupo, type MunicipioConteo, type TipoConservacion } from './types'

const PanelResumen = lazy(() => import('./resumen/PanelResumen'))
const SeccionEspecies = lazy(() => import('./especies/SeccionEspecies'))
const SeccionRegistros = lazy(() => import('./registros/SeccionRegistros'))

const SIN_MUNICIPIOS: MunicipioConteo[] = []
type Cambios = Record<string, string | number | null>

function CargandoPestana() {
  return <Cargando etiqueta="Cargando contenido" className="h-72" />
}

export default function Biodiversidad() {
  const [busqueda, setBusqueda] = useSearchParams()
  const p = useMemo(() => leerParametros(busqueda), [busqueda])
  const estado = useBiodiversidadEstado()
  const munQ = useBiodiversidadMunicipios(p.grupo)

  const mun = munQ.data
  const municipios = mun?.municipios ?? SIN_MUNICIPIOS
  const info = estado.data?.grupos.find((g) => g.grupo === p.grupo)
  const metodo = mun?.metodo ?? info?.metodo
  const esIndividual = metodo === 'individual'

  const datos = useMemo(() => new Map(municipios.map((m) => [m.codigo_municipal, m])), [municipios])
  const valores = useMemo(
    () => municipios.map((m) => valorMetrica(m, p.metrica)).filter((v): v is number => v !== null),
    [municipios, p.metrica],
  )
  const cortes = useMemo(() => calcularCortes(valores), [valores])
  const maximo = useMemo(() => Math.max(0, ...valores), [valores])
  const indicadores = useMemo(() => (mun ? calcularIndicadores(municipios) : null), [mun, municipios])
  const departamentos = useMemo(() => resumenPorDepartamento(municipios), [municipios])
  const ranking = useMemo(() => [...municipios].sort((a, b) => b.registros - a.registros), [municipios])

  const municipioSel = p.municipio ? datos.get(p.municipio) ?? null : null
  const deptoSel = municipioSel ? null : departamentos.find((d) => d.departamento === p.departamento) ?? null
  const deptoActivo = municipioSel?.departamento ?? deptoSel?.departamento ?? null
  const visibles = deptoActivo ? municipios.filter((m) => m.departamento === deptoActivo) : municipios
  const vista: Vista = p.vista === 'registros' && !esIndividual ? 'resumen' : p.vista ?? 'resumen'
  const nombreAlcance = municipioSel ? `${municipioSel.municipio} (${municipioSel.departamento})` : deptoSel?.departamento ?? null
  const alcance = municipioSel
    ? { codigo_municipal: municipioSel.codigo_municipal }
    : deptoSel ? { departamento: deptoSel.departamento } : {}

  function cambiar(cambios: Cambios) {
    const resetPagina = !('pagina' in cambios)
    setBusqueda(actualizarParametros(busqueda, resetPagina ? { ...cambios, pagina: null } : cambios), { replace: false })
  }

  const SIN_FILTROS: Cambios = {
    municipio: null, departamento: null, anio_desde: null, anio_hasta: null, buscar: null, con_foto: null,
    conservacion: null, amenaza: null, especie: null, nombre_especie: null, registro: null, orden: null,
  }

  function cambiarGrupo(g: Grupo) {
    cambiar({ ...SIN_FILTROS, grupo: g })
  }

  function seleccionarMunicipio(codigo: string | null) {
    const m = codigo ? datos.get(codigo) : null
    cambiar({ municipio: m ? m.codigo_municipal : null, departamento: m ? m.departamento : p.departamento })
  }

  function cambiarMetrica(m: Metrica) {
    cambiar({ metrica: m === METRICA_INICIAL ? null : m })
  }

  function filtrarEspecies(f: { conservacion: TipoConservacion; amenaza: Amenaza | null }) {
    cambiar({ vista: 'especies', conservacion: f.conservacion, amenaza: f.amenaza, buscar: null })
  }

  function verRegistrosDe(e: EspecieResumen) {
    cambiar({ vista: 'registros', especie: e.especie_clave, nombre_especie: e.especie.slice(0, 60), buscar: null, conservacion: null, amenaza: null })
  }

  const filtros = {
    departamento: deptoActivo, municipio: p.municipio, anioDesde: p.anioDesde, anioHasta: p.anioHasta, buscar: p.buscar,
    conFoto: p.conFoto, conservacion: p.conservacion, amenaza: p.amenaza, especie: p.especie, nombreEspecie: p.nombreEspecie,
  }
  const descripcion = metodo === 'agregado'
    ? 'Inventario agregado: el servicio entrega conteos y especies por municipio, no los registros individuales.'
    : 'Registros de ocurrencia publicados en GBIF, ubicados por municipio. Los conteos reflejan esfuerzo de muestreo.'

  const tablaMunicipios = (
    <div className="space-y-3">
      {!esIndividual && (
        <p className="text-sm text-text-muted">
          {NOMBRES_GRUPO[p.grupo]} se publica como inventario agregado: el servicio entrega solo el conteo por municipio, sin registros individuales.
        </p>
      )}
      <TablaMunicipios municipios={visibles} seleccionado={municipioSel?.codigo_municipal ?? null} onSeleccionar={seleccionarMunicipio} />
    </div>
  )

  const pestanas = [
    { id: 'resumen' as const, titulo: 'Resumen', contenido: (
      <Suspense fallback={<CargandoPestana />}>
        <PanelResumen grupo={p.grupo} alcance={alcance} nombreAlcance={nombreAlcance} esIndividual={esIndividual} onFiltrarEspecies={filtrarEspecies} />
      </Suspense>
    ) },
    ...(esIndividual ? [{ id: 'registros' as const, titulo: 'Registros', contenido: (
      <Suspense fallback={<CargandoPestana />}>
        <SeccionRegistros
          grupo={p.grupo} municipios={municipios} valores={filtros} pagina={p.pagina} modo={p.modo} abierto={p.registro}
          desde={mun?.desde ?? 2000} hasta={mun?.hasta ?? 2025} onCambio={cambiar}
          onLimpiar={() => cambiar({ ...SIN_FILTROS })}
        />
      </Suspense>
    ) }] : []),
    { id: 'especies' as const, titulo: 'Especies', contenido: (
      <Suspense fallback={<CargandoPestana />}>
        <SeccionEspecies
          grupo={p.grupo} esIndividual={esIndividual} municipio={p.municipio} departamento={deptoActivo} buscar={p.buscar}
          conservacion={p.conservacion} amenaza={p.amenaza} orden={p.orden} pagina={p.pagina} onCambio={cambiar} onVerRegistros={verRegistrosDe}
        />
      </Suspense>
    ) },
    { id: 'municipios' as const, titulo: 'Municipios', contenido: tablaMunicipios },
  ]

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
          <p className="text-sm text-text-muted max-w-md leading-relaxed">{descripcion}</p>
        </div>
        <SelectorGrupo grupo={p.grupo} grupos={estado.data?.grupos} onCambiar={cambiarGrupo} />
      </header>

      {munQ.isError && !mun ? (
        <PanelError error={munQ.error} onReintentar={() => void munQ.refetch()} />
      ) : mun && municipios.every((m) => m.registros === 0) ? (
        <PanelVacio titulo="Sin registros" detalle="Este grupo no tiene registros en el periodo consultado." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] items-start [&>*]:min-w-0">
            <PanelMapa
              datos={datos} metrica={p.metrica} cortes={cortes} maximo={maximo} seleccionado={municipioSel?.codigo_municipal ?? null}
              departamento={deptoActivo} cargandoDatos={!mun || munQ.isPlaceholderData} onSeleccionar={seleccionarMunicipio} onMetrica={cambiarMetrica}
            />
            <div className="space-y-6">
              <DetalleSeleccion
                municipio={municipioSel}
                puesto={municipioSel ? ranking.findIndex((m) => m.codigo_municipal === municipioSel.codigo_municipal) + 1 : null}
                totalGrupo={indicadores?.registros ?? 0}
                departamento={deptoSel}
                onLimpiar={() => cambiar({ municipio: null, departamento: null })}
              />
              {mun ? (
                <RankingPanel
                  municipios={municipios} seleccionado={municipioSel?.codigo_municipal ?? null} departamento={p.departamento}
                  onMunicipio={seleccionarMunicipio} onDepartamento={(d) => cambiar({ departamento: d, municipio: null })}
                />
              ) : <Cargando etiqueta="Cargando ranking" className="h-96" />}
            </div>
          </div>

          {mun && (
            <section className="bio-panel p-4 sm:p-5" aria-label="Detalle de los datos">
              <Pestanas etiqueta="Información del grupo" activa={vista} onCambiar={(v) => cambiar({ vista: v === 'resumen' ? null : v })} pestanas={pestanas} />
            </section>
          )}
        </>
      )}

      <AcercaDatos estado={estado.data} error={estado.error} cargando={estado.isPending} onReintentar={() => void estado.refetch()} />
    </div>
  )
}
