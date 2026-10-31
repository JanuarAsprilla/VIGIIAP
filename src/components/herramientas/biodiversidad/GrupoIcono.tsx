import type { Grupo } from './types'

const TRAZOS: Record<Grupo, React.ReactNode> = {
  aves: (
    <>
      <path d="M3.5 18.5c5.5 1 10.2-1.4 12-6.4.7-1.9 1.3-4 4-4.6l1.6 1.6-1.9.9c.3 5.2-3.3 9.6-9.6 10.3z" />
      <path d="M9 15.2c1.6-.2 3-1 4-2.4" />
      <circle cx="17.2" cy="8.9" r=".7" fill="currentColor" stroke="none" />
    </>
  ),
  mamiferos: (
    <>
      <ellipse cx="6.5" cy="10" rx="1.7" ry="2.3" />
      <ellipse cx="10.2" cy="6.2" rx="1.7" ry="2.4" />
      <ellipse cx="14.8" cy="6.2" rx="1.7" ry="2.4" />
      <ellipse cx="18.2" cy="10" rx="1.7" ry="2.3" />
      <path d="M12.5 11.5c3 0 5.5 3.3 5.5 5.7 0 1.8-1.6 2.5-3.2 2.1-.9-.2-1.4-.5-2.3-.5s-1.4.3-2.3.5c-1.6.4-3.2-.3-3.2-2.1 0-2.4 2.5-5.7 5.5-5.7z" />
    </>
  ),
  anfibios: (
    <>
      <circle cx="7.5" cy="8" r="2.4" />
      <circle cx="16.5" cy="8" r="2.4" />
      <path d="M3.5 13.5c0-2.2 3.6-3.5 8.5-3.5s8.5 1.3 8.5 3.5c0 3.5-3.6 6-8.5 6s-8.5-2.5-8.5-6z" />
      <path d="M8 15.5c2.5 1.5 5.5 1.5 8 0" />
      <circle cx="7.5" cy="8" r=".6" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="8" r=".6" fill="currentColor" stroke="none" />
    </>
  ),
  reptiles: (
    <>
      <path d="M4 16.5a8 7.5 0 0 1 16 0z" />
      <path d="M12 9.2v7.3M7.6 11.6l2.4 4.9M16.4 11.6 14 16.5" />
      <path d="M20 14.2c1.6-.3 2.6.3 2.6 1.4s-1 1.9-2.6 1.4" />
      <path d="M7 16.5v2.4M17 16.5v2.4" />
    </>
  ),
  insectos: (
    <>
      <path d="M12 7.5v11" />
      <path d="M12 9.5C9.5 4.5 4.5 4.7 4.2 8.4c-.2 2.6 3 4 7.8 3.1" />
      <path d="M12 9.5c2.5-5 7.5-4.8 7.8-1.1.2 2.6-3 4-7.8 3.1" />
      <path d="M12 12.5c-3.8.2-6 2.6-4.8 5 .9 1.8 3.4 1.5 4.8-1.2M12 12.5c3.8.2 6 2.6 4.8 5-.9 1.8-3.4 1.5-4.8-1.2" />
      <path d="M11 6 9.2 3.8M13 6l1.8-2.2" />
    </>
  ),
  plantas: (
    <>
      <path d="M4.5 19.5C4.5 10 10.5 4.5 19.5 4.5c0 9-5.2 15-15 15z" />
      <path d="M4.5 19.5 14.5 9.5" />
    </>
  ),
  hongos: (
    <>
      <path d="M3.5 12.5a8.5 7.5 0 0 1 17 0z" />
      <path d="M9.2 12.5v4.8a2.8 2.8 0 0 0 5.6 0v-4.8" />
      <circle cx="8.2" cy="9.3" r=".9" fill="currentColor" stroke="none" />
      <circle cx="12.8" cy="7.4" r=".9" fill="currentColor" stroke="none" />
      <circle cx="16" cy="10.2" r=".9" fill="currentColor" stroke="none" />
    </>
  ),
}

/** Iconos propios de cada grupo, de trazo uniforme; decorativos (el nombre siempre está en texto). */
export default function GrupoIcono({ grupo, className = '' }: { grupo: Grupo; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className}
    >
      {TRAZOS[grupo]}
    </svg>
  )
}
