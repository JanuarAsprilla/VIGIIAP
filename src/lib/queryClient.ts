import { QueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:        1000 * 60 * 5,   // 5 min en caché antes de refetch
      gcTime:           1000 * 60 * 10,  // 10 min en memoria
      // Backoff exponencial: 1s → 2s → 4s — resiste cold starts de Render (~45s arranque)
      retry:       (failureCount, error) => {
        const status = (error as { status?: number }).status
        if (status && status >= 400 && status < 500) return false // 4xx no reintentar
        return failureCount < 3
      },
      retryDelay:  (attempt) => Math.min(1000 * 2 ** attempt, 15_000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        Sentry.captureException(error, { level: 'error', tags: { source: 'mutation' } })
      },
    },
  },
})

export default queryClient
