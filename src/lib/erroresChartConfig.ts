// Configuración de los gráficos del Registro de Errores -- mismos colores de
// severidad que ya usa severidad() en Errores.tsx (rojo=crítico 5xx,
// dorado=advertencia 4xx, verde=info), para que el gráfico y las filas de la
// tabla cuenten la misma historia visual sin inventar una paleta nueva.
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
} from 'chart.js'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Legend, Tooltip)

const FONT_BODY = "'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif"
const COLOR_TEXTO_CHART = '#5A6675' // --color-text-muted
const COLOR_GRID_CHART = '#E2E8F0' // --color-border

export const SEVERIDAD_COLOR = {
  critico:     '#C12A2B', // --color-red-dark
  advertencia: '#F08143', // --color-gold-500
  info:        '#1A5632', // --color-primary-700
} as const

export const DOUGHNUT_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
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
}

export const HORIZONTAL_BAR_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  font: { family: FONT_BODY },
  plugins: {
    legend: { display: false },
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
      beginAtZero: true,
      grid: { color: COLOR_GRID_CHART },
      ticks: { font: { family: FONT_BODY, size: 11 }, color: COLOR_TEXTO_CHART, precision: 0 },
    },
    y: {
      grid: { display: false },
      ticks: { font: { family: FONT_BODY, size: 11 }, color: COLOR_TEXTO_CHART },
    },
  },
}
