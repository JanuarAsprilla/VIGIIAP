import { useQuery } from '@tanstack/react-query'
import type { ApiMeta } from '@/types'
import api from '@/lib/api'
import { formatDate } from '@/lib/dateUtils'

// Un color por módulo, sin reutilizar el mismo tono dos veces en esta lista —
// admin y mapas compartían literalmente el mismo hex (bug real, no solo un
// matiz difícil de distinguir). No se introducen colores nuevos: "pink" ya
// existe en la paleta de marca (src/index.css) y no lo usa ninguna otra
// pantalla, así que admin lo toma sin chocar con nada. El resto de la marca
// (verde, gold/orange, magenta) ya está repartido entre auth/usuarios/
// solicitudes/documentos/mapas.
export const MODULO_STYLES: Record<string, string> = {
  auth:           'bg-primary-500/12 text-primary-500',
  usuarios:       'bg-magenta/12 text-magenta',
  admin:          'bg-pink/12 text-pink',
  solicitudes:    'bg-gold-400/12 text-gold-400',
  mapas:          'bg-primary-700/10 text-primary-700',
  documentos:     'bg-gold-500/12 text-gold-500',
  categorias:     'bg-teal-600/10 text-teal-700',
  geovisores:     'bg-blue-600/10 text-blue-700',
  notificaciones: 'bg-amber-600/10 text-amber-700',
  sistema:        'bg-bg-alt text-text-muted',
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
  rate_limit_auto_scale:   { label: 'Límite de tráfico ajustado', badge: 'bg-bg-alt text-text-muted' },
  // Eventos de seguridad de auth que antes no quedaban registrados en
  // absoluto (logout, 2FA, recuperación de contraseña, sesiones) -- ver
  // registrarAuditoria() en auth.controller.js / twoFactor.controller.js /
  // sessions.controller.js / auth.service.js.
  logout:                          { label: 'Logout',                    badge: 'bg-bg-alt text-text-muted' },
  email_verificado:                { label: 'Email verificado',          badge: 'bg-primary-500/12 text-primary-500' },
  password_recuperacion_solicitada: { label: 'Recuperación solicitada',  badge: 'bg-gold-500/12 text-gold-500' },
  password_reset:                  { label: 'Contraseña restablecida',   badge: 'bg-gold-500/12 text-gold-500' },
  '2fa_activado':                  { label: '2FA activado',              badge: 'bg-primary-500/12 text-primary-500' },
  '2fa_desactivado':                { label: '2FA desactivado',          badge: 'bg-red/10 text-red-dark' },
  sesion_revocada:                 { label: 'Sesión revocada',           badge: 'bg-gold-500/12 text-gold-500' },
  todas_sesiones_revocadas:        { label: 'Todas las sesiones revocadas', badge: 'bg-red/10 text-red-dark' },
  // Antes caían al badge gris default (indistinguibles de un login normal)
  // pese a ser justo los eventos que más importa poder detectar de un
  // vistazo: refresh_token_reuse es la señal de un posible robo de token
  // (ver auth.service.js), login_failed/login_blocked son intentos de
  // acceso fallidos/bloqueados por fuerza bruta.
  refresh_token_reuse:             { label: 'Reutilización de refresh token', badge: 'bg-red/10 text-red-dark' },
  login_failed:                    { label: 'Login fallido',             badge: 'bg-gold-500/12 text-gold-500' },
  login_blocked:                   { label: 'Login bloqueado',           badge: 'bg-red/10 text-red-dark' },
  oauth_registro:                  { label: 'Registro OAuth',            badge: 'bg-primary-500/12 text-primary-500' },
  oauth_login:                     { label: 'Login OAuth',               badge: 'bg-primary-500/12 text-primary-500' },
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

export function useAuditLog(params: Record<string, unknown> = {}, enabled: boolean = true) {
  return useQuery({
    queryKey: ['admin', 'audit', params],
    queryFn:  () => api.get('/admin/audit', { params }),
    select:   (res: AuditLogRaw[] | { data?: AuditLogRaw[]; meta?: ApiMeta }) => ({
      data: (Array.isArray(res) ? res : (res.data ?? [])).map(normalizeLog),
      meta: Array.isArray(res) ? undefined : res.meta,
    }),
    staleTime: 30_000,
    enabled,
  })
}
