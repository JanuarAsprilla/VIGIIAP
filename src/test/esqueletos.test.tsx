import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Skeleton, RegionCargando, SkeletonCard, SkeletonLista } from '@/components/ui/Skeleton'
import {
  HomeSkeleton, MapasSkeleton, DocumentosSkeleton, HerramientasSkeleton,
  SolicitudesSkeleton, PerfilSkeleton, GenericPageSkeleton,
} from '@/components/ui/PageSkeletons'
import { readFileSync } from 'node:fs'

// Vitest corre desde la raíz del proyecto; los imports `?raw` de CSS llegan vacíos, por eso se lee el archivo.
const css = readFileSync('src/index.css', 'utf8')

describe('Skeleton', () => {
  it('es decorativo y usa la clase común', () => {
    const { container } = render(<Skeleton className="h-4 w-10" />)
    const el = container.firstElementChild as HTMLElement
    expect(el.getAttribute('aria-hidden')).toBe('true')
    expect(el.className).toContain('skeleton')
    expect(el.className).toContain('h-4')
  })
})

describe('RegionCargando', () => {
  it('anuncia el estado con role status, aria-busy y texto para lector de pantalla', () => {
    render(<RegionCargando etiqueta="Cargando mapas"><Skeleton className="h-2" /></RegionCargando>)
    const region = screen.getByRole('status')
    expect(region.getAttribute('aria-busy')).toBe('true')
    expect(region.getAttribute('aria-label')).toBe('Cargando mapas')
    expect(region.querySelector('.sr-only')?.textContent).toBe('Cargando mapas')
  })
})

describe('SkeletonCard', () => {
  it('toma el fondo del token de tarjeta y no un blanco fijo', () => {
    const { container } = render(<SkeletonCard />)
    const cls = (container.firstElementChild as HTMLElement).className
    expect(cls).toContain('--card-bg')
    expect(cls).not.toContain('bg-white')
  })
})

describe('SkeletonLista', () => {
  it('se anuncia como región de carga', () => {
    render(<SkeletonLista />)
    expect(screen.getByRole('status')).toBeTruthy()
  })
})

describe('esqueletos de página', () => {
  const paginas = [
    ['Home', HomeSkeleton], ['Mapas', MapasSkeleton], ['Documentos', DocumentosSkeleton],
    ['Herramientas', HerramientasSkeleton], ['Solicitudes', SolicitudesSkeleton],
    ['Perfil', PerfilSkeleton], ['Generic', GenericPageSkeleton],
  ] as const

  it.each(paginas)('%s es una región de carga accesible', (_n, Comp) => {
    const { container } = render(<Comp />)
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0)
    expect(container.querySelector('.animate-pulse')).toBeNull()
  })
})

describe('contrato de index.css', () => {
  it('define los tokens en claro y oscuro', () => {
    expect(css).toMatch(/:root\s*{[^}]*--skeleton-base/)
    expect(css).toMatch(/\.dark\s*{[^}]*--skeleton-brillo/)
  })
  it('anima solo con transform y respeta reduced motion', () => {
    expect(css).toMatch(/@keyframes skeleton-barrido\s*{\s*to\s*{\s*transform:/)
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*{\s*\.skeleton::after\s*{[^}]*animation:\s*none/)
  })
  it('vive en la capa components para no pisar utilidades', () => {
    expect(css).toMatch(/@layer components\s*{[\s\S]*\.skeleton\s*{/)
  })
})
