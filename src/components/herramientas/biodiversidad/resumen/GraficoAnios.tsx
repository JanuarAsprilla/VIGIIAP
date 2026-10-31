import { useState } from 'react'
import { fmtNum } from '../lib/format'

interface Punto {
  anio: number
  registros: number
}

const ANCHO = 640
const ALTO = 205
const MARGEN = { izq: 8, der: 8, sup: 24, inf: 24 }

function pasoEtiquetas(n: number): number {
  return n > 20 ? 5 : n > 10 ? 2 : 1
}

/** Barras de registros por año en SVG propio; el valor del año activo se lee arriba y hay tabla alterna. */
export default function GraficoAnios({ datos }: { datos: Punto[] }) {
  const [activo, setActivo] = useState<number | null>(null)
  if (datos.length === 0) return <p className="text-sm text-text-muted">Sin registros fechados en este alcance.</p>
  const maximo = Math.max(1, ...datos.map((d) => d.registros))
  const area = { w: ANCHO - MARGEN.izq - MARGEN.der, h: ALTO - MARGEN.sup - MARGEN.inf }
  const paso = area.w / datos.length
  const ancho = Math.max(2, paso - Math.min(3, paso * 0.25))
  const paso5 = pasoEtiquetas(datos.length)
  const sel = activo !== null ? datos[activo] : null
  const pico = datos.reduce((a, b) => (b.registros > a.registros ? b : a))
  return (
    <figure className="bio-figura">
      <p className="bio-lectura tabular-nums" aria-live="off">
        {sel ? <><b>{sel.anio}</b> · {fmtNum(sel.registros)} registros</> : <>Año con más registros: <b>{pico.anio}</b> · {fmtNum(pico.registros)}</>}
      </p>
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="bio-svg-anios" role="img"
        aria-label={`Registros por año, de ${datos[0].anio} a ${datos[datos.length - 1].anio}. El máximo es ${fmtNum(pico.registros)} en ${pico.anio}.`}
        onMouseLeave={() => setActivo(null)}>
        <line x1={MARGEN.izq} x2={ANCHO - MARGEN.der} y1={MARGEN.sup + area.h} y2={MARGEN.sup + area.h} className="bio-eje" />
        <line x1={MARGEN.izq} x2={ANCHO - MARGEN.der} y1={MARGEN.sup} y2={MARGEN.sup} className="bio-rejilla" />
        {datos.map((d, i) => {
          const h = Math.max(d.registros > 0 ? 2 : 0, (d.registros / maximo) * area.h)
          const x = MARGEN.izq + i * paso + (paso - ancho) / 2
          const esPico = d.anio === pico.anio
          const alIzquierda = x > ANCHO * 0.7
          return (
            <g key={d.anio} onMouseEnter={() => setActivo(i)}>
              <rect x={MARGEN.izq + i * paso} y={MARGEN.sup} width={paso} height={area.h} fill="transparent" />
              <rect x={x} y={MARGEN.sup + area.h - h} width={ancho} height={h} rx={Math.min(2, ancho / 2)}
                className={`bio-barra-anio ${activo === i ? 'bio-barra-activa' : esPico ? 'bio-barra-pico' : ''}`} />
              {esPico && (
                <text x={alIzquierda ? x + ancho : x} y={MARGEN.sup + area.h - h - 6} textAnchor={alIzquierda ? 'end' : 'start'} className="bio-anota">
                  Pico {d.anio} · {fmtNum(d.registros)}
                </text>
              )}
              {i % paso5 === 0 && (
                <text x={x + ancho / 2} y={ALTO - 7} textAnchor="middle" className="bio-eje-texto">{d.anio}</text>
              )}
            </g>
          )
        })}
      </svg>
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer text-text-muted min-h-8 inline-flex items-center">Ver como tabla</summary>
        <div className="bio-tabla-caja mt-2" tabIndex={0} role="region" aria-label="Registros por año, desplazable">
          <table className="bio-tabla">
            <caption className="sr-only">Registros por año</caption>
            <thead><tr><th scope="col">Año</th><th scope="col" className="bio-num">Registros</th></tr></thead>
            <tbody>{datos.map((d) => <tr key={d.anio}><td>{d.anio}</td><td className="bio-num">{fmtNum(d.registros)}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}
