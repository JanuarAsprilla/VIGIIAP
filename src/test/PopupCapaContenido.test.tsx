import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PopupCapaContenido, { type ResultadoCapaClick } from '@/components/geovisor-viewer/PopupCapaContenido'
import type { CapaGeoserver, PresentacionGeovisor } from '@/types'

// isTrustedUrl real depende del origen del navegador/entorno -- se mockea para
// que las URLs de prueba (x.test) cuenten como confiables sin depender de
// variables de entorno del runner.
vi.mock('@/lib/trustedUrl', () => ({ isTrustedUrl: () => true }))

const capaFixture: CapaGeoserver = { id: 't_15_geologia:unidades', nombre: 'Unidades geológicas', tipo: 'vectorial', tema: 'geologia' }

function presentacion(overrides: Partial<PresentacionGeovisor> = {}): PresentacionGeovisor {
  return { mostrarMetricas: false, mostrarImagenes: false, camposPopup: [], ...overrides }
}

function feature(properties: Record<string, unknown>, geometry: GeoJSON.Geometry | null = null): GeoJSON.Feature {
  return { type: 'Feature', properties, geometry: geometry ?? { type: 'Point', coordinates: [0, 0] } }
}

describe('PopupCapaContenido — estados de carga', () => {
  test('muestra el spinner mientras carga', () => {
    render(<PopupCapaContenido resultados={null} cargando presentacion={presentacion()} onVerFicha={vi.fn()} />)
    expect(screen.getByText('Consultando…')).toBeInTheDocument()
  })

  test('sin resultados o todos vacíos, muestra el mensaje de "sin datos"', () => {
    render(<PopupCapaContenido resultados={[{ capa: capaFixture, color: '#000', features: [] }]} cargando={false} presentacion={presentacion()} onVerFicha={vi.fn()} />)
    expect(screen.getByText('Sin datos en este punto.')).toBeInTheDocument()
  })
})

describe('PopupCapaContenido — atributos', () => {
  test('sin camposPopup configurados, muestra todos los atributos crudos filtrando claves técnicas', () => {
    const resultados: ResultadoCapaClick[] = [{
      capa: capaFixture, color: '#1B4332',
      features: [feature({ MGUCR_SIMBL: 'Ks', shape_area: 123, objectid: 5, fid_1: 9 })],
    }]
    render(<PopupCapaContenido resultados={resultados} cargando={false} presentacion={presentacion()} onVerFicha={vi.fn()} />)

    expect(screen.getByText('MGUCR_SIMBL:')).toBeInTheDocument()
    expect(screen.getByText('Ks')).toBeInTheDocument()
    expect(screen.queryByText(/shape_area/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/objectid/i)).not.toBeInTheDocument()
  })

  test('con camposPopup configurados, muestra solo esos atributos con su alias', () => {
    const resultados: ResultadoCapaClick[] = [{
      capa: capaFixture, color: '#1B4332',
      features: [feature({ MGUCR_SIMBL: 'Ks', otro_campo: 'no debería verse' })],
    }]
    render(
      <PopupCapaContenido
        resultados={resultados}
        cargando={false}
        presentacion={presentacion({ camposPopup: [{ campo: 'MGUCR_SIMBL', alias: 'Símbolo cronoestratigráfico' }] })}
        onVerFicha={vi.fn()}
      />,
    )

    expect(screen.getByText('Símbolo cronoestratigráfico:')).toBeInTheDocument()
    expect(screen.queryByText(/otro_campo/i)).not.toBeInTheDocument()
    expect(screen.queryByText('no debería verse')).not.toBeInTheDocument()
  })

  test('sin atributos que mostrar, indica que no hay atributos', () => {
    const resultados: ResultadoCapaClick[] = [{ capa: capaFixture, color: '#1B4332', features: [feature({ objectid: 1 })] }]
    render(<PopupCapaContenido resultados={resultados} cargando={false} presentacion={presentacion()} onVerFicha={vi.fn()} />)
    expect(screen.getByText('Sin atributos para mostrar')).toBeInTheDocument()
  })
})

