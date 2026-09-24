// Configuración de la gráfica de series de tiempo del reporte de actividad —
// paleta institucional propia (no se reutiliza la de herramientas/panel-choco:
// esa es del panel público de departamentos del Chocó, un dominio visual
// distinto al panel admin).
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Legend, Tooltip, Filler)

const FONT_BODY = "'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif"
const COLOR_TEXTO_CHART = '#5A6675' // --color-text-muted
const COLOR_GRID_CHART = '#E2E8F0' // --color-border

export const KPI_SERIE_COLOR = {
  usuarios:    '#009846', // --color-primary-500
  solicitudes: '#F7AC42', // --color-gold-400
  documentos:  '#185FA5', // azul, mismo criterio de contraste que panel-choco
  mapas:       '#E51A4B', // magenta
} as const

export const KPI_SERIE_LABEL = {
  usuarios: 'Usuarios nuevos',
  solicitudes: 'Solicitudes nuevas',
  documentos: 'Documentos publicados',
  mapas: 'Mapas publicados',
} as const

export const LINE_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  font: { family: FONT_BODY },
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { font: { family: FONT_BODY, size: 11 }, color: COLOR_TEXTO_CHART, usePointStyle: true, boxHeight: 6 },
    },
    tooltip: {
      titleFont: { family: FONT_BODY },
      bodyFont: { family: FONT_BODY },
      backgroundColor: '#1A1A2E',
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { family: FONT_BODY, size: 10 }, color: COLOR_TEXTO_CHART, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
    },
    y: {
      beginAtZero: true,
      grid: { color: COLOR_GRID_CHART },
      ticks: { font: { family: FONT_BODY, size: 11 }, color: COLOR_TEXTO_CHART, precision: 0 },
    },
  },
}
