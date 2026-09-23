/**
 * Los 93 municipios objetivo del Chocó Biogeográfico, agrupados por
 * departamento, más los alias que usa la cartografía oficial del DANE/IGAC
 * para algunos de ellos. Extraído verbatim de validador_coordenadas_IIAP.html
 * (Eddy Chaverra, IIAP) -- no cambiar los nombres/agrupación sin verificar
 * contra la fuente original.
 */
export const MUNICIPIOS_OBJETIVO: Record<string, string[]> = {
  ANTIOQUIA: ['Turbo', 'Apartadó', 'Chigorodó', 'Carepa', 'Necoclí', 'Urrao', 'Mutatá', 'Dabeiba', 'Frontino', 'San Pedro De Urabá', 'Cañasgordas', 'Abriaquí', 'Vigía Del Fuerte', 'Uramita', 'Murindó', 'Ituango'],
  'CHOCÓ': ['Quibdó', 'Istmina', 'Belén de Bajirá', 'Tadó', 'Riosucio', 'Alto Baudó', 'Bajo Baudó', 'Río Quito', 'Carmen Del Darién', 'Medio Atrato', 'Bojayá', 'Condoto', 'Unguía', 'Acandí', 'Medio Baudó', 'Medio San Juan', 'El Litoral Del San Juan', 'Bagadó', 'Bahía Solano', 'Sipí', 'Atrato (Yuto)', 'Unión Panamericana', 'Nóvita', 'Lloró', 'El Carmen', 'Río Iró', 'Cértegui', 'El Cantón Del San Pablo', 'San José Del Palmar', 'Juradó', 'Nuquí'],
  'VALLE DEL CAUCA': ['Buenaventura', 'Dagua', 'La Cumbre', 'Calima', 'Restrepo', 'Versalles', 'Roldanillo', 'El Cairo', 'Bolívar', 'El Dovio', 'Vijes', 'Yotoco', 'La Unión', 'Trujillo', 'Argelia'],
  'NARIÑO': ['Tumaco', 'Barbacoas', 'Magüí', 'El Charco', 'Cumbal', 'Ricaurte', 'Olaya Herrera', 'Mallama', 'Samaniego', 'Roberto Payán', 'La Tola', 'Mosquera', 'Santa Cruz', 'Santa Bárbara', 'Policarpa', 'Francisco Pizarro', 'Los Andes', 'Leiva', 'Cumbitara', 'Sapuyes', 'El Rosario', 'La Llanada'],
  CAUCA: ['López', 'Argelia', 'Guapi', 'Timbiquí', 'El Tambo'],
  'CÓRDOBA': ['Tierralta', 'Valencia'],
  RISARALDA: ['Pueblo Rico', 'Mistrató'],
}

/** Nombres alternativos que usa la cartografía oficial del DANE/IGAC para
 *  algunos de estos municipios -- solo relevante si se recarga desde el DANE
 *  o se sube un GeoJSON externo (los límites embebidos ya vienen con el
 *  nombre "bonito"). */
export const ALIASES_MUNI: Record<string, string[]> = {
  'Atrato (Yuto)': ['ATRATO'],
  'López': ['LOPEZ DE MICAY'],
  'Santa Cruz': ['SANTACRUZ'],
  Tumaco: ['SAN ANDRES DE TUMACO'],
  'El Carmen': ['EL CARMEN DE ATRATO'],
}

export const TOTAL_MUNICIPIOS_OBJETIVO = Object.values(MUNICIPIOS_OBJETIVO)
  .reduce((total, munis) => total + munis.length, 0)
