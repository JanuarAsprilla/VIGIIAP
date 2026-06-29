export interface ApiError extends Error {
  status?: number
  code?: string
  fields?: unknown
}

export function getApiErrorMessage(err: unknown, fallback = 'Error inesperado'): string {
  if (err instanceof Error) return err.message
  return fallback
}

export function asApiError(err: unknown): ApiError | null {
  return err instanceof Error ? (err as ApiError) : null
}
