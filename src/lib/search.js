/**
 * Búsqueda dinámica para VIGIIAP
 * - Normaliza acentos: "hidrología" == "hidrologia"
 * - Tokens independientes: "mapa hidro" busca ambas palabras (AND)
 * - Coincidencia parcial: "hidro" encuentra "Hidrología"
 * - Tolerancia a errores tipográficos leves (palabras >= 5 chars)
 */

/** Quita acentos y pasa a minúsculas */
export function normalize(str) {
  if (!str) return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/** Distancia de Levenshtein entre dos strings cortos */
function levenshtein(a, b) {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[a.length][b.length]
}

/**
 * Verifica si un token coincide dentro de un texto.
 * - Substring: "hidro" → "hidrología" ✅
 * - Fuzzy (palabras completas, >= 5 chars, 1 error): "analisi" → "analisis" ✅
 */
function tokenMatches(haystack, token) {
  if (haystack.includes(token)) return true
  // Comparar contra cada palabra del haystack con tolerancia de 1 error
  if (token.length >= 5) {
    const words = haystack.split(/\s+/)
    return words.some((word) => {
      if (Math.abs(word.length - token.length) > 2) return false
      return levenshtein(word, token) <= 1
    })
  }
  return false
}

/**
 * Función principal de búsqueda.
 * @param {string[]} fields - Textos del ítem a evaluar (title, excerpt, tag, etc.)
 * @param {string} query    - Texto buscado por el usuario
 * @returns {boolean}
 */
export function matches(fields, query) {
  if (!query || !query.trim()) return true
  const haystack = fields.filter(Boolean).map(normalize).join(' ')
  const tokens = normalize(query).split(/\s+/).filter(Boolean)
  return tokens.every((token) => tokenMatches(haystack, token))
}
