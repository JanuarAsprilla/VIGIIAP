import { useQuery } from '@tanstack/react-query'
import type { ApiMeta } from '@/types'
import api from '@/lib/api'
import { formatDate } from '@/lib/dateUtils'
import { humanizarAccion, type Severidad, type Resultado, type CambiosEvento } from '@/lib/constants/auditoria'

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
  seguridad:      'bg-red/10 text-red-dark',
  descargas:      'bg-indigo-600/10 text-indigo-700',
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
  // Acciones que el backend ya registraba pero no tenían etiqueta (salían como
  // "UPDATE_GEOVISOR" en bruto).
  create_geovisor:                 { label: 'Crear geovisor',            badge: 'bg-primary-500/12 text-primary-500' },
  update_geovisor:                 { label: 'Actualizar geovisor',       badge: 'bg-gold-500/12 text-gold-500' },
  update_geovisor_thumbnail:       { label: 'Portada de geovisor',       badge: 'bg-gold-500/12 text-gold-500' },
  delete_geovisor:                 { label: 'Eliminar geovisor',         badge: 'bg-red/10 text-red-dark' },
  create_conexion_geoserver:       { label: 'Crear conexión GeoServer',  badge: 'bg-primary-700/10 text-primary-700' },
  update_conexion_geoserver:       { label: 'Editar conexión GeoServer', badge: 'bg-gold-500/12 text-gold-500' },
  delete_conexion_geoserver:       { label: 'Eliminar conexión GeoServer', badge: 'bg-red/10 text-red-dark' },
  create_categoria:                { label: 'Crear categoría',           badge: 'bg-primary-500/12 text-primary-500' },
  rename_categoria:                { label: 'Renombrar categoría',       badge: 'bg-gold-500/12 text-gold-500' },
  update_categoria_modulos:        { label: 'Módulos de categoría',      badge: 'bg-gold-500/12 text-gold-500' },
  update_categoria_thumbnail:      { label: 'Portada de categoría',      badge: 'bg-gold-500/12 text-gold-500' },
  delete_categoria:                { label: 'Eliminar categoría',        badge: 'bg-red/10 text-red-dark' },
  upsert_config_fichas:            { label: 'Configurar fichas de capa', badge: 'bg-gold-500/12 text-gold-500' },
  delete_config_fichas:            { label: 'Quitar fichas de capa',     badge: 'bg-red/10 text-red-dark' },
  upsert_ficha_punto:              { label: 'Guardar ficha de punto',    badge: 'bg-primary-500/12 text-primary-500' },
  delete_ficha_punto:              { label: 'Eliminar ficha de punto',   badge: 'bg-red/10 text-red-dark' },
  importar_fichas_punto:           { label: 'Importar fichas',           badge: 'bg-primary-500/12 text-primary-500' },
  subir_medio_ficha:               { label: 'Subir foto o video de ficha', badge: 'bg-primary-500/12 text-primary-500' },
  eliminar_medio_ficha:            { label: 'Eliminar foto o video de ficha', badge: 'bg-red/10 text-red-dark' },
  create_herramienta:              { label: 'Crear herramienta',         badge: 'bg-primary-500/12 text-primary-500' },
  update_herramienta:              { label: 'Actualizar herramienta',    badge: 'bg-gold-500/12 text-gold-500' },
  reorder_herramientas:            { label: 'Reordenar herramientas',    badge: 'bg-gold-500/12 text-gold-500' },
  delete_herramienta:              { label: 'Eliminar herramienta',      badge: 'bg-red/10 text-red-dark' },
  create_admin:                    { label: 'Crear administrador',       badge: 'bg-red/10 text-red-dark' },
  update_permisos_modulo:          { label: 'Cambio de permisos',        badge: 'bg-red/10 text-red-dark' },
  update_avatar:                   { label: 'Cambiar foto de perfil',    badge: 'bg-bg-alt text-text-muted' },
  responder_solicitud:             { label: 'Responder solicitud',       badge: 'bg-gold-400/12 text-gold-400' },
  update_error_estado:             { label: 'Gestionar error',           badge: 'bg-gold-500/12 text-gold-500' },
  create_tipo_notificacion:        { label: 'Crear tipo de notificación', badge: 'bg-primary-500/12 text-primary-500' },
  update_tipo_notificacion:        { label: 'Editar tipo de notificación', badge: 'bg-gold-500/12 text-gold-500' },
  delete_tipo_notificacion:        { label: 'Eliminar tipo de notificación', badge: 'bg-red/10 text-red-dark' },
  export_usuarios:                 { label: 'Exportar usuarios',         badge: 'bg-gold-500/12 text-gold-500' },
  export_solicitudes:              { label: 'Exportar solicitudes',      badge: 'bg-gold-500/12 text-gold-500' },
  export_descargas:                { label: 'Exportar descargas',        badge: 'bg-gold-500/12 text-gold-500' },
  export_audit:                    { label: 'Exportar auditoría',        badge: 'bg-gold-500/12 text-gold-500' },
  acceso_denegado:                 { label: 'Acceso denegado',           badge: 'bg-gold-500/12 text-gold-500' },
  descarga_restringida:            { label: 'Descarga restringida',      badge: 'bg-indigo-600/10 text-indigo-700' },
}

export interface AuditLogRaw {
  id: string
  accion: string
  modulo: string
  descripcion?: string | null
  usuario_email?: string | null
  ip?: string | null
  creado_en: string
  entidad_id?: string | null
  severidad?: Severidad
  dispositivo?: string | null
  navegador?: string | null
  sistema?: string | null
  userAgent?: string | null
  resultado?: Resultado
  request_id?: string | null
  entidad_tipo?: string | null
  cambios?: CambiosEvento | null
}

function normalizeLog(l: AuditLogRaw) {
  const accionInfo = ACCION_LABEL[l.accion] ?? { label: humanizarAccion(l.accion), badge: 'bg-bg-alt text-text-muted' }
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
    severidad:   l.severidad ?? ('info' as Severidad),
    entidadId:   l.entidad_id ?? null,
    dispositivo: l.dispositivo ?? null,
    navegador:   l.navegador ?? null,
    sistema:     l.sistema ?? null,
    userAgent:   l.userAgent ?? null,
    resultado:   l.resultado ?? ('exito' as Resultado),
    requestId:   l.request_id ?? null,
    entidadTipo: l.entidad_tipo ?? null,
    cambios:     l.cambios ?? null,
  }
}

export type AuditLogData = ReturnType<typeof normalizeLog>

/** Contadores de las últimas 24 h que muestra la cabecera de Actividad. */
export interface AuditResumen {
  eventosHoy: number
  eventos24h: number
  loginsFallidos24h: number
  bloqueos24h: number
  criticos24h: number
  ipsDistintas24h: number
  usuariosActivos24h: number
  accesosDenegados24h: number
}

export function useAuditResumen(enabled: boolean = true) {
  return useQuery<AuditResumen>({
    queryKey: ['admin', 'audit', 'resumen'],
    queryFn:  () => api.get('/admin/audit/resumen'),
    staleTime: 60_000,
    enabled,
  })
}

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
