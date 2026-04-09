/**
 * CommandPalette — búsqueda global estilo enterprise
 *
 * Accesibilidad:
 *   - role="dialog" + aria-modal + aria-label en overlay
 *   - role="combobox" en input con aria-expanded / aria-controls / aria-autocomplete
 *   - role="listbox" en lista de resultados
 *   - role="option" + aria-selected en cada ítem
 *   - aria-activedescendant en input apunta al ítem activo
 *   - Focus trap: Tab/Shift+Tab no salen del diálogo
 *   - Escape cierra
 *   - ArrowUp/ArrowDown navegan, Enter activa
 */

import { useEffect, useRef, useCallback, useState, useMemo, useId } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Home, Map, FileText, Globe, Wrench,
  ClipboardList, Newspaper, UserCircle, BookOpen,
  HelpCircle, FileCheck, ArrowRight, Clock,
  Keyboard, X,
} from 'lucide-react'
import { useUI } from '@/contexts/UIContext'
import { useAuth } from '@/contexts/AuthContext'
import { NAV_LINKS, ALL_NEWS } from '@/lib/constants'

// ─────────────────────────────────────────────
// Static catalogue — entries that always show
// ─────────────────────────────────────────────

const MODULE_ICONS = { Home, Map, FileText, Globe, Wrench, ClipboardList, Newspaper }

function buildCatalogue(isAuthenticated) {
  const modules = NAV_LINKS.map((link) => ({
    id:       `mod-${link.path}`,
    group:    'Módulos',
    label:    link.label,
    keywords: link.label.toLowerCase(),
    icon:     link.icon,
    to:       link.path,
  }))

  const actions = [
    isAuthenticated && {
      id: 'act-perfil', group: 'Acciones', label: 'Mi Perfil',
      keywords: 'perfil cuenta usuario', icon: UserCircle, to: '/perfil',
    },
    isAuthenticated && {
      id: 'act-solicitudes', group: 'Acciones', label: 'Mis Solicitudes',
      keywords: 'solicitudes trámites expedientes', icon: ClipboardList, to: '/solicitudes',
    },
    {
      id: 'act-guia', group: 'Recursos', label: 'Guía de Usuario',
      keywords: 'guia ayuda manual documentacion', icon: BookOpen, to: '/guia-usuario',
    },
    {
      id: 'act-faq', group: 'Recursos', label: 'Preguntas Frecuentes',
      keywords: 'faq preguntas frecuentes ayuda', icon: HelpCircle, to: '/faq',
    },
    {
      id: 'act-terminos', group: 'Recursos', label: 'Términos y Condiciones',
      keywords: 'terminos condiciones privacidad politica', icon: FileCheck, to: '/terminos',
    },
  ].filter(Boolean)

  const news = ALL_NEWS.slice(0, 5).map((n) => ({
    id:       `new-${n.id}`,
    group:    'Noticias',
    label:    n.title,
    meta:     n.tag,
    keywords: `${n.title} ${n.tag} ${n.author ?? ''}`.toLowerCase(),
    icon:     Newspaper,
    to:       `/noticias/${n.slug}`,
  }))

  return [...modules, ...actions, ...news]
}

// ─────────────────────────────────────────────
// Highlight matched text
// ─────────────────────────────────────────────

function Highlight({ text, query }) {
  if (!query.trim()) return <>{text}</>

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex   = new RegExp(`(${escaped})`, 'gi')
  const parts   = text.split(regex)

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="bg-primary-100 text-primary-900 rounded-sm not-italic">{part}</mark>
          : part
      )}
    </>
  )
}

// ─────────────────────────────────────────────
// Single result item
// ─────────────────────────────────────────────

