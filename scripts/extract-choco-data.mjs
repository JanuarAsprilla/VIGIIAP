// Extractor determinista de datasets embebidos en el dashboard original.
// Se ejecuta una sola vez para portar los datos sin riesgo de transcripción manual.
// Uso: node scripts/extract-choco-data.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const SRC = '/Volumes/JANUAR/EDDY CHAVERRA/dashboard_choco_biogeografico.html'
const OUT_DIR = new URL('../src/components/herramientas/panel-choco/data/', import.meta.url)
mkdirSync(OUT_DIR, { recursive: true })

const src = readFileSync(SRC, 'utf8')

// Offset del inicio de cada línea (0-indexed array, línea N → lineStarts[N-1]).
const lineStarts = [0]
for (let i = 0; i < src.length; i++) if (src[i] === '\n') lineStarts.push(i + 1)

/** Escanea desde `start` (carácter tras el `=` de un declarator) hasta el `;` o `,` de nivel
 * superior real (lo que venga primero — una `const a=X, b=Y;` separa declarators por coma),
 * respetando strings ('/"/`) y anidación de {}/[]/(). */
function scanStatement(text, start) {
  let i = start
  let depth = 0
  let quote = null
  while (i < text.length) {
    const c = text[i]
    if (quote) {
      if (c === '\\') { i += 2; continue }
      if (c === quote) quote = null
      i++
      continue
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; i++; continue }
    if (c === '{' || c === '[' || c === '(') depth++
    else if (c === '}' || c === ']' || c === ')') depth--
    else if ((c === ';' || c === ',') && depth === 0) return i
    i++
  }
  throw new Error('No se encontró el fin del statement desde offset ' + start)
}

/** Ubica `NAME =` cerca de `fromLine` (ancla de línea 1-indexed) y devuelve su valor evaluado. */
function extractConst(name, fromLine) {
  const searchFrom = lineStarts[fromLine - 1]
  const window = src.slice(searchFrom, searchFrom + 4000)
  const re = new RegExp('\\b' + name + '\\s*=(?!=)')
  const localMatch = re.exec(window)
  if (!localMatch) throw new Error(`No se encontró "${name}" cerca de la línea ${fromLine}`)
  const valueStart = searchFrom + localMatch.index + localMatch[0].length
  const endIdx = scanStatement(src, valueStart)
  const code = src.slice(valueStart, endIdx).trim()
  const value = new Function('"use strict"; return (' + code + ');')()
  return value
}

/** Variante para asignaciones `window.NAME = window.NAME || <valor>` (no son `const`). */
function extractWindowFallback(name, fromLine) {
  const searchFrom = lineStarts[fromLine - 1]
  const window_ = src.slice(searchFrom, searchFrom + 200)
  const prefix = `window.${name} = window.${name} || `
  const prefixIdx = window_.indexOf(prefix)
  if (prefixIdx === -1) throw new Error(`No se encontró el prefijo de fallback para "${name}" cerca de la línea ${fromLine}`)
  const valueStart = searchFrom + prefixIdx + prefix.length
  const endIdx = scanStatement(src, valueStart)
  const code = src.slice(valueStart, endIdx).trim()
  return new Function('"use strict"; return (' + code + ');')()
}

// Sin `as const`: son datasets de ~5-100KB — la inferencia de tipos literales profundos
// de `as const` sobre literales de este tamaño degrada innecesariamente el typecheck.
// El tipado real se aplica en el punto de consumo (ver types.ts + casts puntuales).
function writeTs(fileName, exportsMap) {
  const header = '// Generado por scripts/extract-choco-data.mjs — no editar a mano.\n' +
    '// Fuente: dashboard_choco_biogeografico.html (Eddy Chaverra). Ver types.ts para las formas tipadas.\n\n'
  const body = Object.entries(exportsMap)
    .map(([name, value]) => `export const ${name} = ${JSON.stringify(value)}`)
    .join('\n\n')
  writeFileSync(new URL(fileName, OUT_DIR), header + body + '\n')
  console.log('wrote', fileName)
}

