const ITEMS = [
  'Biogeografía', 'Cartografía Ambiental', 'Datos Espaciales',
  'Chocó Colombiano', 'Investigación IIAP', 'Biodiversidad',
  'Pacífico Colombiano', 'SIG & Geovisor', 'Gestión Territorial',
]

export default function MarqueeStrip() {
  const items = [...ITEMS, ...ITEMS]
  return (
    <div
      className="overflow-hidden select-none"
      style={{
        borderTop: '1px solid var(--marquee-border)',
        borderBottom: '1px solid var(--marquee-border)',
        background: 'var(--marquee-bg)',
        backdropFilter: 'blur(12px)',
        padding: '14px 0',
      }}
    >
      <div className="flex gap-10 whitespace-nowrap animate-marquee">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-4 text-[0.68rem] font-bold uppercase tracking-[0.22em]"
            style={{ color: 'var(--marquee-text)' }}
          >
            {item}
            <span
              className="w-1 h-1 rounded-full shrink-0"
              style={{ background: 'var(--marquee-dot)' }}
            />
          </span>
        ))}
      </div>
    </div>
  )
}
