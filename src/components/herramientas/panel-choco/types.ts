// Formas tipadas de los datasets extraídos en data/*.generated.ts — ver ese
// directorio para el origen (dashboard_choco_biogeografico.html, Eddy Chaverra).

export interface DeptoArea {
  id: string
  name: string
  municipios: number
  area: number
  pct: number
}

export interface MunicipioArea {
  name: string
  area: number
}

/** Forma mínima compartida por cualquier listado de entidades territoriales con área
 * y porcentaje — departamentos, cuencas, o agregados calculados (ej. ciénagas por depto). */
export interface EntidadArea {
  id: string
  name: string
  area: number
  pct: number
}

export interface PredioNombreArea {
  nombre: string
  area: number
}

export interface DeptoTitulacion extends DeptoArea {
  cc: number
  ri: number
  st: number
  num_cc: number
  num_ri: number
}

export interface MunicipioTitulacion {
  name: string
  area: number
  cc: number
  ri: number
  st: number
  num_cc: number
  num_ri: number
  cc_nombres: PredioNombreArea[]
  ri_nombres: PredioNombreArea[]
}

export interface CuencaArea {
  id: string
  name: string
  area: number
  pct: number
}

export type SubcuencaPorCuenca = Record<string, MunicipioArea[]>
export type CuencaDeptoMunicipios = Record<string, Record<string, number>>

/** Serie categórica por departamento — forma compartida por RUNAP/humedales/páramos
 * (el dataset original usa nombres de clave distintos — "categorias"/"tipos"/"paramos" —
 * por eso cada archivo de datos expone la suya y se normaliza al consumirla). */
export interface CategoriaDeptoSerie {
  nombre: string
  datos: number[]
  color?: string
}

export interface DatasetCategoricoDepto {
  deptos: string[]
  series: CategoriaDeptoSerie[]
}

/** Formas crudas tal como las expone cada dataset extraído (nombre de la clave de
 * series varía: "categorias"/"tipos"/"paramos" — se normaliza al consumirlas). */
export interface RunapData {
  deptos: string[]
  categorias: CategoriaDeptoSerie[]
}

export interface HumedalData {
  deptos: string[]
  tipos: CategoriaDeptoSerie[]
}

export interface ParamosData {
  deptos: string[]
  paramos: CategoriaDeptoSerie[]
}

export type CategoriaMuniRow = { name: string } & Record<string, number>

export interface RunapDetalleItem {
  cat: string
  nombre: string
  dep: string
  mun: string
  area: number
  dep_id: string
}

export interface ParamosDetalleItem {
  nombre: string
  dep: string
  dep_id: string
  mun: string
  area: number
}

export interface CienagaEntrada {
  n: string
  a: number
}
export type CienagasPorDeptoMunicipio = Record<string, Record<string, CienagaEntrada[]>>

export interface DeptoPoblacion {
  id: string
  name: string
  municipios: number
  hombres: number
  mujeres: number
  total: number
  pct: number
}

export interface MunicipioPoblacion {
  name: string
  hombres: number
  mujeres: number
  total: number
}

export interface PiramideGrupo {
  grupo: string
  total: number
}

export interface EtniaDepto {
  id: string
  name: string
  indigena: number
  gitano: number
  raizal: number
  palenquero: number
  negro: number
  ninguno: number
  noinforma: number
}

export type EtniaMunicipio = Omit<EtniaDepto, 'id'>

export type CapaId =
  | 'resumen'
  | 'titulacion'
  | 'cuencas'
  | 'runap'
  | 'humedales'
  | 'paramos'
  | 'cienagas'
  | 'poblacion'

/** Fila cruda leída de un Excel subido — claves de columna sin normalizar. */
export type FilaExcel = Record<string, string | number | undefined>
