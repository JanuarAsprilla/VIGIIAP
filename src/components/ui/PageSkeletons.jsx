/**
 * PageSkeletons — pantallas de carga por módulo.
 * Se usan como fallback en los Suspense de App.jsx.
 * Cada skeleton replica la estructura visual real de la página.
 */

import { Skeleton, SkeletonText, SkeletonCard } from './Skeleton'

// ── Header común ──
function SkeletonPageHeader() {
  return (
    <div className="mb-6 space-y-2" aria-hidden="true">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-3.5 w-96 max-w-full" />
    </div>
  )
}

// ── Barra de filtros ──
function SkeletonFilterBar({ cols = 3 }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-${cols} gap-3 mb-6`} aria-hidden="true">
      <Skeleton className="h-10 rounded-xl col-span-2" />
      {Array.from({ length: cols - 1 }, (_, i) => (
        <Skeleton key={i} className="h-10 rounded-xl" />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Home skeleton
// ─────────────────────────────────────────────
export function HomeSkeleton() {
  return (
    <div className="p-4 lg:p-8 space-y-8" role="status" aria-label="Cargando inicio...">
      {/* Hero */}
      <div className="bg-white border border-border rounded-2xl p-6 space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* Module cards */}
      <div>
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>

      {/* News */}
      <div>
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="bg-white border border-border rounded-2xl p-5 space-y-3">
              <Skeleton className="h-3 w-20" />
              <SkeletonText lines={2} />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Mapas skeleton
// ─────────────────────────────────────────────
export function MapasSkeleton() {
  return (
    <div className="p-4 lg:p-8" role="status" aria-label="Cargando mapas...">
      <SkeletonPageHeader />
      <SkeletonFilterBar cols={4} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="bg-white border border-border rounded-2xl overflow-hidden">
            <Skeleton className="h-40 rounded-none" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-4/5" />
              <SkeletonText lines={2} />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-8 flex-1 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Documentos skeleton
// ─────────────────────────────────────────────
export function DocumentosSkeleton() {
  return (
    <div className="p-4 lg:p-8" role="status" aria-label="Cargando documentos...">
      <SkeletonPageHeader />
      <SkeletonFilterBar cols={4} />
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="bg-white border border-border rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24 ml-auto" />
            </div>
            <div className="pl-13 space-y-2">
              {Array.from({ length: 3 }, (_, j) => (
                <div key={j} className="flex items-center gap-3 py-2">
                  <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-3/5" />
                    <Skeleton className="h-3 w-2/5" />
                  </div>
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Herramientas skeleton
// ─────────────────────────────────────────────
export function HerramientasSkeleton() {
  return (
    <div className="p-4 lg:p-8" role="status" aria-label="Cargando herramientas...">
      <SkeletonPageHeader />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="bg-white border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-10 rounded-xl" />
              <Skeleton className="h-10 rounded-xl" />
              <Skeleton className="h-10 rounded-xl" />
            </div>
            <Skeleton className="h-10 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Noticias skeleton
// ─────────────────────────────────────────────
export function NoticiasSkeleton() {
  return (
    <div className="p-4 lg:p-8" role="status" aria-label="Cargando noticias...">
      <SkeletonPageHeader />
      <Skeleton className="h-10 w-full rounded-xl mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="bg-white border border-border rounded-2xl overflow-hidden">
            <Skeleton className="h-44 rounded-none" />
            <div className="p-5 space-y-3">
              <Skeleton className="h-3 w-20" />
              <SkeletonText lines={2} />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Solicitudes skeleton
// ─────────────────────────────────────────────
export function SolicitudesSkeleton() {
  return (
    <div className="p-4 lg:p-8" role="status" aria-label="Cargando solicitudes...">
      <SkeletonPageHeader />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="bg-white border border-border rounded-2xl p-4 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </div>
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0">
            <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Perfil skeleton
// ─────────────────────────────────────────────
export function PerfilSkeleton() {
  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6" role="status" aria-label="Cargando perfil...">
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-3.5 w-80 max-w-full" />
      </div>
      {/* Avatar card */}
      <div className="bg-white border border-border rounded-2xl p-6 flex items-center gap-5">
        <Skeleton className="w-20 h-20 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-52" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>
      {/* Sections */}
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border space-y-1">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-64" />
          </div>
          <div className="p-6 space-y-4">
            {Array.from({ length: 3 }, (_, j) => (
              <div key={j} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="h-3.5 w-40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Generic fallback (admin pages, recursos)
// ─────────────────────────────────────────────
export function GenericPageSkeleton() {
  return (
    <div className="p-4 lg:p-8" role="status" aria-label="Cargando...">
      <SkeletonPageHeader />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
