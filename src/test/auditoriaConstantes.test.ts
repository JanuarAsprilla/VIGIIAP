import { describe, test, expect } from 'vitest'
import { humanizarAccion, resumenOrigen, SEVERIDAD_META, SEVERIDADES_ORDEN } from '@/lib/constants/auditoria'
import { ACCION_LABEL } from '@/hooks/useAuditLog'

describe('humanizarAccion', () => {
  test('traduce el verbo del prefijo', () => {
    expect(humanizarAccion('create_geovisor')).toBe('Crear geovisor')
    expect(humanizarAccion('update_mapa_portada')).toBe('Actualizar mapa portada')
    expect(humanizarAccion('delete_ficha')).toBe('Eliminar ficha')
    expect(humanizarAccion('upsert_config_fichas')).toBe('Guardar config fichas')
    expect(humanizarAccion('export_algo')).toBe('Exportar algo')
  })

  test('sin verbo conocido, cambia guiones bajos por espacios y capitaliza', () => {
    expect(humanizarAccion('accion_nueva_sin_mapear')).toBe('Accion nueva sin mapear')
    expect(humanizarAccion('login')).toBe('Login')
  })
})

describe('resumenOrigen', () => {
  test('une navegador y sistema', () => {
    expect(resumenOrigen('Chrome', 'macOS')).toBe('Chrome · macOS')
  })

  test('acepta que falte uno de los dos', () => {
    expect(resumenOrigen('Firefox', null)).toBe('Firefox')
    expect(resumenOrigen(undefined, 'Linux')).toBe('Linux')
  })

  test('devuelve null si no hay nada', () => {
    expect(resumenOrigen(null, null)).toBeNull()
    expect(resumenOrigen()).toBeNull()
  })
})

describe('gravedades', () => {
  test('las tres gravedades tienen presentación y van de más a menos grave', () => {
    expect(SEVERIDADES_ORDEN).toEqual(['critica', 'advertencia', 'info'])
    for (const s of SEVERIDADES_ORDEN) {
      expect(SEVERIDAD_META[s].label).toBeTruthy()
      expect(SEVERIDAD_META[s].dot).toMatch(/^bg-/)
    }
  })
})

describe('diccionario de acciones', () => {
  // Estas son las acciones que el backend registra y que antes salían en bruto.
  test.each([
    'create_geovisor', 'update_geovisor', 'delete_geovisor', 'upsert_config_fichas', 'delete_config_fichas',
    'upsert_ficha_punto', 'create_conexion_geoserver', 'update_permisos_modulo', 'export_audit',
  ])('%s tiene etiqueta propia', (accion) => {
    expect(ACCION_LABEL[accion]?.label).toBeTruthy()
  })
})
