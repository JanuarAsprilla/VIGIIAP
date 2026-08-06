import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDate } from '@/lib/dateUtils'
import { ROLES } from '@/lib/constants/roles'
import type { ApiMeta } from '@/types'

const ROLE_MAP: Record<string, string> = {
  admin_sig:    ROLES.ADMIN,
  investigador: ROLES.INVESTIGADOR,
  tecnico:      ROLES.TECNICO,
  institucional:ROLES.INSTITUCIONAL,
  publico:      ROLES.PUBLICO,
}
const ROLE_MAP_REVERSE = {
  [ROLES.ADMIN]:         'admin_sig',
  [ROLES.INVESTIGADOR]:  'investigador',
  [ROLES.TECNICO]:       'tecnico',
  [ROLES.INSTITUCIONAL]: 'institucional',
  [ROLES.PUBLICO]:       'publico',
}

interface RawUsuario {
  id: string
  nombre: string
  email?: string | null
  rol: string
  activo: boolean
  email_verified?: boolean
  motivo_acceso?: string | null
  institucion?: string | null
  actualizado_en?: string | null
  creado_en: string
  [key: string]: unknown
}

function normalizeUser(u: RawUsuario) {
  const rolLabel = ROLE_MAP[u.rol] ?? ROLES.PUBLICO
  return {
    id:              u.id,
    nombre:          u.nombre,
    correo:          u.email ?? '',
    rol:             rolLabel,
    rolBackend:      u.rol,
    estado:          u.activo ? 'Activo' : 'Inactivo',
    activo:          u.activo,
    emailVerified:   u.email_verified ?? false,
    motivoAcceso:    u.motivo_acceso ?? '',
    initials:        (u.nombre ?? '')
      .split(' ')
      .map((w) => w[0] ?? '')
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?',
    institucion:     u.institucion ?? '',
    ultimoAcceso:    formatDate(u.actualizado_en ?? u.creado_en),
    creado_en:       u.creado_en,
  }
}

// ─── Tipos derivados ──────────────────────────────────────────────────────────
export type UsuarioData = ReturnType<typeof normalizeUser>
export type UsuarioListResult = { data: UsuarioData[]; meta: ApiMeta }

// ─── Keys ─────────────────────────────────────────────────────────────────────
export const USUARIOS_KEYS = {
  all:  ['usuarios'],
  list: (params: Record<string, unknown>) => ['usuarios', 'list', params],
}

// ─── Queries ──────────────────────────────────────────────────────────────────
export function useUsuariosList(params: Record<string, unknown> = {}) {
  return useQuery<UsuarioListResult>({
    queryKey: USUARIOS_KEYS.list(params),
    queryFn:  () => api.get('/admin/usuarios', { params }),
    select:   (res) => ({
      data: res.data.map(normalizeUser),
      meta: res.meta,
    }),
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────
export function useCreateUsuario() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, { nombre: string; email: string; rol: string; institucion?: string }>({
    mutationFn: ({ nombre, email, rol, institucion }) =>
      api.post('/admin/usuarios', {
        nombre,
        email,
        rol:         ROLE_MAP_REVERSE[rol] ?? rol,
        institucion: institucion ?? undefined,
        tipoAcceso:  'institucional',
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: USUARIOS_KEYS.all }),
  })
}

export function useUpdateUsuarioRol() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, { id: string; rol: string }>({
    mutationFn: ({ id, rol }) =>
      api.patch(`/admin/usuarios/${id}`, {
        rol: ROLE_MAP_REVERSE[rol] ?? rol,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: USUARIOS_KEYS.all }),
  })
}

/** Activa o desactiva un usuario sin tocar su rol */
export function useToggleActivo() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, { id: string; activo: boolean }>({
    mutationFn: ({ id, activo }) =>
      api.patch(`/admin/usuarios/${id}`, { activo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: USUARIOS_KEYS.all }),
  })
}

export function useDeleteUsuario() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, string>({
    mutationFn: (id) => api.delete(`/admin/usuarios/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: USUARIOS_KEYS.all }),
  })
}

export function useUpdatePerfil() {
  return useMutation<unknown, Error, Record<string, unknown>>({
    mutationFn: (data) => api.patch('/usuarios/me', data),
  })
}

export function useUpdatePassword() {
  return useMutation<unknown, Error, { currentPassword: string; newPassword: string }>({
    mutationFn: ({ currentPassword, newPassword }) =>
      api.patch('/usuarios/me/password', { currentPassword, newPassword }),
  })
}

export { ROLE_MAP_REVERSE }
