import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDate } from '@/lib/dateUtils'
import { ROLES } from '@/contexts/AuthContext'

const ROLE_MAP = {
  admin_sig:    ROLES.ADMIN,
  investigador: ROLES.INVESTIGADOR,
  publico:      ROLES.PUBLICO,
}
const ROLE_MAP_REVERSE = {
  [ROLES.ADMIN]:        'admin_sig',
  [ROLES.INVESTIGADOR]: 'investigador',
  [ROLES.PUBLICO]:      'publico',
}

function normalizeUser(u) {
  const rolLabel = ROLE_MAP[u.rol] ?? ROLES.PUBLICO
  return {
    id:           u.id,
    nombre:       u.nombre,
    correo:       u.email,
    rol:          rolLabel,
    rolBackend:   u.rol,
    estado:       u.activo ? 'Activo' : 'Inactivo',
    activo:       u.activo,
    initials:     u.nombre
      ?.split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? '?',
    institucion:  u.institucion ?? '',
    ultimoAcceso: formatDate(u.actualizado_en ?? u.creado_en),
    creado_en:    u.creado_en,
  }
}

// ─── Keys ─────────────────────────────────────────────────────────────────────
export const USUARIOS_KEYS = {
  all:  ['usuarios'],
  list: (params) => ['usuarios', 'list', params],
}

// ─── Queries ──────────────────────────────────────────────────────────────────
export function useUsuariosList(params = {}) {
  return useQuery({
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
  return useMutation({
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
  return useMutation({
    mutationFn: ({ id, rol, activo }) =>
      api.patch(`/admin/usuarios/${id}`, {
        rol:    ROLE_MAP_REVERSE[rol] ?? rol,
        activo: activo !== undefined ? activo : true,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: USUARIOS_KEYS.all }),
  })
}

export function useDeleteUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/admin/usuarios/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: USUARIOS_KEYS.all }),
  })
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }) =>
      api.patch('/usuarios/me/password', { currentPassword, newPassword }),
  })
}

export { ROLE_MAP_REVERSE }
