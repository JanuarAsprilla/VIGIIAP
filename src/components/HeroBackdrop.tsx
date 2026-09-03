/**
 * Fondo compartido de las 2 primeras secciones de Home (InstitutionalRevealSection
 * + HeroSection, ver Home.tsx) — orbes ambientales + patrón topográfico, una sola
 * vez detrás de ambas en vez de que cada sección repinte su propia versión. Fijo,
 * sin parallax propio: el movimiento de scroll lo llevan solo los textos de cada
 * sección, no el fondo — así se siente una escena continua, no dos repintados.
 */
export default function HeroBackdrop() {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div
        className="absolute top-[15%] left-[10%] w-80 h-80 rounded-full"
        style={{ background: 'radial-gradient(circle, var(--hero-orb-1) 0%, transparent 70%)', filter: 'blur(60px)' }}
      />
      <div
        className="absolute bottom-[10%] right-[12%] w-96 h-96 rounded-full"
        style={{ background: 'radial-gradient(circle, var(--hero-orb-2) 0%, transparent 70%)', filter: 'blur(70px)' }}
      />
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 'var(--nav-topo-opacity)' }}>
        <defs>
          <pattern id="topo-hero" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
            <circle cx="60" cy="60" r="46" fill="none" stroke="var(--nav-topo-stroke)" strokeWidth="1" />
            <circle cx="60" cy="60" r="30" fill="none" stroke="var(--nav-topo-stroke)" strokeWidth="0.8" />
            <circle cx="60" cy="60" r="14" fill="none" stroke="var(--nav-topo-stroke)" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#topo-hero)" />
      </svg>
    </div>
  )
}
