import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, RotateCcw, Loader2, AlertCircle, Map, FileText, Tag } from 'lucide-react'

import { fadeUpSm, EASE_OUT_EXPO } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'
import PaginationBar from '@/components/ui/PaginationBar'
import { useToast, ToastContainer } from '@/components/Toast'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatDate } from '@/lib/dateUtils'
import api from '@/lib/api'

const fadeUp = fadeUpSm
const PAGE_SIZE = 10

type Tipo = 'mapa' | 'documento' | 'categoria'

const TIPOS: { value: Tipo; label: string; icon: typeof Map }[] = [
  { value: 'mapa',      label: 'Mapas',      icon: Map },
  { value: 'documento', label: 'Documentos', icon: FileText },
  { value: 'categoria', label: 'Categorías', icon: Tag },
]

interface PapeleraItem {
  id?: string
  nombre?: string
  titulo?: string
  slug?: string
  categoria?: string
  tipo?: string
  thumbnail_url?: string
  deleted_at: string
}

function itemKey(tipo: Tipo, item: PapeleraItem): string {
  return tipo === 'categoria' ? (item.nombre ?? '') : (item.id ?? '')
}

function itemLabel(item: PapeleraItem): string {
  return item.titulo ?? item.nombre ?? '—'
}

export default function Papelera() {
  const [tipo, setTipo] = useState<Tipo>('mapa')
  const [page, setPage] = useState(1)
  const { toasts, toast, dismiss } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'papelera', tipo, page],
    queryFn: () => api.get('/admin/papelera', { params: { tipo, limit: PAGE_SIZE, page } }),
    select: (res) => res as unknown as { data: PapeleraItem[]; meta: { total: number; totalPages: number } },
    staleTime: 10_000,
  })

  const items = data?.data ?? []
  const total = data?.meta?.total ?? 0
  const totalPages = data?.meta?.totalPages ?? 1

  const restoreMutation = useMutation<unknown, Error, PapeleraItem>({
    mutationFn: (item) => api.patch(`/admin/papelera/${tipo}/${encodeURIComponent(itemKey(tipo, item))}/restaurar`),
    onSuccess: (_res, item) => {
      toast(`"${itemLabel(item)}" restaurado correctamente`, 'success')
      queryClient.invalidateQueries({ queryKey: ['admin', 'papelera', tipo] })
    },
    onError: (err) => {
      toast(getApiErrorMessage(err, 'No se pudo restaurar el elemento'), 'error')
    },
  })

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} dismiss={dismiss} />

      {/* Header */}
      <motion.div {...fadeUp(0)}>
        <span className="text-[0.7rem] font-bold uppercase tracking-widest text-amber-600">Super Administrador</span>
        <h1 className="font-display text-2xl font-bold text-text mt-0.5">Papelera</h1>
        <p className="text-sm text-text-muted mt-1">
          Elementos eliminados de mapas, documentos y categorías. Solo Super Administrador puede restaurarlos.
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div {...fadeUp(0.06)} className="flex gap-2">
        {TIPOS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => { setTipo(value); setPage(1) }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tipo === value
                ? 'bg-primary-800 text-white'
                : 'bg-[var(--card-bg)] border border-border text-text-muted hover:text-text'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </motion.div>

      {/* Table — sin tilt 3D: es una superficie de datos que se opera, no se admira */}
      <Card3D
        disabled
        initial={{ opacity: 0, y: 20, rotateX: 4, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  rotateX: 0, scale: 1    }}
        transition={{ delay: 0.12, duration: 0.5, ease: EASE_OUT_EXPO }}
        glow="rgba(26,86,50,0.12)"
        intensity={3}
        className="bg-[var(--card-bg)] border border-border/70 rounded-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-alt/50">
                <th className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted px-5 py-3">Nombre</th>
                <th className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted px-5 py-3">Eliminado el</th>
                <th className="text-right text-[0.65rem] font-bold uppercase tracking-wider text-text-muted px-5 py-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-700 mx-auto" />
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center">
                    <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-red-500 mb-3">No se pudo cargar la papelera.</p>
                    <button onClick={() => refetch()} className="text-xs font-semibold text-primary-700 hover:text-primary-900 transition-colors">
                      Reintentar
                    </button>
                  </td>
                </tr>
              )}
              {!isLoading && !isError && items.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center">
                    <Trash2 className="w-8 h-8 text-text-muted/40 mx-auto mb-2" />
                    <p className="text-sm text-text-muted">La papelera de {TIPOS.find((t) => t.value === tipo)?.label.toLowerCase()} está vacía</p>
                  </td>
                </tr>
              )}
              {items.map((item) => {
                const key = itemKey(tipo, item)
                const isPending = restoreMutation.isPending && restoreMutation.variables && itemKey(tipo, restoreMutation.variables) === key
                return (
                  <tr key={key} className="border-b border-border last:border-b-0 hover:bg-bg-alt/30 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-text font-medium">{itemLabel(item)}</td>
                    <td className="px-5 py-3.5 text-sm text-text-muted">{formatDate(item.deleted_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => restoreMutation.mutate(item)}
                        disabled={restoreMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-500/12 text-primary-500 hover:bg-primary-500/20 disabled:opacity-50 transition-colors"
                      >
                        {isPending
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <RotateCcw className="w-3.5 h-3.5" />}
                        Restaurar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <PaginationBar page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPage={setPage} />
      </Card3D>
    </div>
  )
}