function ResultItem({ item, isActive, query, onSelect, id }) {
  const Icon = item.icon
  return (
    <li
      id={id}
      role="option"
      aria-selected={isActive}
      onClick={onSelect}
      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
        isActive ? 'bg-primary-50' : 'hover:bg-bg-alt'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
        isActive ? 'bg-primary-800 text-white' : 'bg-bg-alt text-text-muted'
      }`}>
        <Icon className="w-4 h-4" aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0">
        {item.meta && (
          <p className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted mb-0.5">
            {item.meta}
          </p>
        )}
        <p className={`text-sm font-medium truncate ${isActive ? 'text-primary-800' : 'text-text'}`}>
          <Highlight text={item.label} query={query} />
        </p>
      </div>

      {isActive && (
        <ArrowRight className="w-4 h-4 text-primary-600 shrink-0" aria-hidden="true" />
      )}
    </li>
  )
}

// ─────────────────────────────────────────────
// CommandPalette
// ─────────────────────────────────────────────

const OVERLAY_ANIM = {
  initial:    { opacity: 0 },
  animate:    { opacity: 1 },
  exit:       { opacity: 0 },
  transition: { duration: 0.18 },
}

const PANEL_ANIM = {
  initial:    { opacity: 0, scale: 0.96, y: -12 },
  animate:    { opacity: 1, scale: 1,    y: 0    },
  exit:       { opacity: 0, scale: 0.96, y: -12  },
  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
}

export default function CommandPalette() {
  const { paletteOpen, closePalette } = useUI()
  const { isAuthenticated }           = useAuth()
  const navigate                      = useNavigate()

  const [query,        setQuery]        = useState('')
  const [activeIndex,  setActiveIndex]  = useState(0)

  const inputRef     = useRef(null)
  const listRef      = useRef(null)
  const panelRef     = useRef(null)

  const baseId    = useId()
  const inputId   = `${baseId}-input`
  const listboxId = `${baseId}-listbox`
  const itemId    = (i) => `${baseId}-item-${i}`

  // Build catalogue once per auth state change
  const catalogue = useMemo(() => buildCatalogue(isAuthenticated), [isAuthenticated])

  // Filter results — reset active index on each change
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return catalogue
    return catalogue.filter((item) => item.keywords.includes(q) || item.label.toLowerCase().includes(q))
  }, [query, catalogue])

  // Group results for display
  const groups = useMemo(() => {
    const map = new Map()
    for (const item of results) {
      if (!map.has(item.group)) map.set(item.group, [])
      map.get(item.group).push(item)
    }
    return map
  }, [results])

  // Flat index for keyboard navigation
  const flatResults = useMemo(() => results, [results])

  // Reset state when opening
  useEffect(() => {
    if (paletteOpen) {
      setQuery('')
      setActiveIndex(0)
      // Defer focus so AnimatePresence can mount the element
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [paletteOpen])

  // Reset active index when results change
  useEffect(() => { setActiveIndex(0) }, [query])

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.querySelector(`[id="${itemId(activeIndex)}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback((to) => {
    closePalette()
    navigate(to)
  }, [closePalette, navigate])

  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (flatResults[activeIndex]) handleSelect(flatResults[activeIndex].to)
        break
      case 'Escape':
        closePalette()
        break
      default:
        break
    }
  }, [activeIndex, flatResults, handleSelect, closePalette])

  // Focus trap — keep Tab/Shift+Tab inside the panel
  const handleFocusTrap = useCallback((e) => {
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusable = panelRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last  = focusable[focusable.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last?.focus() }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first?.focus() }
    }
  }, [])

  if (!paletteOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        {...OVERLAY_ANIM}
        className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
        style={{ background: 'rgba(5,14,9,0.55)', backdropFilter: 'blur(4px)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Búsqueda global"
        onClick={(e) => { if (e.target === e.currentTarget) closePalette() }}
        onKeyDown={handleFocusTrap}
      >
        <motion.div
          {...PANEL_ANIM}
          ref={panelRef}
          className="w-full max-w-xl bg-white border border-border rounded-2xl shadow-float overflow-hidden flex flex-col"
          style={{ maxHeight: '70vh' }}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border shrink-0">
            <Search className="w-4 h-4 text-text-muted shrink-0" aria-hidden="true" />
            <input
              ref={inputRef}
              id={inputId}
              type="search"
              role="combobox"
              aria-expanded={flatResults.length > 0}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={flatResults.length > 0 ? itemId(activeIndex) : undefined}
              autoComplete="off"
              spellCheck="false"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar módulos, noticias, documentos..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-text placeholder:text-text-muted"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Limpiar búsqueda"
                className="text-text-muted hover:text-text transition-colors shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
            <kbd
              className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[0.6rem] font-mono font-bold text-text-muted bg-bg-alt border border-border rounded"
              aria-label="Presione Escape para cerrar"
            >
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="overflow-y-auto flex-1">
            {flatResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center px-4" role="status">
                <Search className="w-8 h-8 text-text-muted/30 mb-3" aria-hidden="true" />
                <p className="text-sm font-medium text-text-muted">Sin resultados para</p>
                <p className="text-sm font-bold text-text mt-0.5">"{query}"</p>
              </div>
            ) : (
              <ul
                id={listboxId}
                role="listbox"
                aria-label="Resultados de búsqueda"
                className="py-2"
              >
                {Array.from(groups.entries()).map(([groupName, items]) => {
                  const groupStartIndex = flatResults.indexOf(items[0])
                  return (
                    <li key={groupName} role="presentation">
                      <p className="px-4 py-1.5 text-[0.6rem] font-bold uppercase tracking-widest text-text-muted select-none">
                        {groupName}
                      </p>
                      <ul role="presentation">
                        {items.map((item) => {
                          const flatIdx = flatResults.indexOf(item)
                          return (
                            <ResultItem
                              key={item.id}
                              id={itemId(flatIdx)}
                              item={item}
                              isActive={flatIdx === activeIndex}
                              query={query}
                              onSelect={() => handleSelect(item.to)}
                            />
                          )
                        })}
                      </ul>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Footer hints */}
          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border bg-bg-alt shrink-0">
            <span className="flex items-center gap-1.5 text-[0.65rem] text-text-muted">
              <kbd className="inline-flex items-center px-1.5 py-0.5 bg-white border border-border rounded text-[0.6rem] font-mono">↑↓</kbd>
              Navegar
            </span>
            <span className="flex items-center gap-1.5 text-[0.65rem] text-text-muted">
              <kbd className="inline-flex items-center px-1.5 py-0.5 bg-white border border-border rounded text-[0.6rem] font-mono">↵</kbd>
              Abrir
            </span>
            <span className="flex items-center gap-1.5 text-[0.65rem] text-text-muted">
              <kbd className="inline-flex items-center px-1.5 py-0.5 bg-white border border-border rounded text-[0.6rem] font-mono">ESC</kbd>
              Cerrar
            </span>
            <span className="ml-auto flex items-center gap-1 text-[0.65rem] text-text-muted">
              <Keyboard className="w-3 h-3" aria-hidden="true" />
              Cmd+K
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
