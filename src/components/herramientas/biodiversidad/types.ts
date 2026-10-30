export const GRUPOS = ['aves', 'mamiferos', 'anfibios', 'reptiles', 'insectos', 'plantas', 'hongos'] as const
export type Grupo = (typeof GRUPOS)[number]

export type Metodo = 'individual' | 'agregado'

export interface GrupoEstado {
  grupo: Grupo
  metodo: Metodo
  desde: number
  hasta: number
  registros: number
  fecha_fuente: string | null
  doi: string | null
}

export interface EstadoBiodiversidad {
  grupos: GrupoEstado[]
  conservacion: { activa: boolean; actualizada_en: string | null }
  aviso: string
}

export interface MunicipioConteo {
  codigo_municipal: string
  municipio: string
  departamento: string
  registros: number
  sin_especie: number
}

export interface RespuestaMunicipios {
  grupo: Grupo
  metodo: Metodo
  desde: number
  hasta: number
  municipios: MunicipioConteo[]
}

export interface RegistroBiodiversidad {
  gbif_id: string
  especie: string | null
  especie_clave: string | null
  anio: number | null
  tipo_evidencia: string | null
  licencia: string | null
  latitud: number | null
  longitud: number | null
  incertidumbre_m: number | null
  coordenadas_ocultas: boolean
  conjunto: string | null
  doi_conjunto: string | null
  codigo_municipal: string
  municipio: string
  departamento: string
}

export interface RespuestaRegistros {
  grupo: Grupo
  desde: number
  hasta: number
  pagina: number
  tamano: number
  total: number
  registros: RegistroBiodiversidad[]
}

export interface FiltrosRegistros {
  grupo: Grupo
  codigo_municipal?: string
  departamento?: string
  anio_desde?: number
  anio_hasta?: number
  pagina: number
  tamano: number
}

export const NOMBRES_GRUPO: Record<Grupo, string> = {
  aves: 'Aves',
  mamiferos: 'Mamíferos',
  anfibios: 'Anfibios',
  reptiles: 'Reptiles',
  insectos: 'Insectos',
  plantas: 'Plantas',
  hongos: 'Hongos',
}

export function esGrupo(valor: unknown): valor is Grupo {
  return typeof valor === 'string' && (GRUPOS as readonly string[]).includes(valor)
}
