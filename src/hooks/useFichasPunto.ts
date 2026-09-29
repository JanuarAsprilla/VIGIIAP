import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosProgressEvent } from 'axios'
import api from '@/lib/api'
import { asApiError } from '@/lib/apiError'
import type {
  AtributoCapa, CapaFichaConfig, FichaPunto, MedioFicha, FeaturesFichaResponse,
} from '@/types'

const KEYS = {
  atributos: (conexionId: string | null | undefined, capaId: string | null | undefined) =>
    ['fichas-punto', 'atributos', conexionId, capaId],
  config:    (conexionId: string | null | undefined, capaId: string | null | undefined) =>
    ['fichas-punto', 'config', conexionId, capaId],
  features:  (configId: string | null | undefined) => ['fichas-punto', 'features', configId],
}

/** Atributos (columnas) de una capa vectorial -- para elegir cuál sirve de identificador estable. */
export function useAtributosCapa(conexionId: string | null | undefined, capaId: string | null | undefined) {
  return useQuery<AtributoCapa[]>({
    queryKey: KEYS.atributos(conexionId, capaId),
    queryFn:  () => api.get(`/admin/conexiones-geoserver/${conexionId}/capas/${encodeURIComponent(capaId!)}/atributos`),
    enabled:  !!conexionId && !!capaId,
    staleTime: 60_000,
  })
}

/** Config de fichas de una capa (identificador elegido) -- null si nunca se habilitó, no un error. */
export function useConfigFichasCapa(conexionId: string | null | undefined, capaId: string | null | undefined) {
  return useQuery<CapaFichaConfig | null>({
    queryKey: KEYS.config(conexionId, capaId),
    queryFn:  async () => {
      try {
        return await api.get('/admin/fichas-capa', { params: { conexionId, capaId } })
      } catch (err) {
        if (asApiError(err)?.status === 404) return null
        throw err
      }
    },
    enabled: !!conexionId && !!capaId,
  })
}

/** Crea o actualiza la config de una capa. 409 IDENTIFICADOR_BLOQUEADO si ya hay fichas y se intenta cambiar el identificador. */
export function useUpsertConfigFichasCapa() {
  const qc = useQueryClient()
  return useMutation<CapaFichaConfig, Error, { conexionId: string; capaId: string; campoIdentificador: string; campoEtiqueta?: string }>({
    mutationFn: (data) => api.put('/admin/fichas-capa', data),
    onSuccess:  (config) => {
      qc.setQueryData(KEYS.config(config.conexionGeoserverId, config.capaId), config)
      qc.invalidateQueries({ queryKey: KEYS.features(config.id) })
    },
  })
}

/** Todas las features de la capa con su estado de completitud -- alimenta el checklist de administración. */
export function useFeaturesFichas(configId: string | null | undefined) {
  return useQuery<FeaturesFichaResponse>({
    queryKey: KEYS.features(configId),
    queryFn:  () => api.get(`/admin/fichas-capa/${configId}/features`),
    enabled:  !!configId,
    staleTime: 60_000,
  })
}

export function useUpsertFicha(configId: string | null | undefined) {
  const qc = useQueryClient()
  return useMutation<FichaPunto, Error, { valor: string; titulo?: string; descripcion: string }>({
    mutationFn: ({ valor, ...data }) => api.put(`/admin/fichas-capa/${configId}/fichas/${encodeURIComponent(valor)}`, data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.features(configId) }),
  })
}

export function useDeleteFicha(configId: string | null | undefined) {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (valor) => api.delete(`/admin/fichas-capa/${configId}/fichas/${encodeURIComponent(valor)}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.features(configId) }),
  })
}

interface SubirMedioParams {
  valor: string
  archivo: File
  poster?: File
  leyenda?: string
  creditos?: string
  onUploadProgress?: (e: AxiosProgressEvent) => void
}

/** Sube una foto o video a una ficha (la crea si aún no existía). Sin timeout fijo: un video de hasta 100MB en conexión lenta puede tardar más que el límite general de FormData. */
export function useSubirMedioFicha(configId: string | null | undefined) {
  const qc = useQueryClient()
  return useMutation<MedioFicha, Error, SubirMedioParams>({
    mutationFn: ({ valor, archivo, poster, leyenda, creditos, onUploadProgress }) => {
      const fd = new FormData()
      fd.append('archivo', archivo)
      if (poster) fd.append('poster', poster)
      if (leyenda) fd.append('leyenda', leyenda)
      if (creditos) fd.append('creditos', creditos)
      return api.post(`/admin/fichas-capa/${configId}/fichas/${encodeURIComponent(valor)}/medios`, fd, {
        timeout: 0,
        onUploadProgress,
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.features(configId) }),
  })
}

export function useActualizarMedio(configId: string | null | undefined) {
  const qc = useQueryClient()
  return useMutation<MedioFicha, Error, { medioId: string; leyenda?: string; creditos?: string; orden?: number }>({
    mutationFn: ({ medioId, ...data }) => api.patch(`/admin/fichas-medios/${medioId}`, data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.features(configId) }),
  })
}

export function useReordenarMedios(configId: string | null | undefined) {
  const qc = useQueryClient()
  return useMutation<void, Error, { valor: string; ids: string[] }>({
    mutationFn: ({ valor, ids }) => api.put(`/admin/fichas-capa/${configId}/fichas/${encodeURIComponent(valor)}/medios/orden`, { ids }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.features(configId) }),
  })
}

export function useEliminarMedio(configId: string | null | undefined) {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (medioId) => api.delete(`/admin/fichas-medios/${medioId}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.features(configId) }),
  })
}
