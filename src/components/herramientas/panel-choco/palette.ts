// Paleta categórica del panel — derivada de los tokens IIAP de src/index.css (@theme),
// no de la paleta genérica del dashboard original (que no tenía relación con la marca).
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

/** 7 colores institucionales distinguibles — uno por departamento del Chocó Biogeográfico. */
export const PALETA_DEPARTAMENTOS = [
  '#009846', // primary-500 — verde vivo IIAP
  '#F7AC42', // gold-400
  '#E51A4B', // magenta
  '#185FA5', // azul (no institucional pero necesario para contraste — ver nota abajo)
  '#B0CB1F', // accent lima
  '#E95B8C', // pink
  '#F08143', // gold-500 / orange
]

// El azul (#185FA5) no pertenece a la paleta oficial IIAP, pero con solo 6 colores de marca
// no hay suficiente contraste perceptual para 7 series simultáneas en una torta — se
// documenta aquí en vez de forzar dos verdes o dos naranjas casi idénticos.

export const COLOR_TEXTO_CHART = '#5A6675' // --color-text-muted
export const COLOR_GRID_CHART = '#E2E8F0' // --color-border

export function colorDepto(index: number): string {
  return PALETA_DEPARTAMENTOS[index % PALETA_DEPARTAMENTOS.length]
}

const FONT_BODY = "'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif"

// Sin anotación de tipo `ChartOptions<T>` a propósito: es un objeto base que se
// spreadea dentro de las opciones de gráficas de distinto tipo (bar/pie/doughnut) en
// cada componente — forzar una unión de tipos aquí rompe la inferencia estructural en
// el punto de uso. Cada componente de gráfico tipa su propio `options` final.
export const BASE_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  font: { family: FONT_BODY },
  plugins: {
    legend: {
      labels: { font: { family: FONT_BODY, size: 11 }, color: COLOR_TEXTO_CHART },
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

export const BAR_SCALES_OPTIONS = {
  x: {
    grid: { display: false },
    ticks: { font: { family: FONT_BODY, size: 11 }, color: COLOR_TEXTO_CHART },
  },
  y: {
    grid: { color: COLOR_GRID_CHART },
    ticks: { font: { family: FONT_BODY, size: 11 }, color: COLOR_TEXTO_CHART },
  },
}
