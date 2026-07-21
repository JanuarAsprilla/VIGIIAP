import React from 'react'
import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react'

interface SearchContextValue {
  query: string
  setQuery: React.Dispatch<React.SetStateAction<string>>
  debouncedQuery: string
}

const SearchContext = createContext<SearchContextValue | null>(null)

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(id)
  }, [query])

  const value = useMemo(() => ({ query, setQuery, debouncedQuery }), [query, debouncedQuery])

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error('useSearch debe usarse dentro de SearchProvider')
  }
  return context
}