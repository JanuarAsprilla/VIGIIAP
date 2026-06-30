import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:        1000 * 60 * 5,   // 5 min en caché antes de refetch
      gcTime:           1000 * 60 * 10,  // 10 min en memoria
      retry:            1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Los errores de mutación se manejan localmente en cada hook
    },
  },
})

export default queryClient
