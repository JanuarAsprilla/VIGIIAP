/**
 * PageSkeletons — pantallas de carga por módulo.
 * Se usan como respaldo de los Suspense de App.tsx; cada una replica la estructura de su página para que el contenido no salte
 * al llegar. Se arman solo con las piezas de ./Skeleton, así que comparten estilo, modo oscuro y «reducir animaciones».
 */

import { Skeleton, SkeletonText, SkeletonCard, RegionCargando } from './Skeleton'

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

// Las clases de columnas van completas y estáticas: Tailwind solo genera las que ve escritas en el código, no las que se
// arman con una plantilla de texto (`sm:grid-cols-${n}`).
const COLUMNAS_FILTROS = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4' } as const

// ── Barra de filtros ──
// La búsqueda ocupa dos columnas y los demás filtros una cada uno, de modo que la fila suma `cols` columnas en total.
function SkeletonFilterBar({ cols = 3 }: { cols?: keyof typeof COLUMNAS_FILTROS }) {
  return (
    <div className={`grid grid-cols-1 ${COLUMNAS_FILTROS[cols]} gap-3 mb-6`} aria-hidden="true">
      <Skeleton className="h-10 rounded-xl sm:col-span-2" />
      {Array.from({ length: cols - 2 }, (_, i) => (
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
    <RegionCargando etiqueta="Cargando inicio..." className="p-4 lg:p-8 space-y-8">
      {/* Hero */}
      <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-6 space-y-3">
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
            <div key={i} className="bg-[var(--card-bg)] border border-border rounded-2xl p-5 space-y-3">
              <Skeleton className="h-3 w-20" />
              <SkeletonText lines={2} />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    </RegionCargando>
  )
}

// ─────────────────────────────────────────────
// Mapas skeleton
// ─────────────────────────────────────────────
export function MapasSkeleton() {
  return (
    <RegionCargando etiqueta="Cargando mapas..." className="p-4 lg:p-8">
      <SkeletonPageHeader />
      <SkeletonFilterBar cols={4} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="bg-[var(--card-bg)] border border-border rounded-2xl overflow-hidden">
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
    </RegionCargando>
  )
}

// ─────────────────────────────────────────────
// Documentos skeleton
// ─────────────────────────────────────────────
export function DocumentosSkeleton() {
  return (
    <RegionCargando etiqueta="Cargando documentos..." className="p-4 lg:p-8">
      <SkeletonPageHeader />
      <SkeletonFilterBar cols={4} />
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="bg-[var(--card-bg)] border border-border rounded-2xl p-5">
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
    </RegionCargando>
  )
}

// ─────────────────────────────────────────────
// Herramientas skeleton
// ─────────────────────────────────────────────
export function HerramientasSkeleton() {
  return (
    <RegionCargando etiqueta="Cargando herramientas..." className="p-4 lg:p-8">
      <SkeletonPageHeader />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="bg-[var(--card-bg)] border border-border rounded-2xl p-6 space-y-4">
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
    </RegionCargando>
  )
}

// ─────────────────────────────────────────────
// Solicitudes skeleton
// ─────────────────────────────────────────────
export function SolicitudesSkeleton() {
  return (
    <RegionCargando etiqueta="Cargando solicitudes..." className="p-4 lg:p-8">
      <SkeletonPageHeader />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </div>
      <div className="bg-[var(--card-bg)] border border-border rounded-2xl overflow-hidden">
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
    </RegionCargando>
  )
}

// ─────────────────────────────────────────────
// Perfil skeleton
// ─────────────────────────────────────────────
export function PerfilSkeleton() {
  return (
    <RegionCargando etiqueta="Cargando perfil..." className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-3.5 w-80 max-w-full" />
      </div>
      {/* Avatar card */}
      <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-6 flex items-center gap-5">
        <Skeleton className="w-20 h-20 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-52" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>
      {/* Sections */}
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="bg-[var(--card-bg)] border border-border rounded-2xl overflow-hidden">
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
    </RegionCargando>
  )
}

// ─────────────────────────────────────────────
// Generic fallback (admin pages, recursos)
// ─────────────────────────────────────────────
export function GenericPageSkeleton() {
  return (
    <RegionCargando etiqueta="Cargando..." className="p-4 lg:p-8">
      <SkeletonPageHeader />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </RegionCargando>
  )
}
