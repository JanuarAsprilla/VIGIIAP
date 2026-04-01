import { createContext, useContext, useState } from 'react'

const SearchContext = createContext(null)

export function SearchProvider({ children }) {
  const [query, setQuery] = useState('')
  const [density, setDensity] = useState('normal') // 'compact' | 'normal' | 'comodo'
  return (
    <SearchContext.Provider value={{ query, setQuery, density, setDensity }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  return useContext(SearchContext)
}