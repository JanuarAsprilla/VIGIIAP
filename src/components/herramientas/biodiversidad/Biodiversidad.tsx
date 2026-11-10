import { lazy, Suspense, useCallback, useMemo, useRef, useState } from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useBiodiversidadResumen } from '@/hooks/useBiodiversidad'
import './biodiversidad.css'
import './filtros.css'
import AcercaDatos from './AcercaDatos'
import DetalleSeleccion from './DetalleSeleccion'
import { Cargando, PanelError, PanelVacio } from './EstadoConsulta'
import AvisoFiltros from './filtros/AvisoFiltros'
import BarraFiltros from './filtros/BarraFiltros'
import ContenedorFiltros from './filtros/ContenedorFiltros'
import PanelFiltros from './filtros/PanelFiltros'
import SinResultados from './filtros/SinResultados'
import GrupoIcono from './GrupoIcono'
import Pestanas from './Pestanas'
import RankingPanel from './RankingPanel'
import SelectorGrupo from './SelectorGrupo'
import TablaMunicipios from './TablaMunicipios'
import { fmtNum } from './lib/format'
import { cambiosConservacion, cambiosEspecie } from './lib/filtros'
import { etiquetaMetodo } from './lib/metodo'
import { METRICA_INICIAL, type Metrica } from './lib/metrica'
import { ordenEspecies, ordenRegistros } from './lib/orden'
import { paramsApi } from './lib/paramsApi'
import type { Vista } from './lib/parametros'
import { estiloGrupo } from './lib/paleta'
import { ubicacionPublica } from './lib/puntos'
import PanelMapa from './mapa/PanelMapa'
import type { Enfoque } from './mapa/tiposPuntos'
import { useTablero } from './useTablero'
import {
  NOMBRES_GRUPO, type Amenaza, type EspecieResumen, type RegistroBiodiversidad, type TipoConservacion,
} from './types'

const PanelResumen = lazy(() => import('./resumen/PanelResumen'))
const SeccionEspecies = lazy(() => import('./especies/SeccionEspecies'))
const SeccionRegistros = lazy(() => import('./registros/SeccionRegistros'))
const DetalleRegistro = lazy(() => import('./registros/DetalleRegistro'))

function CargandoPestana() {
  return <Cargando etiqueta="Cargando contenido" className="h-72" />
}

