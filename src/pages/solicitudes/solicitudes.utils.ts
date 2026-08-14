import type { SolicitudData } from '@/hooks/useSolicitudes'

export const PAGE_SIZE = 4

function csvField(val: unknown) {
  const s = String(val ?? '').replace(/\r\n|\n|\r/g, ' ')
  return `"${s.replace(/"/g, '""')}"`
}

export function exportCSV(rows: SolicitudData[]) {
  const header = ['ID', 'Tipo', 'Subtipo', 'Fecha', 'Estado'].map(csvField).join(',')
  const body = rows
    .map((r) => [r.id, r.tipo, r.subtipo, r.fecha, r.estado].map(csvField).join(','))
    .join('\n')
  const blob = new Blob([header + '\n' + body], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'solicitudes_vigia-iiap.csv'
  a.click()
  URL.revokeObjectURL(url)
}
