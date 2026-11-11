import api from '@/lib/api'
import type { Cifra, DatosInforme, TablaInforme } from '@/lib/generarInforme'
import { fmtFecha, fmtNum, fmtNumONulo } from '../lib/format'
import {
  NOMBRES_GRUPO,
  type EspecieResumen, type Grupo, type GrupoEstado, type Metodo, type MunicipioConteo, type ParamsApi,
  type RespuestaEspecies, type RespuestaResumen,
} from '../types'

/** La API entrega 100 por página y el límite público es de 100 peticiones cada 15 minutos: el informe se queda en unas pocas páginas. */
export const ESPECIES_MAXIMAS_POR_INFORME = 300
const TAMANO_PAGINA = 100

export interface EntradaInforme {
  grupo: Grupo
  metodo: Metodo
  info: GrupoEstado | undefined
  /** Aviso de la herramienta sobre cómo leer los datos (lo entrega el servicio). */
  aviso: string | undefined
  /** Texto de cada filtro activo («Familia: Hylidae»). */
  filtros: string[]
  ranking: MunicipioConteo[]
  resumen: RespuestaResumen
  especies: EspecieResumen[]
  totalEspecies: number
  maxFilas: number
  generadoEn: Date
}

/** Fecha de la consulta, en la hora de quien la hace. La del corte de datos se formatea aparte, en UTC (ver fmtFecha). */
const fechaLarga = (d: Date) => d.toLocaleDateString('es-CO', { dateStyle: 'long' })
const dosCifras = (n: number) => String(n).padStart(2, '0')
const diaLocal = (d: Date) => `${d.getFullYear()}-${dosCifras(d.getMonth() + 1)}-${dosCifras(d.getDate())}`

function conservacion(e: EspecieResumen): string | null {
  const partes = [
    e.amenaza ? `Amenazada (${e.amenaza})` : null,
    e.endemica_choco ? 'Endémica del Chocó' : null,
    e.endemica_colombia && !e.endemica_choco ? 'Endémica de Colombia' : null,
    e.introducida ? 'Introducida' : null,
    e.invasora ? 'Invasora' : null,
  ].filter((p): p is string => p !== null)
  return partes.length > 0 ? partes.join(', ') : null
}

function cifras(r: RespuestaResumen, info: GrupoEstado | undefined): Cifra[] {
  const a = r.amenazadas
  const periodo = r.anio_min !== null && r.anio_max !== null ? `${r.anio_min}-${r.anio_max}` : info ? `${info.desde}-${info.hasta}` : null
  const sinCalculo = 'No se calcula con este filtro'
  const opcional = (etiqueta: string, valor: number | null): Cifra[] => (valor === null ? [] : [{ etiqueta, valor: fmtNum(valor) }])
  return [
    { etiqueta: 'Registros', valor: fmtNum(r.registros) },
    { etiqueta: 'Especies', valor: fmtNumONulo(r.especies), nota: r.especies === null ? sinCalculo : 'Distintas documentadas' },
    ...opcional('Registros con foto', r.con_foto),
    {
      etiqueta: 'Especies amenazadas', valor: fmtNumONulo(a.total),
      nota: a.total === null ? sinCalculo : `CR ${fmtNumONulo(a.CR)} · EN ${fmtNumONulo(a.EN)} · VU ${fmtNumONulo(a.VU)}`,
    },
    ...opcional('Endémicas de Colombia', r.endemicas_colombia),
    ...opcional('Endémicas del Chocó', r.endemicas_choco),
    ...opcional('Introducidas', r.introducidas),
    ...opcional('Invasoras', r.invasoras),
    ...(periodo ? [{ etiqueta: 'Periodo de los registros', valor: periodo }] : []),
    ...opcional('Entidades publicadoras', r.entidades),
    ...opcional('Conjuntos de datos', r.conjuntos),
  ]
}

function tablaMunicipios(ranking: MunicipioConteo[], maxFilas: number): TablaInforme {
  const conRegistros = ranking.filter((m) => m.registros > 0)
  const filas = conRegistros.slice(0, maxFilas)
  return {
    titulo: 'Registros por municipio',
    columnas: ['Municipio', 'Departamento', 'Registros', 'Especies'],
    filas: filas.map((m) => [m.municipio, m.departamento, m.registros, m.especies]),
    numericas: [2, 3],
    nota: conRegistros.length > filas.length ? `Se muestran los ${fmtNum(filas.length)} municipios con más registros de ${fmtNum(conRegistros.length)}.` : undefined,
  }
}

