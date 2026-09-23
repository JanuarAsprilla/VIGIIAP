interface KpisResumenProps {
  total: number
  validas: number
  sospechosas: number
  invalidas: number
  totalSinFiltrar: number
  hayFiltroActivo: boolean
}

const KPIS: { key: keyof Omit<KpisResumenProps, 'totalSinFiltrar' | 'hayFiltroActivo'>; label: string; border: string; text: string }[] = [
  { key: 'total', label: 'Total registros', border: 'border-primary-700', text: 'text-primary-700' },
  { key: 'validas', label: 'Válidas', border: 'border-green-500', text: 'text-green-600' },
  { key: 'sospechosas', label: 'Sospechosas', border: 'border-gold-500', text: 'text-gold-500' },
  { key: 'invalidas', label: 'Inválidas', border: 'border-red-500', text: 'text-red-500' },
]

/** 4 tarjetas KPI -- mismos indicadores que la herramienta original. */
export default function KpisResumen({ total, validas, sospechosas, invalidas, totalSinFiltrar, hayFiltroActivo }: KpisResumenProps) {
  const valores = { total, validas, sospechosas, invalidas }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {KPIS.map(({ key, label, border, text }) => (
        <div key={key} className={`bg-[var(--card-bg)] border-l-4 ${border} rounded-xl px-4 py-3`}>
          <p className="text-xs text-text-muted">
            {key === 'total' && hayFiltroActivo
              ? `Registros (filtro activo, de ${totalSinFiltrar.toLocaleString('es-CO')})`
              : label}
          </p>
          <p className={`text-xl font-bold ${text}`}>{valores[key].toLocaleString('es-CO')}</p>
        </div>
      ))}
    </div>
  )
}
