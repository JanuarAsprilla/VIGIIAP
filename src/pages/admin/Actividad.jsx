import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Download, Filter, ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { fadeUpSm } from '@/lib/animations'
import { formatDate } from '@/lib/dateUtils'

const fadeUp = fadeUpSm

const MODULO_STYLES = {
  auth:       'bg-blue-100 text-blue-700',
  usuarios:   'bg-purple-100 text-purple-700',
  admin:      'bg-primary-100 text-primary-800',
  solicitudes:'bg-yellow-100 text-yellow-700',
  mapas:      'bg-green-100 text-green-700',
  documentos: 'bg-orange-100 text-orange-700',
  noticias:   'bg-pink-100 text-pink-700',
}

const ACCION_LABEL = {
  login:                 { label: 'Login',               badge: 'bg-green-100 text-green-700'   },
  registro:              { label: 'Registro',             badge: 'bg-blue-100 text-blue-700'     },
  login_visitante:       { label: 'Visitante',            badge: 'bg-gray-100 text-gray-600'     },
  create_usuario:        { label: 'Crear usuario',        badge: 'bg-green-100 text-green-700'   },
  update_usuario:        { label: 'Actualizar usuario',   badge: 'bg-amber-100 text-amber-700'   },
  update_rol:            { label: 'Cambio de rol',        badge: 'bg-amber-100 text-amber-700'   },
  delete_usuario:        { label: 'Eliminar usuario',     badge: 'bg-red-100 text-red-600'       },
  change_password:       { label: 'Cambio contraseña',    badge: 'bg-amber-100 text-amber-700'   },
  create_solicitud:       { label: 'Nueva solicitud',      badge: 'bg-blue-100 text-blue-700'     },
  update_solicitud_estado:{ label: 'Estado solicitud',    badge: 'bg-yellow-100 text-yellow-700' },
  update_perfil:          { label: 'Actualizar perfil',   badge: 'bg-amber-100 text-amber-700'   },
  update_configuracion:   { label: 'Configuración',       badge: 'bg-primary-100 text-primary-800'},
  registro:               { label: 'Registro',            badge: 'bg-blue-100 text-blue-700'     },
}

const PAGE_SIZE = 10

function normalizeLog(l) {
  const accionInfo = ACCION_LABEL[l.accion] ?? { label: l.accion, badge: 'bg-gray-100 text-gray-600' }
  return {
    id:         l.id,
    accion:     l.accion,
    accionLabel: accionInfo.label,
    badge:      accionInfo.badge,
    modulo:     l.modulo,
    descripcion: l.descripcion ?? '',
    email:      l.usuario_email ?? '—',
    ip:         l.ip ?? '—',
    fecha:      formatDate(l.creado_en),
    creado_en:  l.creado_en,
  }
}

function useAuditLog(params = {}) {
  return useQuery({
    queryKey: ['admin', 'audit', params],
    queryFn:  () => api.get('/admin/audit', { params }),
    select:   (res) => ({
      data: res.data.map(normalizeLog),
      meta: res.meta,
    }),
    staleTime: 30_000,
  })
}

const MODULOS_OPCIONES = ['auth', 'usuarios', 'admin', 'solicitudes', 'mapas', 'documentos', 'noticias']

export default function Actividad() {
  const [search, setSearch] = useState('')
  const [filtroModulo, setFiltroModulo] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useAuditLog({
    modulo: filtroModulo || undefined,
    limit:  PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })

  const logs       = data?.data ?? []
  const total      = data?.meta?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Filtro de búsqueda local (sobre la página actual)
  const filtered = search
    ? logs.filter((l) => {
        const q = search.toLowerCase()
        return l.descripcion.toLowerCase().includes(q) ||
               l.email.toLowerCase().includes(q) ||
               l.accionLabel.toLowerCase().includes(q)
      })
    : logs

  const exportCSV = () => {
    const rows = [['Acción', 'Módulo', 'Descripción', 'Usuario', 'IP', 'Fecha']]
    logs.forEach((l) => rows.push([l.accion, l.modulo, l.descripcion, l.email, l.ip, l.fecha]))
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `actividad-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[0.7rem] font-bold uppercase tracking-widest text-primary-700">Administración</span>
          <h1 className="font-display text-2xl font-bold text-text mt-0.5">Registro de Actividad</h1>
          <p className="text-sm text-text-muted mt-1">
            {isLoading ? '...' : `${total} eventos registrados en el sistema`}
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={isLoading || logs.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors shrink-0"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div {...fadeUp(0.08)} className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por usuario, acción o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
          />
        </div>
        <select
          value={filtroModulo}
          onChange={(e) => { setFiltroModulo(e.target.value); setPage(1) }}
          className="px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 transition"
        >
          <option value="">Todos los módulos</option>
          {MODULOS_OPCIONES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </motion.div>

      {/* Table */}
      <motion.div {...fadeUp(0.14)} className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-alt/50">
                {['Acción', 'Módulo', 'Descripción', 'Usuario', 'IP', 'Fecha'].map((h) => (
                  <th key={h} className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-700 mx-auto" />
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-text-muted">Sin eventos registrados</td></tr>
              )}
              {filtered.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-b-0 hover:bg-bg-alt/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className={`text-[0.6rem] font-bold uppercase px-2 py-0.5 rounded-full ${log.badge}`}>
                      {log.accionLabel}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MODULO_STYLES[log.modulo] ?? 'bg-bg-alt text-text-muted'}`}>
                      {log.modulo}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 max-w-xs">
                    <p className="text-sm text-text truncate">{log.descripcion || '—'}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-text-muted">{log.email}</td>
                  <td className="px-5 py-3.5 text-sm text-text-muted font-mono text-xs">{log.ip}</td>
                  <td className="px-5 py-3.5 text-sm text-text-muted whitespace-nowrap">{log.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-5 py-3 border-t border-border bg-bg-alt/30 flex items-center justify-between">
          <span className="text-xs text-text-muted">
            Página {page} de {totalPages} · {total} eventos total
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded-lg text-text-muted hover:text-primary-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-text px-2">{page}/{totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded-lg text-text-muted hover:text-primary-800 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
