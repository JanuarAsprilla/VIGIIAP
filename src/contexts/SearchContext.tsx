import React from 'react'
import { createContext, useContext, useState, type ReactNode } from 'react'

interface SearchContextValue {
  query: string
  setQuery: React.Dispatch<React.SetStateAction<string>>
}

const SearchContext = createContext<SearchContextValue | null>(null)

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('')

  return (
    <SearchContext.Provider value={{ query, setQuery }}>
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