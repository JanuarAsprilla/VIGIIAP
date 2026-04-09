import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Download, Filter, ChevronLeft, ChevronRight,
  Activity,
} from 'lucide-react'
import { ADMIN_ACTIVITY_LOG } from '@/lib/constants'

import { fadeUpSm } from '@/lib/animations'

const fadeUp = fadeUpSm

const TYPE_STYLES = {
  success: { badge: 'bg-green-100 text-green-700', label: 'Éxito' },
  error:   { badge: 'bg-red-100 text-red-600',     label: 'Error' },
  warning: { badge: 'bg-amber-100 text-amber-700', label: 'Alerta' },
  info:    { badge: 'bg-primary-100 text-primary-700', label: 'Info' },
}

const MODULOS = [...new Set(ADMIN_ACTIVITY_LOG.map((l) => l.modulo))]
const TIPOS   = ['success', 'error', 'warning', 'info']
const PAGE_SIZE = 8

const MES_MAP = { Ene: 0, Feb: 1, Mar: 2, Abr: 3, May: 4, Jun: 5, Jul: 6, Ago: 7, Sep: 8, Oct: 9, Nov: 10, Dic: 11 }
function parseFecha(str) {
  const [d, m, y] = str.split(' ')
  return new Date(Number(y), MES_MAP[m] ?? 0, Number(d))
}

// Extend mock log with more entries for demo
const EXTENDED_LOG = [
  ...ADMIN_ACTIVITY_LOG,
  ...ADMIN_ACTIVITY_LOG.map((l, i) => ({
    ...l,
    id: l.id + 100 + i,
    hora: `0${i % 9}:${String(i * 7 % 60).padStart(2, '0')}`,
    fecha: '07 Abr 2026',
  })),
]

export default function Actividad() {
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroModulo, setFiltroModulo] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [page, setPage] = useState(1)

  const filtered = EXTENDED_LOG.filter((l) => {
    const q = search.toLowerCase()
    const matchQ = !q || l.usuario.toLowerCase().includes(q) || l.accion.toLowerCase().includes(q) || (l.detalle || '').toLowerCase().includes(q)
    const matchT = !filtroTipo || l.tipo === filtroTipo
    const matchM = !filtroModulo || l.modulo === filtroModulo
    const fechaLog = parseFecha(l.fecha)
    const matchDesde = !desde || fechaLog >= new Date(desde + 'T00:00:00')
    const matchHasta = !hasta  || fechaLog <= new Date(hasta  + 'T23:59:59')
    return matchQ && matchT && matchM && matchDesde && matchHasta
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const exportCSV = () => {
    const rows = [['ID', 'Usuario', 'Acción', 'Detalle', 'Módulo', 'Fecha', 'Hora', 'Tipo']]
    filtered.forEach((l) => rows.push([l.id, l.usuario, l.accion, l.detalle || '', l.modulo, l.fecha, l.hora, l.tipo]))
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'actividad.csv'
    a.click()
  }

  // Summary counts
  const counts = TIPOS.reduce((acc, t) => {
    acc[t] = EXTENDED_LOG.filter((l) => l.tipo === t).length
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[0.7rem] font-bold uppercase tracking-widest text-primary-700">Administración</span>
          <h1 className="font-display text-2xl font-bold text-text mt-0.5">Registro de Actividad</h1>
          <p className="text-sm text-text-muted mt-1">{EXTENDED_LOG.length} eventos registrados en el sistema</p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors shrink-0"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </motion.div>

      {/* Summary cards */}
      <motion.div {...fadeUp(0.08)} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TIPOS.map((t) => (
          <button
            key={t}
            onClick={() => setFiltroTipo(filtroTipo === t ? '' : t)}
            className={`text-left p-4 bg-white border rounded-xl transition-all ${filtroTipo === t ? 'border-primary-800 ring-2 ring-primary-800/10' : 'border-border hover:border-primary-300'}`}
          >
            <div className={`inline-flex text-[0.6rem] font-bold uppercase px-2 py-0.5 rounded-full mb-2 ${TYPE_STYLES[t].badge}`}>
              {TYPE_STYLES[t].label}
            </div>
            <p className="text-2xl font-bold text-text font-display">{counts[t]}</p>
            <p className="text-xs text-text-muted">eventos</p>
          </button>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div {...fadeUp(0.14)} className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por usuario, acción o detalle..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
          />
        </div>
        <select
          value={filtroModulo}
          onChange={(e) => { setFiltroModulo(e.target.value); setPage(1) }}
          className="px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 transition"
        >
          <option value="">Todos los módulos</option>
          {MODULOS.map((m) => <option key={m}>{m}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted shrink-0" />
          <input
            type="date"
            value={desde}
            onChange={(e) => { setDesde(e.target.value); setPage(1) }}
            className="px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 transition"
            title="Desde"
          />
          <span className="text-text-muted text-sm">–</span>
          <input
            type="date"
            value={hasta}
            onChange={(e) => { setHasta(e.target.value); setPage(1) }}
            className="px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 transition"
            title="Hasta"
          />
          {(desde || hasta) && (
            <button
              onClick={() => { setDesde(''); setHasta(''); setPage(1) }}
              className="text-xs text-text-muted hover:text-primary-800 transition-colors whitespace-nowrap"
            >
              Limpiar
            </button>
          )}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div {...fadeUp(0.2)} className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-alt/50">
                {['Usuario', 'Acción', 'Módulo', 'Fecha / Hora', 'Tipo'].map((h) => (
                  <th key={h} className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-text-muted">Sin resultados</td></tr>
              )}
              {pageItems.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-b-0 hover:bg-bg-alt/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-gradient-to-br from-primary-600 to-primary-900 rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-white text-[0.6rem] font-bold">{log.initials}</span>
                      </div>
                      <span className="text-sm font-semibold text-text">{log.usuario}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-text font-medium">{log.accion}</p>
                    {log.detalle && <p className="text-xs text-text-muted">{log.detalle}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2 py-0.5 bg-bg-alt text-text-muted rounded-full font-medium">{log.modulo}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-text-muted">{log.fecha}</p>
                    <p className="text-xs text-text-muted">{log.hora}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[0.6rem] font-bold uppercase px-2 py-0.5 rounded-full ${TYPE_STYLES[log.tipo]?.badge}`}>
                      {TYPE_STYLES[log.tipo]?.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-5 py-3 border-t border-border bg-bg-alt/30 flex items-center justify-between">
          <span className="text-xs text-text-muted">Mostrando {pageItems.length} de {filtered.length} eventos</span>
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