function sinMovimiento(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

export default function Biodiversidad() {
  const t = useTablero()
  const { p, filtros: f, apl, metodo, esIndividual, mun, municipios, municipioSel, deptoSel, deptoActivo } = t
  const ancho = useMediaQuery('(min-width: 64rem)')
  // En pantalla ancha el panel arranca abierto (columna lateral, secciones recogidas); en móvil y tableta es una hoja
  // modal y arranca cerrado. Desde que la persona pulsa «Filtros» o lo cierra, manda su elección.
  const [panelUsuario, setPanelUsuario] = useState<boolean | null>(null)
  const panelAbierto = panelUsuario ?? ancho
  const botonPanel = useRef<HTMLButtonElement>(null)
  const origenDetalle = useRef<HTMLElement | null>(null)
  const [enfoque, setEnfoque] = useState<Enfoque | null>(null)

  const vista: Vista = p.vista === 'registros' && !esIndividual ? 'resumen' : p.vista ?? 'resumen'
  const paramsResumen = useMemo(() => paramsApi('resumen', f, metodo), [f, metodo])
  const resumenQ = useBiodiversidadResumen(p.grupo, paramsResumen)
  const paramsSeries = useMemo(() => paramsApi('series', f, metodo), [f, metodo])
  const paramsEspecies = useMemo(() => paramsApi('especies', f, metodo), [f, metodo])
  const paramsRegistros = useMemo(() => paramsApi('registros', f, metodo), [f, metodo])
  const paramsPuntos = useMemo(() => paramsApi('puntos', f, metodo), [f, metodo])
  const paramsOpciones = useMemo(() => paramsApi('opciones', f, metodo), [f, metodo])
  const ayuda = useMemo(() => ({ chips: t.chips, onCambio: t.cambiar, onLimpiar: t.limpiar }), [t.chips, t.cambiar, t.limpiar])

  const seleccionarMunicipio = useCallback((codigo: string | null) => {
    const m = codigo ? t.datos.get(codigo) : null
    t.cambiar({ municipio: m ? m.codigo_municipal : null, departamento: m ? m.departamento : f.departamento })
  }, [t, f.departamento])

  // Al cambiar de pestaña o de filtro desde un botón puntual, la página queda a media altura: se lleva la vista al inicio
  // del detalle. Se alinea dos veces: la pestaña carga de forma diferida y su altura cambia después del primer ajuste.
  const irAlDetalle = () => {
    const alinear = (behavior: ScrollBehavior) => document.getElementById('bio-detalle-datos')?.scrollIntoView({ behavior, block: 'start' })
    requestAnimationFrame(() => {
      alinear(sinMovimiento() ? 'auto' : 'smooth')
      window.setTimeout(() => alinear('auto'), 500)
    })
  }
  const filtrarEspecies = (c: { conservacion: TipoConservacion; amenaza: Amenaza | null }) => {
    t.cambiar({ vista: 'especies', ...cambiosConservacion(c.conservacion, c.amenaza), buscar: null })
    irAlDetalle()
  }
  const verRegistrosDe = (e: EspecieResumen) => {
    t.cambiar({ vista: 'registros', ...cambiosEspecie(e.especie_clave, e.especie), conservacion: null, amenaza: null })
    irAlDetalle()
  }
  const verMunicipiosDe = (e: EspecieResumen) => {
    t.cambiar({ vista: 'municipios', ...cambiosEspecie(e.especie_clave, e.especie), conservacion: null, amenaza: null })
    irAlDetalle()
  }
  const abrirRegistro = (r: RegistroBiodiversidad, el: HTMLElement) => { origenDetalle.current = el; t.cambiar({ registro: r.gbif_id, pagina: p.pagina }) }
  const abrirDesdeMapa = (id: string, el: HTMLElement) => { origenDetalle.current = el; t.cambiar({ registro: id, pagina: p.pagina }) }

  function verEnMapa(r: RegistroBiodiversidad) {
    const u = ubicacionPublica(r)
    if (!u) return
    setEnfoque({ id: r.gbif_id, ...u, vez: Date.now() })
    t.cambiar({ puntos: '1', registro: null, pagina: p.pagina })
    document.getElementById('bio-mapa-seccion')?.scrollIntoView({ behavior: sinMovimiento() ? 'auto' : 'smooth', block: 'start' })
  }

  const descripcion = metodo === 'agregado'
    ? 'Inventario agregado: el servicio entrega conteos y especies por municipio, no los registros individuales. Más registros indica dónde se ha muestreado más, no dónde hay más vida.'
    : 'Registros de ocurrencia publicados en GBIF y ubicados por municipio. Más registros indica dónde se ha muestreado más, no dónde hay más vida.'
  // Misma consulta (y misma caché) que el panel de Resumen: sale con los filtros activos.
  const resumenGrupo = resumenQ.data ?? null
  const totalRegistros = resumenGrupo?.registros ?? t.indicadores?.registros ?? null
  const masRegistros = t.ranking[0] && t.ranking[0].registros > 0 ? t.ranking[0] : null
  const hayFiltros = t.chips.length > 0
  const vacio = Boolean(mun) && municipios.every((m) => m.registros === 0)
  const filtrosEnPanel = (idTitulo: string, cerrar?: () => void) => (
    <PanelFiltros
      grupo={p.grupo} metodo={metodo} filtros={f} apl={apl} municipios={municipios} paramsOpciones={paramsOpciones}
      desde={mun?.desde ?? 2000} hasta={mun?.hasta ?? 2025} resultado={t.resumen} idTitulo={idTitulo}
      onCambio={t.cambiar} onLimpiar={t.limpiar} onCerrar={cerrar}
    />
  )

  const tablaMunicipios = (
    <div className="space-y-3">
      {!esIndividual && (
        <p className="text-sm text-text-muted">
          {NOMBRES_GRUPO[p.grupo]} se publica como inventario agregado: el servicio entrega solo el conteo por municipio, sin registros individuales.
        </p>
      )}
      <TablaMunicipios
        municipios={deptoActivo ? municipios.filter((m) => m.departamento === deptoActivo) : municipios}
        seleccionado={municipioSel?.codigo_municipal ?? null} onSeleccionar={seleccionarMunicipio}
      />
    </div>
  )

  const pestanas = [
    { id: 'resumen' as const, titulo: 'Resumen', contenido: (
      <Suspense fallback={<CargandoPestana />}>
        <PanelResumen
          grupo={p.grupo} paramsResumen={paramsResumen} paramsSeries={paramsSeries} paramsEspecies={paramsEspecies}
          nombreAlcance={t.nombreAlcance} esIndividual={esIndividual}
          notaSeries={!esIndividual && Object.keys(paramsSeries).length < Object.keys(paramsResumen).length ? 'La serie por año solo considera el territorio: en inventarios agregados no se cruza con taxonomía, especie ni fuente.' : null}
          onFiltrarEspecies={filtrarEspecies} onVerRegistros={verRegistrosDe}
        />
      </Suspense>
    ) },
    ...(esIndividual ? [{ id: 'registros' as const, titulo: 'Registros', contenido: (
      <Suspense fallback={<CargandoPestana />}>
        <SeccionRegistros
          grupo={p.grupo} params={paramsRegistros} orden={ordenRegistros(p.ordenar)} pagina={p.pagina} modo={p.modo}
          ayuda={ayuda} onCambio={t.cambiar} onAbrir={abrirRegistro} onVerEnMapa={verEnMapa}
        />
      </Suspense>
    ) }] : []),
    { id: 'especies' as const, titulo: 'Especies', contenido: (
      <Suspense fallback={<CargandoPestana />}>
        <SeccionEspecies
          grupo={p.grupo} esIndividual={esIndividual} params={paramsEspecies} orden={ordenEspecies(p.ordenar)} modo={p.modo} pagina={p.pagina}
          ayuda={ayuda} onCambio={t.cambiar} onVerRegistros={verRegistrosDe} onVerMunicipios={verMunicipiosDe}
        />
      </Suspense>
    ) },
    { id: 'municipios' as const, titulo: 'Municipios', contenido: tablaMunicipios },
  ]

  return (
    <div className="bio-root bio-tema space-y-4" style={estiloGrupo(p.grupo)}>
      <header className="bio-panel p-4 sm:p-6 space-y-5">
        <div className="space-y-2.5">
          <p className="bio-eyebrow">Chocó biogeográfico · datos de GBIF</p>
          <SelectorGrupo grupo={p.grupo} onCambiar={t.cambiarGrupo} />
        </div>
        <div className="bio-cambia space-y-4" key={p.grupo}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="bio-titulo-grupo">
              <span className="bio-titulo-chip"><GrupoIcono grupo={p.grupo} /></span>
              <p className="font-display text-[clamp(1.75rem,4.5vw,2.75rem)] font-bold leading-none text-text" aria-live="polite">
                {NOMBRES_GRUPO[p.grupo]}
              </p>
            </div>
            <span className="bio-insignia">{etiquetaMetodo(metodo)}</span>
          </div>
          <p className="text-sm text-text-muted max-w-3xl leading-relaxed">{descripcion}</p>
          <dl className="bio-datos-grupo" aria-label={hayFiltros ? 'Datos del grupo con los filtros activos' : 'Datos del grupo'}>
            <div className="bio-dato-grupo bio-dato-grupo-principal">
              <dt>Registros</dt>
              <dd className="bio-cifra text-[clamp(2rem,4.5vw,3rem)]">{totalRegistros !== null ? fmtNum(totalRegistros) : '—'}</dd>
              <dd className="bio-dato-sub">{hayFiltros ? 'Con los filtros activos' : 'En el corte vigente'}</dd>
            </div>
            <div className="bio-dato-grupo">
              <dt>Especies</dt>
              <dd className="bio-cifra text-[clamp(1.75rem,3.6vw,2.5rem)]">{resumenGrupo?.especies != null ? fmtNum(resumenGrupo.especies) : '—'}</dd>
              <dd className="bio-dato-sub">{resumenGrupo?.especies != null ? 'Distintas documentadas' : resumenGrupo ? 'No se calcula con este filtro' : ''}</dd>
            </div>
            <div className="bio-dato-grupo">
              <dt>Especies amenazadas</dt>
              <dd className="bio-cifra text-[clamp(1.75rem,3.6vw,2.5rem)]">{resumenGrupo?.amenazadas.total != null ? fmtNum(resumenGrupo.amenazadas.total) : '—'}</dd>
              <dd className="bio-dato-sub">{resumenGrupo?.amenazadas.total != null ? 'En categoría CR, EN o VU' : resumenGrupo ? 'No se calcula con este filtro' : ''}</dd>
            </div>
            <div className="bio-dato-grupo">
              <dt>Municipios con datos</dt>
              <dd className="bio-cifra text-[clamp(1.75rem,3.6vw,2.5rem)]">
                {t.indicadores ? <>{t.indicadores.municipiosConRegistros}<span className="text-text-muted text-[0.5em] font-semibold"> / {t.indicadores.totalMunicipios}</span></> : '—'}
              </dd>
              <dd className="bio-dato-sub">
                {t.indicadores && t.indicadores.totalMunicipios > 0 && (
                  <span className="bio-barra-mini" aria-hidden="true"><span style={{ width: `${Math.round((t.indicadores.municipiosConRegistros / t.indicadores.totalMunicipios) * 100)}%` }} /></span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <BarraFiltros
        grupo={p.grupo} metodo={metodo} filtros={f} apl={apl} chips={t.chips} resumen={t.resumen}
        panelAbierto={panelAbierto} botonPanel={botonPanel} onTogglePanel={() => setPanelUsuario(!panelAbierto)}
        onCambio={t.cambiar} onLimpiar={t.limpiar}
      />
      {t.avisoCambio && <AvisoFiltros titulo={t.avisoCambio.titulo} elementos={t.avisoCambio.elementos} onCerrar={t.cerrarAviso} />}
      {!t.avisoCambio && t.descartados.length > 0 && (
        <AvisoFiltros titulo={`No aplican a ${NOMBRES_GRUPO[p.grupo]} y se ignoran:`} elementos={t.descartados} onCerrar={t.limpiar} />
      )}

      <div className={`bio-con-filtros ${ancho && panelAbierto ? 'bio-con-filtros-abierto' : ''}`}>
        <ContenedorFiltros ancho={ancho} abierto={panelAbierto} origen={botonPanel} onCerrar={() => setPanelUsuario(false)}>
          {filtrosEnPanel}
        </ContenedorFiltros>
        <div className="bio-principal space-y-6">
          {t.munQ.isError && !mun ? (
            <PanelError error={t.munQ.error} onReintentar={() => void t.munQ.refetch()} />
          ) : vacio && hayFiltros ? (
            <SinResultados titulo="Ningún registro cumple estos filtros" sinFiltros="" {...ayuda} />
          ) : vacio ? (
            <PanelVacio titulo="Sin registros" detalle="Este grupo no tiene registros en el periodo consultado." />
          ) : (
            <>
              <div className="bio-rejilla-mapa [&>*]:min-w-0">
                <PanelMapa
                  grupo={p.grupo} datos={t.datos} metrica={p.metrica} cortes={t.cortes} maximo={t.maximo}
                  seleccionado={municipioSel?.codigo_municipal ?? null} departamento={deptoActivo} cargandoDatos={!mun || t.munQ.isPlaceholderData}
                  puntosDisponibles={esIndividual} puntosActivos={p.puntos} paramsPuntos={paramsPuntos} enfoque={enfoque}
                  onSeleccionar={seleccionarMunicipio} onMetrica={(m: Metrica) => t.cambiar({ metrica: m === METRICA_INICIAL ? null : m })}
                  onPuntos={(a) => t.cambiar({ puntos: a ? '1' : null })} onAbrirRegistro={abrirDesdeMapa}
                />
                <div className="space-y-6">
                  <DetalleSeleccion
                    municipio={municipioSel}
                    puesto={municipioSel ? t.ranking.findIndex((m) => m.codigo_municipal === municipioSel.codigo_municipal) + 1 : null}
                    totalGrupo={t.indicadores?.registros ?? 0}
                    departamento={deptoSel}
                    destacado={masRegistros}
                    onElegir={seleccionarMunicipio}
                    onLimpiar={() => t.cambiar({ municipio: null, departamento: null })}
                  />
                  {mun ? (
                    <RankingPanel
                      municipios={municipios} metrica={p.metrica} seleccionado={municipioSel?.codigo_municipal ?? null} departamento={f.departamento}
                      onMunicipio={seleccionarMunicipio} onDepartamento={(d) => t.cambiar({ departamento: d, municipio: null })}
                    />
                  ) : <Cargando etiqueta="Cargando ranking" className="h-96" />}
                </div>
              </div>
              {mun && (
                <section id="bio-detalle-datos" className="bio-panel p-4 sm:p-5" aria-label="Detalle de los datos">
                  <Pestanas etiqueta="Información del grupo" activa={vista} onCambiar={(v) => t.cambiar({ vista: v === 'resumen' ? null : v })} pestanas={pestanas} />
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {p.registro && esIndividual && (
        <Suspense fallback={null}>
          <DetalleRegistro grupo={p.grupo} gbifId={p.registro} origen={origenDetalle} onCerrar={() => t.cambiar({ registro: null, pagina: p.pagina })} onVerEnMapa={verEnMapa} />
        </Suspense>
      )}

      <AcercaDatos estado={t.estado.data} error={t.estado.error} cargando={t.estado.isPending} onReintentar={() => void t.estado.refetch()} />
    </div>
  )
}
