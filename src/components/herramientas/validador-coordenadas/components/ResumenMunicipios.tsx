import type { ResumenMunicipio } from '../types'

interface ResumenMunicipiosProps {
  filas: ResumenMunicipio[]
}

/** Tabla resumen por municipio detectado (registros/válidas/sospechosas/
 *  inválidas + barra de % de calidad) -- misma agregación que el original. */
export default function ResumenMunicipios({ filas }: ResumenMunicipiosProps) {
  return (
    <div className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-3">
      <h3 className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-2 px-1">Resumen por municipio detectado</h3>
      <div className="max-h-[440px] overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="sticky top-0 bg-[var(--card-bg)]">
              {['Depto', 'Municipio', 'Puntos', 'Váli.', 'Sosp.', 'Invá.', 'Calidad'].map((h) => (
                <th key={h} className="text-left px-2 py-1.5 font-medium text-text-muted border-b border-border whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((m, i) => {
              const pct = m.reg ? Math.round((m.val / m.reg) * 100) : 0
              return (
                <tr key={`${m.dep}|${m.muni}|${i}`}>
                  <td className="px-2 py-1.5 border-b border-border/50 text-text whitespace-nowrap">{m.dep}</td>
                  <td className={`px-2 py-1.5 border-b border-border/50 whitespace-nowrap ${m.especial ? 'italic text-text-muted' : 'text-text'}`}>{m.muni}</td>
                  <td className="px-2 py-1.5 border-b border-border/50 text-text">{m.reg}</td>
                  <td className="px-2 py-1.5 border-b border-border/50 text-text">{m.val}</td>
                  <td className="px-2 py-1.5 border-b border-border/50 text-text">{m.sos}</td>
                  <td className="px-2 py-1.5 border-b border-border/50 text-text">{m.inv}</td>
                  <td className="px-2 py-1.5 border-b border-border/50">
                    <div className="flex items-center gap-1.5 min-w-[70px]">
                      <div className="flex-1 h-1.5 rounded-full bg-red-100 overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[0.65rem] text-text-muted shrink-0">{pct}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
