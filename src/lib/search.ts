// Ignora acentos y mayúsculas, separa la consulta en palabras (todas deben
// aparecer, AND) y tolera errores de tipeo leves en palabras de 5+ letras.

export function normalize(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function levenshtein(a: string, b: string): number {
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

function tokenMatches(haystack: string, token: string): boolean {
  if (haystack.includes(token)) return true
  // Fuzzy: compara contra cada palabra con tolerancia de 1 error de tipeo.
  if (token.length >= 5) {
    const words = haystack.split(/\s+/)
    return words.some((word) => {
      if (Math.abs(word.length - token.length) > 2) return false
      return levenshtein(word, token) <= 1
    })
  }
  return false
}

export function matches(fields: (string | null | undefined)[], query: string): boolean {
  if (!query || !query.trim()) return true
  const haystack = fields.filter(Boolean).map(normalize).join(' ')
  const tokens = normalize(query).split(/\s+/).filter(Boolean)
  return tokens.every((token) => tokenMatches(haystack, token))
}