// ── límites ──
writeTs('limites.generated.ts', {
  DEPTO_MAP: extractConst('DEPTO_MAP', 1265),
  DEPTO_IDS: extractConst('DEPTO_IDS', 1266),
  DEFAULT_LIMITES_DEPTOS: extractConst('DEFAULT_LIMITES_DEPTOS', 1291),
  DEFAULT_LIMITES_MUNIS: extractConst('DEFAULT_LIMITES_MUNIS', 1292),
})

// ── titulación ──
writeTs('titulacion.generated.ts', {
  TOTAL_CC_GLOBAL: extractConst('TOTAL_CC_GLOBAL', 1293),
  TOTAL_RI_GLOBAL: extractConst('TOTAL_RI_GLOBAL', 1294),
  DEFAULT_TIT_DEPTOS: extractConst('DEFAULT_TIT_DEPTOS', 1295),
  DEFAULT_TIT_MUNIS: extractConst('DEFAULT_TIT_MUNIS', 1296),
  C_CC: extractConst('C_CC', 1264),
  C_RI: extractConst('C_RI', 1264),
  C_ST: extractConst('C_ST', 1264),
})

// ── cuencas ──
writeTs('cuencas.generated.ts', {
  CUENCA_DATA: extractConst('CUENCA_DATA', 2062),
  SZH_DATA: extractConst('SZH_DATA', 2063),
  CUENCA_DEP_MUNIS: extractConst('CUENCA_DEP_MUNIS', 2350),
  PAL_CUENCAS: extractConst('PAL_CUENCAS', 3683),
})

// ── runap ──
writeTs('runap.generated.ts', {
  RUNAP_DATA: extractConst('RUNAP_DATA', 2069),
  RUNAP_MUNIS: extractConst('RUNAP_MUNIS', 2070),
  RUNAP_COLORS: extractConst('RUNAP_COLORS', 2071),
  RUNAP_CAT_TOTALS_EXACT: extractConst('RUNAP_CAT_TOTALS_EXACT', 2072),
  RUNAP_COUNTS: extractConst('RUNAP_COUNTS', 2074),
  RUNAP_DETAIL: extractConst('RUNAP_DETAIL', 4128),
})

// ── humedales ──
writeTs('humedales.generated.ts', {
  HUMEDAL_MUNIS: extractConst('HUMEDAL_MUNIS', 2065),
  HUMEDAL_DATA: extractConst('HUMEDAL_DATA', 2067),
})

// ── páramos ──
writeTs('paramos.generated.ts', {
  PARAMOS_DATA: extractConst('PARAMOS_DATA', 2075),
  PARAMOS_MUNIS: extractConst('PARAMOS_MUNIS', 2076),
  PARAMOS_COLORS: extractConst('PARAMOS_COLORS', 2077),
  PARAMOS_DETAIL: extractConst('PARAMOS_DETAIL', 4421),
})

// ── ciénagas ──
writeTs('cienagas.generated.ts', {
  PAL_CIENAGAS: extractConst('PAL_CIENAGAS', 2078),
  CIENAGAS_DATA: extractConst('CIENAGAS_DATA', 4756),
})

// ── población ──
writeTs('poblacion.generated.ts', {
  POB_DATA: extractConst('POB_DATA', 2080),
  ETNIA_DATA: extractWindowFallback('ETNIA_DATA', 5495),
  ETNIA_MUNIS: extractWindowFallback('ETNIA_MUNIS', 5505),
})

// ── paleta general / manglares (referencia, por si se usa como fallback categórico) ──
writeTs('paletaOriginal.generated.ts', {
  PAL: extractConst('PAL', 1263),
  PAL_MANGLARES: extractConst('PAL_MANGLARES', 1261),
})

console.log('Extracción completa.')
