import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Categoria } from '@/types'
import api from '@/lib/api'

const KEYS = {
  all:  ['categorias'],
  list: (params: Record<string, unknown> = {}) => ['categorias', 'list', params],
}

/**
 * @param params  `{ admin: 'true' }` desde un admin_sig/super_admin autenticado
 *   trae el conteo por módulo completo (activo o no, cualquier visibilidad) --
 *   ver categorias.service.js. Sin esto, el conteo solo cuenta lo público/activo.
 */
export function useCategoriasList(params: Record<string, unknown> = {}) {
  return useQuery<Categoria[]>({
    queryKey: KEYS.list(params),
    queryFn:  () => api.get('/categorias', { params }),
    select:   (res: Categoria[] | { data?: Categoria[] }) =>
      Array.isArray(res) ? res : (res.data ?? []),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateCategoria() {
  const qc = useQueryClient()
  return useMutation<{ nombre: string; [key: string]: unknown }, Error, string>({
    mutationFn: (nombre) => api.post('/categorias', { nombre }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useUploadCategoriaThumbnail() {
  const qc = useQueryClient()
  return useMutation<void, Error, { nombre: string; file: File; onUploadProgress?: (e: import('axios').AxiosProgressEvent) => void }>({
    mutationFn: ({ nombre, file, onUploadProgress }) => {
      const fd = new FormData()
      fd.append('thumbnail', file)
      return api.post(
        `/categorias/${encodeURIComponent(nombre)}/thumbnail`,
        fd,
        { onUploadProgress },
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
      qc.invalidateQueries({ queryKey: ['documentos'] })
    },
  })
}

export function useRenameCategoria() {
  const qc = useQueryClient()
  return useMutation<{ nombre: string; [key: string]: unknown }, Error, { nombre: string; nuevoNombre: string }>({
    mutationFn: ({ nombre, nuevoNombre }) => api.patch(`/categorias/${encodeURIComponent(nombre)}`, { nuevoNombre }),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
      qc.invalidateQueries({ queryKey: ['documentos'] })
      qc.invalidateQueries({ queryKey: ['mapas'] })
      qc.invalidateQueries({ queryKey: ['geovisores'] })
    },
  })
}

export function useDeleteCategoria() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (nombre) => api.delete(`/categorias/${encodeURIComponent(nombre)}`),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
      qc.invalidateQueries({ queryKey: ['documentos'] })
    },
  })
}
