const TIPOS: Record<string, string> = {
  PRESERVED_SPECIMEN: 'Espécimen preservado',
  HUMAN_OBSERVATION: 'Observación humana',
  MACHINE_OBSERVATION: 'Observación automatizada',
  MATERIAL_SAMPLE: 'Muestra de material',
  MATERIAL_CITATION: 'Cita de material',
  LIVING_SPECIMEN: 'Espécimen vivo',
  FOSSIL_SPECIMEN: 'Fósil',
  OCCURRENCE: 'Registro de presencia',
  UNKNOWN: 'Sin determinar',
}

export function traducirEvidencia(tipo: string | null): string {
  if (!tipo) return 'Sin determinar'
  return TIPOS[tipo.toUpperCase()] ?? 'Otro tipo de evidencia'
}