function tablaEspecies(especies: EspecieResumen[], total: number): TablaInforme {
  return {
    titulo: 'Especies con más registros',
    columnas: ['Especie', 'Familia', 'Orden', 'Registros', 'Municipios', 'Conservación'],
    filas: especies.map((e) => [e.especie, e.familia, e.orden, e.registros, e.municipios, conservacion(e)]),
    numericas: [3, 4],
    principal: true,
    nota: total > especies.length ? `Se incluyen las ${fmtNum(especies.length)} especies con más registros de ${fmtNum(total)}.` : undefined,
  }
}

function fuente(e: EntradaInforme): string[] {
  const { info } = e
  const doi = info?.doi ? (info.doi.startsWith('http') ? info.doi : `https://doi.org/${info.doi}`) : null
  return [
    'Fuente: GBIF (Global Biodiversity Information Facility), https://www.gbif.org.',
    ...(info?.fecha_fuente ? [`Corte de datos: ${fmtFecha(info.fecha_fuente)}.`] : []),
    ...(info ? [`Periodo del corte: ${info.desde}-${info.hasta}. Registros del corte: ${fmtNum(info.registros)}.`] : []),
    ...(doi ? [`DOI del corte: ${doi}`] : []),
    `Consulta realizada el ${fechaLarga(e.generadoEn)}.`,
    ...(e.metodo === 'agregado' ? ['Inventario agregado: el servicio entrega conteos por municipio, no registros individuales.'] : []),
    'Cada conjunto de datos conserva su licencia original (por ejemplo CC BY o CC0): consulta la fuente de cada conjunto antes de reutilizar los datos.',
    'Más registros indica dónde se ha muestreado más, no dónde hay más vida.',
    ...(e.aviso ? [e.aviso] : []),
  ]
}

/** Arma el informe a partir de lo que ya se consultó. No toca la red: es lo que se prueba. */
export function construirInforme(e: EntradaInforme): DatosInforme {
  const dia = diaLocal(e.generadoEn)
  return {
    titulo: `Observatorio de Biodiversidad - ${NOMBRES_GRUPO[e.grupo]}`,
    subtitulo: e.metodo === 'agregado' ? 'Inventario agregado por municipio' : 'Registros de ocurrencia por municipio',
    generadoEn: e.generadoEn,
    filtros: [`Grupo: ${NOMBRES_GRUPO[e.grupo]}`, ...e.filtros],
    secciones: [
      { titulo: 'Cifras clave', cifras: cifras(e.resumen, e.info) },
      { titulo: 'Territorio', tablas: [tablaMunicipios(e.ranking, e.maxFilas)] },
      { titulo: 'Especies', tablas: [tablaEspecies(e.especies, e.totalEspecies)] },
    ],
    fuente: fuente(e),
    nombreArchivo: `informe-biodiversidad-${e.grupo}-${dia}`,
  }
}

export interface ContextoConsulta {
  grupo: Grupo
  metodo: Metodo
  info: GrupoEstado | undefined
  aviso: string | undefined
  filtros: string[]
  ranking: MunicipioConteo[]
  paramsResumen: ParamsApi
  paramsEspecies: ParamsApi
}

/** Consulta el resumen y las especies principales con los filtros vigentes, y arma el informe. */
export async function reunirInforme(c: ContextoConsulta, maxFilas: number, signal: AbortSignal): Promise<DatosInforme> {
  const limite = Math.min(maxFilas, ESPECIES_MAXIMAS_POR_INFORME)
  const resumen: RespuestaResumen = await api.get('/biodiversidad/resumen', { params: { grupo: c.grupo, ...c.paramsResumen }, signal })
  const especies: EspecieResumen[] = []
  let total = 0
  for (let pagina = 1; especies.length < limite; pagina += 1) {
    const respuesta: RespuestaEspecies = await api.get('/biodiversidad/especies', {
      params: { grupo: c.grupo, ...c.paramsEspecies, orden: 'registros', pagina, tamano: TAMANO_PAGINA }, signal,
    })
    total = respuesta.total
    especies.push(...respuesta.especies)
    if (respuesta.especies.length < TAMANO_PAGINA || especies.length >= total) break
  }
  return construirInforme({
    grupo: c.grupo, metodo: c.metodo, info: c.info, aviso: c.aviso, filtros: c.filtros, ranking: c.ranking,
    resumen, especies: especies.slice(0, limite), totalEspecies: total, maxFilas, generadoEn: new Date(),
  })
}
