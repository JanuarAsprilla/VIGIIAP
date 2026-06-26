/* Hallmark · macrostructure: Long Document · genre: form-workflow
 * tokens: design.md · stamp: 2026-05-25
 */
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, PlusCircle } from 'lucide-react'
import { useSearch } from '@/contexts/SearchContext'
import { matches } from '@/lib/search'
import { useMisSolicitudes } from '@/hooks/useSolicitudes'
import { fadeUp } from '@/lib/animations'
import { PAGE_SIZE, exportCSV } from './solicitudes/solicitudes.utils'
import { SolicitudesTable } from './solicitudes/SolicitudesTable'
import { NuevaSolicitudForm } from './solicitudes/NuevaSolicitudForm'
import { MisSolicitudes } from './solicitudes/MisSolicitudes'
import { AyudaCTA } from './solicitudes/AyudaCTA'
import { BottomStats } from './solicitudes/BottomStats'
import { DetalleSolicitudModal } from './solicitudes/DetalleSolicitudModal'

export default function Solicitudes() {
  const { query } = useSearch()
  const [filtroEstado, setFiltroEstado] = useState('')
  const [page, setPage] = useState(1)
  const [detalleItem, setDetalleItem] = useState(null)
  const formRef = useRef<HTMLDivElement>(null)

  const { data } = useMisSolicitudes()
  const allRows = data?.data ?? []

  const handleFiltro = (val) => { setFiltroEstado(val); setPage(1) }

  const allFiltered = allRows.filter((s) => {
    const searchOk = matches([s.id, s.tipo, s.subtipo, s.estado], query)
    const filtroOk = !filtroEstado || s.estado === filtroEstado
    return searchOk && filtroOk
  })

  const totalPages = Math.ceil(allFiltered.length / PAGE_SIZE)
  const pageRows = allFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTimeout(() => {
      const first = formRef.current?.querySelector('input:not([readonly]), select, textarea')
      ;(first as HTMLElement)?.focus()
    }, 400)
  }

  return (
    <div className="space-y-8">
      <motion.div
        {...fadeUp(0)}
        className="flex flex-col md:flex-row md:items-start md:justify-between gap-4"
      >
        <div>
          <span className="inline-block text-[0.7rem] font-bold uppercase tracking-widest text-primary-700 mb-2">
            Módulo Administrativo
          </span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-text leading-tight mb-3">
            Gestión de Solicitudes{' '}
            <span className="block">y Trámites</span>
          </h1>
          <p className="text-sm text-text-muted leading-relaxed max-w-lg">
            Seguimiento en tiempo real de trámites de certificación territorial
            y consultas técnicas del Chocó Biogeográfico.
          </p>
        </div>

        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => exportCSV(allFiltered)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-border rounded-lg text-sm font-semibold text-text hover:border-primary-800 hover:text-primary-800 transition-colors"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Exportar Reporte
          </button>
          <button
            onClick={scrollToForm}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" aria-hidden="true" />
            Nueva Solicitud
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <SolicitudesTable
            rows={pageRows}
            onVerDetalle={setDetalleItem}
            filtro={filtroEstado}
            onFiltroChange={handleFiltro}
            totalAll={allFiltered.length}
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </div>

        <div className="space-y-6">
          <NuevaSolicitudForm formRef={formRef} />
          <MisSolicitudes onVerDetalle={setDetalleItem} />
          <AyudaCTA />
        </div>
      </div>

      <BottomStats rows={allRows} />

      <AnimatePresence>
        {detalleItem && (
          <DetalleSolicitudModal
            sol={detalleItem}
            onClose={() => setDetalleItem(null)}
            onNueva={scrollToForm}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
