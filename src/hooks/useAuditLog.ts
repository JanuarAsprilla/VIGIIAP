import { useQuery } from '@tanstack/react-query'
import type { ApiMeta } from '@/types'
import api from '@/lib/api'
import { formatDate } from '@/lib/dateUtils'

export const MODULO_STYLES: Record<string, string> = {
  auth:        'bg-primary-500/12 text-primary-500',
  usuarios:    'bg-magenta/12 text-magenta',
  admin:       'bg-primary-700/10 text-primary-700',
  solicitudes: 'bg-gold-400/12 text-gold-400',
  mapas:       'bg-primary-700/10 text-primary-700',
  documentos:  'bg-gold-500/12 text-gold-500',
}

export const ACCION_LABEL: Record<string, { label: string; badge: string }> = {
  login:                   { label: 'Login',               badge: 'bg-primary-500/12 text-primary-500' },
  registro:                { label: 'Registro',             badge: 'bg-primary-500/12 text-primary-500' },
  login_visitante:         { label: 'Visitante',            badge: 'bg-bg-alt text-text-muted'     },
  create_usuario:          { label: 'Crear usuario',        badge: 'bg-primary-500/12 text-primary-500' },
  update_usuario:          { label: 'Actualizar usuario',   badge: 'bg-gold-500/12 text-gold-500'  },
  update_rol:              { label: 'Cambio de rol',        badge: 'bg-gold-500/12 text-gold-500'  },
  delete_usuario:          { label: 'Eliminar usuario',     badge: 'bg-red/10 text-red-dark'       },
  change_password:         { label: 'Cambio contraseña',    badge: 'bg-gold-500/12 text-gold-500'  },
  create_solicitud:        { label: 'Nueva solicitud',      badge: 'bg-gold-400/12 text-gold-400'  },
  update_solicitud_estado: { label: 'Estado solicitud',     badge: 'bg-gold-400/12 text-gold-400'  },
  update_perfil:           { label: 'Actualizar perfil',    badge: 'bg-gold-500/12 text-gold-500'  },
  update_configuracion:    { label: 'Configuración',        badge: 'bg-primary-700/10 text-primary-700' },
  create_mapa:             { label: 'Crear mapa',           badge: 'bg-primary-500/12 text-primary-500' },
  update_mapa:             { label: 'Actualizar mapa',      badge: 'bg-gold-500/12 text-gold-500'  },
  delete_mapa:             { label: 'Eliminar mapa',        badge: 'bg-red/10 text-red-dark'       },
  create_documento:        { label: 'Subir documento',      badge: 'bg-orange-500/12 text-orange-500' },
  update_documento:        { label: 'Editar documento',     badge: 'bg-gold-500/12 text-gold-500'  },
  delete_documento:        { label: 'Eliminar documento',   badge: 'bg-red/10 text-red-dark'       },
}

export interface AuditLogRaw {
  id: string
  accion: string
  modulo: string
  descripcion?: string | null
  usuario_email?: string | null
  ip?: string | null
  creado_en: string
}

function normalizeLog(l: AuditLogRaw) {
  const accionInfo = ACCION_LABEL[l.accion] ?? { label: l.accion, badge: 'bg-bg-alt text-text-muted' }
  return {
    id:          l.id,
    accion:      l.accion,
    accionLabel: accionInfo.label,
    badge:       accionInfo.badge,
    modulo:      l.modulo,
    descripcion: l.descripcion ?? '',
    email:       l.usuario_email ?? '—',
    ip:          l.ip ?? '—',
    fecha:       formatDate(l.creado_en),
    creado_en:   l.creado_en,
  }
}

export type AuditLogData = ReturnType<typeof normalizeLog>

export function useAuditLog(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['admin', 'audit', params],
    queryFn:  () => api.get('/admin/audit', { params }),
    select:   (res: AuditLogRaw[] | { data?: AuditLogRaw[]; meta?: ApiMeta }) => ({
      data: (Array.isArray(res) ? res : (res.data ?? [])).map(normalizeLog),
      meta: Array.isArray(res) ? undefined : res.meta,
    }),
    staleTime: 30_000,
  })
}
