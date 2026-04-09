// Fase 2: reemplazar con llamadas a /api/admin/*
export const ADMIN_MOCK_USERS = [
  { id: 'USR-001', nombre: 'Admin IIAP',           correo: 'admin@iiap.org.co',          rol: 'Administrador SIG', estado: 'Activo',   ultimoAcceso: '08 Abr 2026', initials: 'AI' },
  { id: 'USR-002', nombre: 'Carlos Rentería',       correo: 'carlos@iiap.org.co',         rol: 'Administrador SIG', estado: 'Activo',   ultimoAcceso: '07 Abr 2026', initials: 'CR' },
  { id: 'USR-003', nombre: 'Analista Territorial',  correo: 'investigador@iiap.org.co',   rol: 'Investigador',      estado: 'Activo',   ultimoAcceso: '08 Abr 2026', initials: 'AT' },
  { id: 'USR-004', nombre: 'María Valencia',        correo: 'maria@iiap.org.co',          rol: 'Investigador',      estado: 'Activo',   ultimoAcceso: '07 Abr 2026', initials: 'MV' },
  { id: 'USR-005', nombre: 'Jorge Mena',            correo: 'jorge@iiap.org.co',          rol: 'Investigador',      estado: 'Activo',   ultimoAcceso: '06 Abr 2026', initials: 'JM' },
  { id: 'USR-006', nombre: 'Liliana Palacios',      correo: 'liliana@iiap.org.co',        rol: 'Investigador',      estado: 'Activo',   ultimoAcceso: '05 Abr 2026', initials: 'LP' },
  { id: 'USR-007', nombre: 'Sandra Córdoba',        correo: 'sandra@iiap.org.co',         rol: 'Público',           estado: 'Activo',   ultimoAcceso: '04 Abr 2026', initials: 'SC' },
  { id: 'USR-008', nombre: 'Roberto Asprilla',      correo: 'roberto@iiap.org.co',        rol: 'Público',           estado: 'Activo',   ultimoAcceso: '02 Abr 2026', initials: 'RA' },
  { id: 'USR-009', nombre: 'Pedro Mosquera',        correo: 'pedro@iiap.org.co',          rol: 'Público',           estado: 'Inactivo', ultimoAcceso: '01 Mar 2026', initials: 'PM' },
]

export const ADMIN_ACTIVITY_LOG = [
  { id: 1,  usuario: 'Admin IIAP',          initials: 'AI', accion: 'Aprobó solicitud',      detalle: '#VIG-2024-085 — Consulta de Linderos',        modulo: 'Solicitudes', fecha: '08 Abr 2026', hora: '10:32', tipo: 'success' },
  { id: 2,  usuario: 'Admin IIAP',          initials: 'AI', accion: 'Publicó noticia',        detalle: 'Expansión del SINAP en el Chocó',              modulo: 'Noticias',    fecha: '08 Abr 2026', hora: '09:15', tipo: 'info'    },
  { id: 3,  usuario: 'María Valencia',      initials: 'MV', accion: 'Creó solicitud',         detalle: '#VIG-2024-090 — Validación Cartográfica',      modulo: 'Solicitudes', fecha: '07 Abr 2026', hora: '16:48', tipo: 'info'    },
  { id: 4,  usuario: 'Admin IIAP',          initials: 'AI', accion: 'Rechazó solicitud',      detalle: '#VIG-2024-082 — Estudio Técnico Ambiental',    modulo: 'Solicitudes', fecha: '07 Abr 2026', hora: '14:20', tipo: 'error'   },
  { id: 5,  usuario: 'Carlos Rentería',     initials: 'CR', accion: 'Actualizó rol',          detalle: 'Jorge Mena → Investigador',                    modulo: 'Usuarios',    fecha: '06 Abr 2026', hora: '11:05', tipo: 'warning' },
  { id: 6,  usuario: 'Analista Territorial',initials: 'AT', accion: 'Descargó documento',    detalle: 'Protocolo_Monitoreo_Flora_2025.pdf',           modulo: 'Documentos',  fecha: '05 Abr 2026', hora: '15:30', tipo: 'info'    },
  { id: 7,  usuario: 'Sandra Córdoba',      initials: 'SC', accion: 'Inició sesión',          detalle: '',                                             modulo: 'Auth',        fecha: '05 Abr 2026', hora: '08:30', tipo: 'info'    },
  { id: 8,  usuario: 'Admin IIAP',          initials: 'AI', accion: 'Cargó documento',        detalle: 'Mapa_Cobertura_Vegetal_2026.pdf',              modulo: 'Documentos',  fecha: '04 Abr 2026', hora: '15:22', tipo: 'info'    },
  { id: 9,  usuario: 'Carlos Rentería',     initials: 'CR', accion: 'Creó usuario',           detalle: 'Liliana Palacios — Investigador',               modulo: 'Usuarios',    fecha: '03 Abr 2026', hora: '09:00', tipo: 'success' },
  { id: 10, usuario: 'Admin IIAP',          initials: 'AI', accion: 'Desactivó usuario',      detalle: 'Pedro Mosquera',                               modulo: 'Usuarios',    fecha: '01 Mar 2026', hora: '10:00', tipo: 'warning' },
  { id: 11, usuario: 'Analista Territorial',initials: 'AT', accion: 'Ejecutó análisis',       detalle: 'Buffer 500m — Cuenca Atrato',                  modulo: 'Herramientas',fecha: '28 Mar 2026', hora: '14:10', tipo: 'info'    },
  { id: 12, usuario: 'Admin IIAP',          initials: 'AI', accion: 'Actualizó configuración',detalle: 'Tiempo de sesión → 8h',                        modulo: 'Sistema',     fecha: '25 Mar 2026', hora: '11:30', tipo: 'warning' },
]

export const ADMIN_DASHBOARD_KPIS = [
  { label: 'Usuarios Registrados',   value: 9,  trend: '+2 este mes',    trendUp: true  },
  { label: 'Solicitudes Pendientes', value: 3,  trend: '-1 vs ayer',     trendUp: false },
  { label: 'Documentos Activos',     value: 24, trend: '+3 esta semana', trendUp: true  },
  { label: 'Noticias Publicadas',    value: 5,  trend: '+1 hoy',         trendUp: true  },
]
