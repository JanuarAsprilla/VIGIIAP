import { NOMBRE_AMENAZA, NOMBRE_TIPO } from './conservacion'
import { traducirEvidencia } from './evidencia'
import {
  NIVELES_TAXON, NOMBRE_NIVEL, cambiosConjunto, cambiosEntidad, cambiosTaxon, type CambiosUrl, type Filtros,
} from './filtros'

export interface ChipFiltro {
  clave: string
  /** Texto visible: «Familia: Hylidae». */
  etiqueta: string
  /** Texto para lectores de pantalla al quitarlo. */
  quitarEtiqueta: string
  quitar: CambiosUrl
}

function chip(clave: string, etiqueta: string, quitar: CambiosUrl): ChipFiltro {
  return { clave, etiqueta, quitarEtiqueta: `Quitar el filtro ${etiqueta}`, quitar }
}

function rangoAnios(f: Filtros): string {
  if (f.anioDesde !== null && f.anioHasta !== null) return `${f.anioDesde}–${f.anioHasta}`
  return f.anioDesde !== null ? `desde ${f.anioDesde}` : `hasta ${f.anioHasta}`
}

/** Un chip por filtro activo, en el orden en que se leen: territorio, taxonomía, conservación, fuente, tiempo, calidad. */
export function chipsActivos(f: Filtros, nombreMunicipio: string | null): ChipFiltro[] {
  const c: ChipFiltro[] = []
  if (f.municipio) c.push(chip('municipio', `Municipio: ${nombreMunicipio ?? f.municipio}`, { municipio: null, departamento: null }))
  else if (f.departamento) c.push(chip('departamento', `Departamento: ${f.departamento}`, { departamento: null }))
  for (const n of NIVELES_TAXON) if (f[n]) c.push(chip(n, `${NOMBRE_NIVEL[n]}: ${f[n]}`, cambiosTaxon(n, null)))
  if (f.especie) c.push(chip('especie', `Especie: ${f.nombreEspecie ?? f.especie}`, { especie: null, nombre_especie: null }))
  if (f.buscar) c.push(chip('buscar', `Nombre: «${f.buscar}»`, { buscar: null }))
  if (f.conservacion) {
    const etiqueta = f.conservacion === 'amenazada' && f.amenaza
      ? `${NOMBRE_TIPO.amenazada}: ${f.amenaza} · ${NOMBRE_AMENAZA[f.amenaza]}` : `Conservación: ${NOMBRE_TIPO[f.conservacion]}`
    c.push(chip('conservacion', etiqueta, { conservacion: null, amenaza: null }))
  }
  if (f.entidad) c.push(chip('entidad', `Entidad: ${f.nombreEntidad ?? 'seleccionada'}`, cambiosEntidad(null, null)))
  if (f.conjunto) c.push(chip('conjunto', `Conjunto: ${f.nombreConjunto ?? 'seleccionado'}`, cambiosConjunto(null, null)))
  if (f.anioDesde !== null || f.anioHasta !== null) c.push(chip('anios', `Años: ${rangoAnios(f)}`, { anio_desde: null, anio_hasta: null }))
  if (f.evidencia) c.push(chip('evidencia', `Evidencia: ${traducirEvidencia(f.evidencia)}`, { evidencia: null }))
  if (f.conFoto) c.push(chip('con_foto', 'Solo con foto', { con_foto: null }))
  if (f.conUbicacion) c.push(chip('con_ubicacion', 'Solo con ubicación visible', { con_ubicacion: null }))
  return c
}

/** Último nivel taxonómico elegido, para el texto resumen. */
function ultimoTaxon(f: Filtros): string | null {
  if (f.especie) return f.nombreEspecie ?? null
  for (let i = NIVELES_TAXON.length - 1; i >= 0; i -= 1) if (f[NIVELES_TAXON[i]]) return f[NIVELES_TAXON[i]]
  return null
}

/** «Mostrando 1.234 de 28.856 registros · Anfibios · Hylidae · Chocó». */
export function textoResumen(
  f: Filtros, nombreGrupo: string, nombreTerritorio: string | null, filtrados: number | null, total: number | null,
  fmt: (n: number) => string,
): string {
  const partes = [nombreGrupo, ultimoTaxon(f), nombreTerritorio ?? 'Chocó'].filter(Boolean)
  const cifra = filtrados === null ? 'Calculando registros' : total !== null && total !== filtrados
    ? `Mostrando ${fmt(filtrados)} de ${fmt(total)} registros` : `Mostrando ${fmt(filtrados)} registros`
  return `${cifra} · ${partes.join(' · ')}`
}
