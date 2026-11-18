import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useBiodiversidadEstado, useBiodiversidadMunicipios } from '@/hooks/useBiodiversidad'
import { alCambiarGrupo, aplicabilidad, METODO_DE_GRUPO, reconciliar } from './lib/aplicabilidad'
import { chipsActivos, recordarNombres, SIN_NOMBRES, soloNombresVerificados, textoResumen, type NombresVerificados } from './lib/chips'
import { calcularIndicadores, registrosEnTerritorio, resumenPorDepartamento } from './lib/derivar'
import { calcularCortes, valoresDeEscala } from './lib/escala'
import { QUITAR_TODOS, leerFiltros, type CambiosUrl } from './lib/filtros'
import { actualizarParametros, leerParametros } from './lib/parametros'
import { paramsApi } from './lib/paramsApi'
import { corregirTerritorio } from './lib/territorio'
import { NOMBRES_GRUPO, type Grupo, type MunicipioConteo } from './types'
import { fmtNum } from './lib/format'

const SIN_MUNICIPIOS: MunicipioConteo[] = []

export interface AvisoCambio {
  titulo: string
  elementos: string[]
}

/** Estado completo del tablero: parámetros de la URL, filtros efectivos, consultas de municipios y valores derivados. */
export function useTablero() {
  const [busqueda, setBusqueda] = useSearchParams()
  const p = useMemo(() => leerParametros(busqueda), [busqueda])
  const crudos = useMemo(() => leerFiltros(busqueda), [busqueda])
  const estado = useBiodiversidadEstado()
  const info = estado.data?.grupos.find((g) => g.grupo === p.grupo)
  const metodo = info?.metodo ?? METODO_DE_GRUPO[p.grupo]
  const esIndividual = metodo === 'individual'
  const [avisoCambio, setAvisoCambio] = useState<AvisoCambio | null>(null)
  const [nombres, setNombres] = useState<NombresVerificados>(SIN_NOMBRES)

  const reconciliado = useMemo(() => reconciliar(crudos, metodo), [crudos, metodo])
  // Filtros ignorados por el método (p. ej. entidad con familia en agregados): se avisa y se quitan de la URL para que no reaparezcan al soltar el otro.
  if (reconciliado.descartados.length > 0 && avisoCambio?.elementos !== reconciliado.descartados) {
    setAvisoCambio({ titulo: `No aplican a ${NOMBRES_GRUPO[p.grupo]} y se quitaron:`, elementos: reconciliado.descartados })
  }
  useEffect(() => {
    if (reconciliado.descartados.length > 0) setBusqueda(actualizarParametros(busqueda, reconciliado.limpieza), { replace: true })
  }, [reconciliado, busqueda, setBusqueda])
  const paramsMunicipios = useMemo(() => paramsApi('municipios', reconciliado.efectivos, metodo), [reconciliado, metodo])
  const munQ = useBiodiversidadMunicipios(p.grupo, paramsMunicipios)
  const baseQ = useBiodiversidadMunicipios(p.grupo)
  const mun = munQ.data
  const municipios = mun?.municipios ?? SIN_MUNICIPIOS

  // Un enlace con municipio de otro departamento, o con valores que no existen, se corrige en la URL sin añadir historial.
  const correccionTerritorio = useMemo(() => (mun ? corregirTerritorio(crudos, municipios) : null), [mun, crudos, municipios])
  useEffect(() => {
    if (correccionTerritorio) setBusqueda(actualizarParametros(busqueda, correccionTerritorio), { replace: true })
  }, [correccionTerritorio, busqueda, setBusqueda])

  const datos = useMemo(() => new Map(municipios.map((m) => [m.codigo_municipal, m])), [municipios])
  const valores = useMemo(() => valoresDeEscala(municipios, p.metrica), [municipios, p.metrica])
  const cortes = useMemo(() => calcularCortes(valores), [valores])
  const maximo = useMemo(() => Math.max(0, ...valores), [valores])
  const indicadores = useMemo(() => (mun ? calcularIndicadores(municipios) : null), [mun, municipios])
  const departamentos = useMemo(() => resumenPorDepartamento(municipios), [municipios])
  const ranking = useMemo(() => [...municipios].sort((a, b) => b.registros - a.registros), [municipios])

  const f = reconciliado.efectivos
  const municipioSel = f.municipio ? datos.get(f.municipio) ?? null : null
  const deptoSel = municipioSel ? null : departamentos.find((d) => d.departamento === f.departamento) ?? null
  const deptoActivo = municipioSel?.departamento ?? deptoSel?.departamento ?? null
  const codigoSel = municipioSel?.codigo_municipal ?? null
  const filtros = mun ? { ...f, municipio: codigoSel, departamento: deptoActivo } : f
  const apl = aplicabilidad(metodo, filtros)
  const nombreAlcance = municipioSel ? `${municipioSel.municipio} (${municipioSel.departamento})` : deptoSel?.departamento ?? null
  const nombreMunicipio = municipioSel?.municipio ?? null
  const chips = chipsActivos(filtros, nombreMunicipio, nombres)

  const filtrados = mun ? registrosEnTerritorio(municipios, municipioSel?.codigo_municipal ?? null, deptoSel?.departamento ?? null) : null
  const baseMun = baseQ.data?.municipios
  const total = baseMun ? registrosEnTerritorio(baseMun, municipioSel?.codigo_municipal ?? null, deptoSel?.departamento ?? null) : null
  const resumen = textoResumen(soloNombresVerificados(filtros, nombres), NOMBRES_GRUPO[p.grupo], nombreAlcance, filtrados, total, fmtNum)

  const cambiar = useCallback((cambios: CambiosUrl) => {
    setAvisoCambio(null)
    setNombres((previos) => recordarNombres(previos, cambios))
    const resetPagina = !('pagina' in cambios)
    setBusqueda(actualizarParametros(busqueda, resetPagina ? { ...cambios, pagina: null } : cambios), { replace: false })
  }, [busqueda, setBusqueda])

  const limpiar = useCallback(() => cambiar({ ...QUITAR_TODOS }), [cambiar])
  // Cerrar el aviso de filtros que no aplican quita solo esos filtros de la URL, no los que sí están en uso.
  const limpiarDescartados = useCallback(() => cambiar({ ...reconciliado.limpieza }), [cambiar, reconciliado])

  const cambiarGrupo = useCallback((g: Grupo) => {
    const nuevo = estado.data?.grupos.find((x) => x.grupo === g)?.metodo ?? METODO_DE_GRUPO[g]
    const r = alCambiarGrupo(crudos, nuevo)
    const quitados = r.descartados
    setBusqueda(actualizarParametros(busqueda, {
      ...r.limpieza, grupo: g, pagina: null, orden: null, ordenar: null, registro: null,
      vista: nuevo === 'agregado' && p.vista === 'registros' ? null : p.vista,
      puntos: nuevo === 'agregado' ? null : busqueda.get('puntos'),
    }), { replace: false })
    setAvisoCambio(quitados.length > 0 ? { titulo: `Al pasar a ${NOMBRES_GRUPO[g]} se quitaron filtros que no aplican:`, elementos: quitados } : null)
  }, [busqueda, crudos, estado.data, p.vista, setBusqueda])

  return {
    p, filtros, apl, metodo, esIndividual, info, estado, munQ, mun, municipios, datos, cortes, maximo, indicadores, ranking,
    municipioSel, deptoSel, deptoActivo, nombreAlcance, chips, filtrados, resumen, descartados: reconciliado.descartados,
    avisoCambio, cerrarAviso: () => setAvisoCambio(null), cambiar, limpiar, limpiarDescartados, cambiarGrupo,
  }
}