describe('PopupCapaContenido — imágenes', () => {
  test('mostrarImagenes con URL presente en el atributo configurado, muestra la imagen', () => {
    const resultados: ResultadoCapaClick[] = [{
      capa: capaFixture, color: '#1B4332',
      features: [feature({ foto_url: 'https://cdn.test/foto.jpg' })],
    }]
    render(
      <PopupCapaContenido resultados={resultados} cargando={false}
        presentacion={presentacion({ mostrarImagenes: true, campoImagenUrl: 'foto_url' })} onVerFicha={vi.fn()} />,
    )
    const img = screen.getByRole('img', { name: /Unidades geológicas/i })
    expect(img).toHaveAttribute('src', 'https://cdn.test/foto.jpg')
  })

  test('mostrarImagenes activo pero sin URL en la feature, muestra el placeholder', () => {
    const resultados: ResultadoCapaClick[] = [{ capa: capaFixture, color: '#1B4332', features: [feature({ nombre: 'x' })] }]
    render(
      <PopupCapaContenido resultados={resultados} cargando={false}
        presentacion={presentacion({ mostrarImagenes: true, campoImagenUrl: 'foto_url' })} onVerFicha={vi.fn()} />,
    )
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})

describe('PopupCapaContenido — métricas', () => {
  test('mostrarMetricas con una feature Polygon muestra el área en hectáreas', () => {
    const poligono: GeoJSON.Geometry = {
      type: 'Polygon',
      coordinates: [[[-76.60, 5.55], [-76.59, 5.55], [-76.59, 5.56], [-76.60, 5.56], [-76.60, 5.55]]],
    }
    const resultados: ResultadoCapaClick[] = [{ capa: capaFixture, color: '#1B4332', features: [feature({ nombre: 'x' }, poligono)] }]
    render(<PopupCapaContenido resultados={resultados} cargando={false} presentacion={presentacion({ mostrarMetricas: true })} onVerFicha={vi.fn()} />)
    expect(screen.getByText(/ha|km²|m²/)).toBeInTheDocument()
  })

  test('mostrarMetricas apagado no muestra ninguna métrica', () => {
    const poligono: GeoJSON.Geometry = {
      type: 'Polygon',
      coordinates: [[[-76.60, 5.55], [-76.59, 5.55], [-76.59, 5.56], [-76.60, 5.56], [-76.60, 5.55]]],
    }
    const resultados: ResultadoCapaClick[] = [{ capa: capaFixture, color: '#1B4332', features: [feature({ nombre: 'x' }, poligono)] }]
    render(<PopupCapaContenido resultados={resultados} cargando={false} presentacion={presentacion({ mostrarMetricas: false })} onVerFicha={vi.fn()} />)
    expect(screen.queryByText(/ha$/)).not.toBeInTheDocument()
  })
})

describe('PopupCapaContenido — ficha curada', () => {
  function featureConFicha(ficha: object): GeoJSON.Feature {
    return { ...feature({}), ficha } as GeoJSON.Feature
  }

  test('con feature.ficha, muestra la tarjeta compacta en vez de los atributos crudos', () => {
    const resultados: ResultadoCapaClick[] = [{
      capa: capaFixture, color: '#1B4332',
      features: [featureConFicha({
        id: 'f1', titulo: 'Estación río Atrato', descripcion: 'Monitorea el nivel del río desde 2020.',
        medios: [{ id: 'm1', tipo: 'imagen', estado: 'listo', url: 'https://x.test/a.jpg', miniaturaUrl: 'https://x.test/a-thumb.jpg', ancho: null, alto: null, duracionS: null, leyenda: null, creditos: null, orden: 0 }],
      })],
    }]
    render(<PopupCapaContenido resultados={resultados} cargando={false} presentacion={presentacion()} onVerFicha={vi.fn()} />)

    expect(screen.getByText('Estación río Atrato')).toBeInTheDocument()
    expect(screen.getByText('Monitorea el nivel del río desde 2020.')).toBeInTheDocument()
    expect(screen.getByText('Ver ficha')).toBeInTheDocument()
    expect(screen.queryByText('Sin atributos para mostrar')).not.toBeInTheDocument()
  })

  test('el botón "Ver ficha" llama a onVerFicha con la ficha completa', async () => {
    const ficha = { id: 'f1', titulo: null, descripcion: '', medios: [] }
    const resultados: ResultadoCapaClick[] = [{ capa: capaFixture, color: '#1B4332', features: [featureConFicha(ficha)] }]
    const onVerFicha = vi.fn()
    render(<PopupCapaContenido resultados={resultados} cargando={false} presentacion={presentacion()} onVerFicha={onVerFicha} />)

    screen.getByText('Ver ficha').click()
    expect(onVerFicha).toHaveBeenCalledWith(ficha)
  })

  test('sin feature.ficha, se comporta exactamente igual que antes (atributos crudos)', () => {
    const resultados: ResultadoCapaClick[] = [{ capa: capaFixture, color: '#1B4332', features: [feature({ MGUCR_SIMBL: 'Ks' })] }]
    render(<PopupCapaContenido resultados={resultados} cargando={false} presentacion={presentacion()} onVerFicha={vi.fn()} />)

    expect(screen.getByText('MGUCR_SIMBL:')).toBeInTheDocument()
    expect(screen.queryByText('Ver ficha')).not.toBeInTheDocument()
  })

  test('sin medios listos, muestra el placeholder de imagen en vez de romperse', () => {
    const resultados: ResultadoCapaClick[] = [{
      capa: capaFixture, color: '#1B4332',
      features: [featureConFicha({ id: 'f1', titulo: null, descripcion: '', medios: [{ id: 'm1', tipo: 'video', estado: 'procesando', url: null, miniaturaUrl: null, ancho: null, alto: null, duracionS: null, leyenda: null, creditos: null, orden: 0 }] })],
    }]
    render(<PopupCapaContenido resultados={resultados} cargando={false} presentacion={presentacion()} onVerFicha={vi.fn()} />)

    expect(screen.getByText('Ver ficha')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})

describe('PopupCapaContenido — múltiples features y capas', () => {
  test('trunca a MAX_FEATURES_POR_CAPA y muestra cuántas quedan fuera', () => {
    const resultados: ResultadoCapaClick[] = [{
      capa: capaFixture, color: '#1B4332',
      features: [
        feature({ nombre: 'a' }), feature({ nombre: 'b' }), feature({ nombre: 'c' }), feature({ nombre: 'd' }), feature({ nombre: 'e' }),
      ],
    }]
    render(<PopupCapaContenido resultados={resultados} cargando={false} presentacion={presentacion()} onVerFicha={vi.fn()} />)
    expect(screen.getByText('+2 más en este punto')).toBeInTheDocument()
  })

  test('capas sin features no se muestran, solo las que tienen datos', () => {
    const otraCapa: CapaGeoserver = { id: 't_20_hidrologia:cuencas', nombre: 'Cuencas hidrográficas', tipo: 'vectorial', tema: 'hidrologia' }
    const resultados: ResultadoCapaClick[] = [
      { capa: capaFixture, color: '#1B4332', features: [] },
      { capa: otraCapa, color: '#2563EB', features: [feature({ nombre: 'Río Atrato' })] },
    ]
    render(<PopupCapaContenido resultados={resultados} cargando={false} presentacion={presentacion()} onVerFicha={vi.fn()} />)
    expect(screen.queryByText('Unidades geológicas')).not.toBeInTheDocument()
    expect(screen.getByText('Cuencas hidrográficas')).toBeInTheDocument()
  })
})
