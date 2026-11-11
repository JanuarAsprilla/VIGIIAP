import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { AccesoInforme, FormatoInforme } from '@/lib/informes'

export interface InformeGeneral {
  institucion: string
  subtitulo: string | null
  pie: string | null
  aviso: string | null
  color_primario: string
  color_acento: string
  logo_url: string | null
  acceso: AccesoInforme
  formatos: FormatoInforme[]
  actualizado_en: string
}

export interface InformeHerramienta {
  clave: string
  titulo: string
  activo: boolean
  /** null = usa los formatos generales */
  formatos: FormatoInforme[] | null
  max_filas: number
  configurada: boolean
}

export interface PanelInformes {
  general: InformeGeneral
  herramientas: InformeHerramienta[]
}

export type CambioGeneral = Partial<Pick<InformeGeneral,
  'institucion' | 'subtitulo' | 'pie' | 'aviso' | 'color_primario' | 'color_acento' | 'acceso' | 'formatos'>>
export type CambioHerramienta = Partial<Pick<InformeHerramienta, 'activo' | 'formatos' | 'max_filas'>>

const BASE = '/informes/admin'
const CLAVE = ['informes', 'panel'] as const

export function usePanelInformes() {
  return useQuery<PanelInformes>({ queryKey: CLAVE, queryFn: () => api.get(BASE), staleTime: 15_000 })
}

function useRefrescar() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: CLAVE })
}

export function useActualizarGeneral() {
  const refrescar = useRefrescar()
  return useMutation<unknown, Error, CambioGeneral>({ mutationFn: (d) => api.put(`${BASE}/general`, d), onSuccess: refrescar })
}

export function useSubirLogo() {
  const refrescar = useRefrescar()
  return useMutation<unknown, Error, File>({
    mutationFn: (archivo) => {
      const fd = new FormData()
      fd.append('logo', archivo)
      return api.post(`${BASE}/logo`, fd)
    },
    onSuccess: refrescar,
  })
}

export function useQuitarLogo() {
  const refrescar = useRefrescar()
  return useMutation<unknown, Error, void>({ mutationFn: () => api.delete(`${BASE}/logo`), onSuccess: refrescar })
}

export function useActualizarHerramientaInforme() {
  const refrescar = useRefrescar()
  return useMutation<unknown, Error, { clave: string; cambio: CambioHerramienta }>({
    mutationFn: ({ clave, cambio }) => api.put(`${BASE}/herramientas/${encodeURIComponent(clave)}`, cambio),
    onSuccess: refrescar,
  })
}
