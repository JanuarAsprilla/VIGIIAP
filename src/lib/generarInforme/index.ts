import { generarCsv } from './csv'
import { nombreSeguro } from './descargar'
import { generarExcel } from './excel'
import { cargarLogo } from './logo'
import { generarPdf } from './pdf'
import type { DatosInforme, FormatoDescarga, PlantillaInforme } from './tipos'

export type { Cifra, DatosInforme, FormatoDescarga, PlantillaInforme, SeccionInforme, TablaInforme } from './tipos'
export { guardarArchivo } from './descargar'

export interface ArchivoGenerado {
  blob: Blob
  nombre: string
}

/** Genera el archivo del informe en el formato pedido. Cada formato carga su librería solo cuando se usa. */
export async function generarArchivo(
  formato: FormatoDescarga,
  datos: DatosInforme,
  plantilla: PlantillaInforme,
  signal?: AbortSignal,
): Promise<ArchivoGenerado> {
  if (formato === 'pdf') {
    const logo = await cargarLogo(plantilla.logoUrl, signal)
    return { blob: await generarPdf(datos, plantilla, logo), nombre: nombreSeguro(datos.nombreArchivo, 'pdf') }
  }
  if (formato === 'xlsx') return { blob: await generarExcel(datos, plantilla), nombre: nombreSeguro(datos.nombreArchivo, 'xlsx') }
  return { blob: generarCsv(datos), nombre: nombreSeguro(datos.nombreArchivo, 'csv') }
}
