import type { EstadoSincronizacion, FuenteSincronizacion, ResumenSincronizacion, TipoInventario } from '@/types'

export const ETIQUETA_ESTADO: Record<EstadoSincronizacion, string> = {
  ok: 'Completa',
  parcial: 'Parcial',
  error: 'Con error',
}

export const ETIQUETA_FUENTE: Record<FuenteSincronizacion, string> = {
  'rest+ogc': 'API REST + OGC',
  ogc: 'Solo OGC (sin API REST)',
}

export const AVISO_SOLO_OGC =
  'La API REST de GeoServer no está disponible con esta cuenta: no se ven espacios de trabajo con título ni grupos no publicados. Pide a quien administra GeoServer una cuenta de solo lectura para la API REST.'

const MIN = 60_000
const HORA = 60 * MIN
const DIA = 24 * HORA

const plural = (n: number, singular: string, pluralTxt: string) => `${n} ${n === 1 ? singular : pluralTxt}`

export function haceCuanto(iso: string, ahora: number = Date.now()): string {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return 'en una fecha desconocida'
  const dif = Math.max(0, ahora - t)
  if (dif < MIN) return 'hace unos segundos'
  if (dif < HORA) return `hace ${Math.floor(dif / MIN)} min`
  if (dif < DIA) return `hace ${Math.floor(dif / HORA)} h`
  const dias = Math.floor(dif / DIA)
  return `hace ${plural(dias, 'día', 'días')}`
}

const TIPOS: ReadonlyArray<{ tipo: TipoInventario; etiqueta: string }> = [
  { tipo: 'espacios', etiqueta: 'Espacios de trabajo' },
  { tipo: 'capas', etiqueta: 'Capas' },
  { tipo: 'grupos', etiqueta: 'Grupos de capas' },
  { tipo: 'estilos', etiqueta: 'Estilos' },
]

export interface LineaResumen {
  tipo: TipoInventario
  etiqueta: string
  nuevos: number
  cambiados: number
  eliminados: number
}

export function lineasResumen(resumen: ResumenSincronizacion | null | undefined): LineaResumen[] {
  if (!resumen) return []
  return TIPOS.flatMap(({ tipo, etiqueta }) => {
    const c = resumen[tipo]
    return c ? [{ tipo, etiqueta, nuevos: c.nuevos ?? 0, cambiados: c.cambiados ?? 0, eliminados: c.eliminados ?? 0 }] : []
  })
}

const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function coincideBusqueda(campos: ReadonlyArray<string | null | undefined>, busqueda: string): boolean {
  const palabras = sinTildes(busqueda).split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return true
  const texto = sinTildes(campos.filter(Boolean).join(' '))
  return palabras.every((p) => texto.includes(p))
}
