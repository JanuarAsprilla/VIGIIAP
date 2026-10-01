import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosProgressEvent } from 'axios'
import api from '@/lib/api'
import { asApiError, getApiErrorMessage } from '@/lib/apiError'
import { enTandas, TAMANO_TANDA, type FilaFicha } from '@/lib/fichas/importarFichas'
import type {
  AtributoCapa, CapaFichaConfig, FichaPunto, MedioFicha, FeaturesFichaResponse, ResultadoImportacionFichas,
} from '@/types'

const KEYS = {
  atributos: (conexionId: string | null | undefined, capaId: string | null | undefined) =>
    ['fichas-punto', 'atributos', conexionId, capaId],
  config:    (conexionId: string | null | undefined, capaId: string | null | undefined) =>
    ['fichas-punto', 'config', conexionId, capaId],
  features:  (configId: string | null | undefined) => ['fichas-punto', 'features', configId],
  ficha:     (configId: string | null | undefined, valor: string | null | undefined) =>
    ['fichas-punto', 'ficha', configId, valor],
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

/** Ficha completa (título, descripción, medios) de un valor puntual -- /features solo trae un resumen, así que el editor pide el detalle recién al abrir una fila. null si el punto todavía no tiene ficha (en blanco). */
export function useFicha(configId: string | null | undefined, valor: string | null | undefined) {
  return useQuery<FichaPunto | null>({
    queryKey: KEYS.ficha(configId, valor),
    queryFn:  async () => {
      try {
        return await api.get(`/admin/fichas-capa/${configId}/fichas/${encodeURIComponent(valor!)}`)
      } catch (err) {
        if (asApiError(err)?.status === 404) return null
        throw err
      }
    },
    enabled: !!configId && !!valor,
    // Mientras algún video de esta ficha siga en 'procesando' (transcodificación
    // async en el backend), refresca sola hasta que quede 'listo' -- sin esto,
    // el admin tendría que cerrar y reabrir la ficha para ver el resultado.
    refetchInterval: (query) => query.state.data?.medios.some((m) => m.estado === 'procesando') ? 6000 : false,
  })
}

/**
 * Importa títulos y descripciones en lote. Las filas viajan en tandas de
 * TAMANO_TANDA (límite del backend), una a la vez, y se suman los resultados.
 * Si una tanda falla después de que otras ya entraron, el error lo dice -- el
 * backend es idempotente, así que reintentar el mismo archivo es seguro.
 */
export function useImportarFichas(configId: string | null | undefined) {
  const qc = useQueryClient()
  return useMutation<
    ResultadoImportacionFichas,
    Error,
    { filas: FilaFicha[]; sobrescribir: boolean; onProgreso?: (hechas: number, total: number) => void }
  >({
    mutationFn: async ({ filas, sobrescribir, onProgreso }) => {
      const suma: ResultadoImportacionFichas = { creadas: 0, actualizadas: 0, omitidas: 0, duplicadasEnArchivo: 0 }
      let hechas = 0
      for (const tanda of enTandas(filas, TAMANO_TANDA)) {
        let r: ResultadoImportacionFichas
        try {
          r = await api.post(`/admin/fichas-capa/${configId}/fichas/importar`, { filas: tanda, sobrescribir })
        } catch (err) {
          if (hechas === 0) throw err
          throw new Error(`Se importaron ${hechas} de ${filas.length} filas antes de un error: ${getApiErrorMessage(err, 'falló la importación')}`)
        }
        suma.creadas += r.creadas
        suma.actualizadas += r.actualizadas
        suma.omitidas += r.omitidas
        suma.duplicadasEnArchivo += r.duplicadasEnArchivo
        hechas += tanda.length
        onProgreso?.(hechas, filas.length)
      }
      return suma
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['fichas-punto', 'features', configId] })
      qc.invalidateQueries({ queryKey: ['fichas-punto', 'ficha', configId] })
    },
  })
}

export function useUpsertFicha(configId: string | null | undefined) {
  const qc = useQueryClient()
  return useMutation<FichaPunto, Error, { valor: string; titulo?: string; descripcion: string }>({
    mutationFn: ({ valor, ...data }) => api.put(`/admin/fichas-capa/${configId}/fichas/${encodeURIComponent(valor)}`, data),
    onSuccess:  (ficha, { valor }) => {
      qc.setQueryData(KEYS.ficha(configId, valor), ficha)
      qc.invalidateQueries({ queryKey: KEYS.features(configId) })
    },
  })
}

export function useDeleteFicha(configId: string | null | undefined) {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (valor) => api.delete(`/admin/fichas-capa/${configId}/fichas/${encodeURIComponent(valor)}`),
    onSuccess:  (_data, valor) => {
      qc.setQueryData(KEYS.ficha(configId, valor), null)
      qc.invalidateQueries({ queryKey: KEYS.features(configId) })
    },
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
    onSuccess: (_medio, { valor }) => {
      qc.invalidateQueries({ queryKey: KEYS.ficha(configId, valor) })
      qc.invalidateQueries({ queryKey: KEYS.features(configId) })
    },
  })
}

// medioId no trae consigo el `valor` de su ficha -- se invalida cualquier
// ficha cacheada de esta capa (clave parcial) en vez de una sola, para no
// tener que ir a buscar a cuál pertenece antes de poder refrescar.
function invalidarFichasDeCapa(qc: ReturnType<typeof useQueryClient>, configId: string | null | undefined) {
  qc.invalidateQueries({ queryKey: ['fichas-punto', 'ficha', configId] })
  qc.invalidateQueries({ queryKey: KEYS.features(configId) })
}

export function useActualizarMedio(configId: string | null | undefined) {
  const qc = useQueryClient()
  return useMutation<MedioFicha, Error, { medioId: string; leyenda?: string; creditos?: string; orden?: number }>({
    mutationFn: ({ medioId, ...data }) => api.patch(`/admin/fichas-medios/${medioId}`, data),
    onSuccess:  () => invalidarFichasDeCapa(qc, configId),
  })
}

export function useReordenarMedios(configId: string | null | undefined) {
  const qc = useQueryClient()
  return useMutation<void, Error, { valor: string; ids: string[] }>({
    mutationFn: ({ valor, ids }) => api.put(`/admin/fichas-capa/${configId}/fichas/${encodeURIComponent(valor)}/medios/orden`, { ids }),
    onSuccess:  (_data, { valor }) => {
      qc.invalidateQueries({ queryKey: KEYS.ficha(configId, valor) })
      qc.invalidateQueries({ queryKey: KEYS.features(configId) })
    },
  })
}

export function useEliminarMedio(configId: string | null | undefined) {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (medioId) => api.delete(`/admin/fichas-medios/${medioId}`),
    onSuccess:  () => invalidarFichasDeCapa(qc, configId),
  })
}
