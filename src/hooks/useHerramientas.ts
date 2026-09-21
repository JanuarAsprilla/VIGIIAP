import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Herramienta } from '@/types'
import api from '@/lib/api'

const KEYS = {
  all:  ['herramientas'],
  list: (admin?: boolean) => ['herramientas', 'list', admin ?? false],
}

/** Catálogo público: solo herramientas activas. `admin: true` (solo tiene
 *  efecto real si el usuario autenticado es admin_sig/super_admin, el
 *  backend ignora el flag para cualquier otro rol) también trae las inactivas
 *  -- usado por GestionHerramientas. */
export function useHerramientasList(admin = false) {
  return useQuery<Herramienta[]>({
    queryKey: KEYS.list(admin),
    queryFn:  () => api.get('/herramientas', { params: admin ? { admin: 'true' } : undefined }),
    select:   (res: Herramienta[] | { data?: Herramienta[] }) =>
      Array.isArray(res) ? res : (res.data ?? []),
    staleTime: 60 * 1000,
  })
}

export interface CrearHerramientaInput {
  clave: string
  titulo: string
  descripcion?: string | null
  tag: string
  visibilidad?: Herramienta['visibilidad']
  orden?: number
}

export function useCrearHerramienta() {
  const qc = useQueryClient()
  return useMutation<Herramienta, Error, CrearHerramientaInput>({
    mutationFn: (datos) => api.post('/herramientas', datos),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export interface ActualizarHerramientaInput {
  clave: string
  cambios: Partial<Pick<Herramienta, 'titulo' | 'descripcion' | 'tag' | 'activa' | 'visibilidad' | 'orden'>>
}

export function useActualizarHerramienta() {
  const qc = useQueryClient()
  return useMutation<Herramienta, Error, ActualizarHerramientaInput>({
    mutationFn: ({ clave, cambios }) => api.patch(`/herramientas/${encodeURIComponent(clave)}`, cambios),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

/** Reordena varias de una vez (drag & drop en el admin) -- una sola petición
 *  transaccional en vez de un PATCH por fila. */
export function useReordenarHerramientas() {
  const qc = useQueryClient()
  return useMutation<Herramienta[], Error, { clave: string; orden: number }[]>({
    mutationFn: (pares) => api.patch('/herramientas/reordenar', pares),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useEliminarHerramienta() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (clave) => api.delete(`/herramientas/${encodeURIComponent(clave)}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}
