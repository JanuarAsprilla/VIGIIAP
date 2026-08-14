import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationBarProps {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPage: (p: number) => void
}

export default function PaginationBar({ page, totalPages, total, pageSize, onPage }: PaginationBarProps) {
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-bg-alt/30">
      <span className="text-xs text-text-muted">
        {from}–{to} de {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
          className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-bg-alt disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          const p = totalPages <= 7
            ? i + 1
            : page <= 4
              ? i + 1
              : page >= totalPages - 3
                ? totalPages - 6 + i
                : page - 3 + i
          return (
            <button
              key={p}
              onClick={() => onPage(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                p === page
                  ? 'bg-primary-800 text-white'
                  : 'text-text-muted hover:text-text hover:bg-bg-alt'
              }`}
            >
              {p}
            </button>
          )
        })}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          aria-label="Página siguiente"
          className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-bg-alt disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
