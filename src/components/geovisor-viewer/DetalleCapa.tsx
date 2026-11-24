/** Resumen y palabras clave de una capa o grupo; no pinta nada si no hay datos. */
export default function DetalleCapa({ resumen, palabrasClave }: { resumen?: string; palabrasClave?: string[] }) {
  const texto = resumen?.trim()
  const claves = palabrasClave?.filter(Boolean) ?? []
  if (!texto && claves.length === 0) return null
  return (
    <div className="space-y-1.5 pb-1.5">
      {texto && <p className="text-[0.7rem] leading-snug text-text-muted">{texto}</p>}
      {claves.length > 0 && (
        <ul className="flex flex-wrap gap-1" aria-label="Palabras clave">
          {claves.map((k) => (
            <li key={k} className="rounded-full bg-primary-700/10 px-1.5 py-0.5 text-[0.55rem] font-semibold text-primary-800">{k}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
