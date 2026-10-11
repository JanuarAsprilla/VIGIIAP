import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import ImportarFichasDialog from '@/components/admin/geovisores/fichas/ImportarFichasDialog'
import type { FeatureFichaEstado } from '@/types'

vi.mock('framer-motion', () => {
  const cache = new Map<string, (p: Record<string, unknown>) => ReactNode>()
  const motion = new Proxy({}, {
    get: (_t, tag: string) => {
      if (!cache.has(tag)) {
        cache.set(tag, ({ children, ...p }: Record<string, unknown>) => createElement(tag, p, children as ReactNode))
      }
      return cache.get(tag)
    },
  })
  return { motion }
})

vi.mock('@/hooks/useFichasPunto', () => ({ useImportarFichas: vi.fn() }))
import { useImportarFichas } from '@/hooks/useFichasPunto'

vi.mock('@/lib/fichas/importarFichas', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/fichas/importarFichas')>()),
  descargarPlantillaFichas: vi.fn().mockResolvedValue(undefined),
}))
import { descargarPlantillaFichas } from '@/lib/fichas/importarFichas'

const punto = (valor: string): FeatureFichaEstado => ({
  valor, etiqueta: null, centroide: [0, 0], nFeatures: 1, estado: 'sin_ficha', fichaId: null,
  nImagenes: 0, nVideos: 0, tieneDescripcion: false, actualizadoEn: null,
})
const features = [punto('EST-001'), punto('EST-002'), punto('EST-003')]

const DESC_LARGA = 'Descripción de la estación con más de veinte caracteres.'
const csv = (...lineas: string[]) => new File([lineas.join('\n')], 'fichas.csv', { type: 'text/csv' })

let mutateAsync: ReturnType<typeof vi.fn>

function montar(onClose = vi.fn()) {
  render(<ImportarFichasDialog configId="cfg1" capaNombre="Estaciones" features={features} onClose={onClose} />)
  return { onClose }
}

async function subir(user: ReturnType<typeof userEvent.setup>, archivo: File) {
  await user.upload(screen.getByLabelText(/archivo de fichas/i), archivo)
}

beforeEach(() => {
  vi.clearAllMocks()
  mutateAsync = vi.fn().mockResolvedValue({ creadas: 2, actualizadas: 0, omitidas: 0, duplicadasEnArchivo: 0 })
  vi.mocked(useImportarFichas).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useImportarFichas>)
})

describe('ImportarFichasDialog — plantilla y lectura del archivo', () => {
  test('"Descargar plantilla" genera el Excel con los puntos de la capa', async () => {
    const user = userEvent.setup()
    montar()
    await user.click(screen.getByRole('button', { name: /descargar plantilla/i }))

    expect(descargarPlantillaFichas).toHaveBeenCalledWith(features, 'Estaciones')
  })

  test('al subir un CSV válido muestra cuántas fichas se importarán', async () => {
    const user = userEvent.setup()
    montar()
    await subir(user, csv('Identificador,Descripción', `EST-001,${DESC_LARGA}`, `EST-002,${DESC_LARGA}`))

    expect(await screen.findByText(/2 fichas listas para importar/i)).toBeInTheDocument()
  })

  test('los identificadores que no existen en la capa se avisan y se ignoran', async () => {
    const user = userEvent.setup()
    montar()
    await subir(user, csv('Identificador,Descripción', `EST-001,${DESC_LARGA}`, `EST-999,${DESC_LARGA}`))

    expect(await screen.findByText(/1 ficha lista para importar/i)).toBeInTheDocument()
    expect(screen.getByText(/EST-999/)).toBeInTheDocument()
    expect(screen.getByText(/no coinciden con ningún punto/i)).toBeInTheDocument()
  })

  test('las descripciones por debajo de 20 caracteres se advierten pero no bloquean', async () => {
    const user = userEvent.setup()
    montar()
    await subir(user, csv('Identificador,Descripción', 'EST-001,Corta'))

    expect(await screen.findByText(/1 descripción tiene menos de 20 caracteres/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /importar 1 ficha/i })).toBeEnabled()
  })

  test('un archivo sin la columna de identificador muestra el error y no ofrece importar', async () => {
    const user = userEvent.setup()
    montar()
    await subir(user, csv('Nombre,Descripción', `Uno,${DESC_LARGA}`))

    expect(await screen.findByRole('alert')).toHaveTextContent(/columna «Identificador»/i)
    expect(screen.queryByRole('button', { name: /^importar/i })).not.toBeInTheDocument()
  })

  test('un archivo de más de 5 MB se rechaza sin leerlo', async () => {
    const user = userEvent.setup()
    montar()
    const grande = new File(['x'], 'enorme.csv', { type: 'text/csv' })
    Object.defineProperty(grande, 'size', { value: 6 * 1024 * 1024 })
    await subir(user, grande)

    expect(await screen.findByRole('alert')).toHaveTextContent(/5 MB/i)
  })
})

describe('ImportarFichasDialog — importar', () => {
  test('importa solo las filas que coinciden con puntos de la capa y no sobrescribe por defecto', async () => {
    const user = userEvent.setup()
    montar()
    await subir(user, csv('Identificador,Título,Descripción', `EST-001,Uno,${DESC_LARGA}`, `EST-999,Otro,${DESC_LARGA}`))
    await user.click(await screen.findByRole('button', { name: /importar 1 ficha/i }))

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      filas: [{ valor: 'EST-001', titulo: 'Uno', descripcion: DESC_LARGA }],
      sobrescribir: false,
    }))
  })

  test('marcar "reemplazar descripciones" lo envía como sobrescribir', async () => {
    const user = userEvent.setup()
    montar()
    await subir(user, csv('Identificador,Descripción', `EST-001,${DESC_LARGA}`))
    await user.click(await screen.findByLabelText(/reemplazar las descripciones que ya existen/i))
    await user.click(screen.getByRole('button', { name: /importar 1 ficha/i }))

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ sobrescribir: true }))
  })

  test('al terminar muestra el resumen y "Listo" cierra el diálogo', async () => {
    mutateAsync.mockResolvedValue({ creadas: 5, actualizadas: 3, omitidas: 2, duplicadasEnArchivo: 0 })
    const user = userEvent.setup()
    const { onClose } = montar()
    await subir(user, csv('Identificador,Descripción', `EST-001,${DESC_LARGA}`))
    await user.click(await screen.findByRole('button', { name: /importar 1 ficha/i }))

    expect(await screen.findByText(/5 creadas/i)).toBeInTheDocument()
    expect(screen.getByText(/3 actualizadas/i)).toBeInTheDocument()
    expect(screen.getByText(/2 omitidas/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /listo/i }))
    expect(onClose).toHaveBeenCalled()
  })

  test('si la importación falla muestra el error y conserva la revisión para reintentar', async () => {
    mutateAsync.mockRejectedValue(new Error('Se importaron 500 de 700 filas antes de un error: red'))
    const user = userEvent.setup()
    montar()
    await subir(user, csv('Identificador,Descripción', `EST-001,${DESC_LARGA}`))
    await user.click(await screen.findByRole('button', { name: /importar 1 ficha/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/500 de 700 filas/i)
    expect(screen.getByRole('button', { name: /importar 1 ficha/i })).toBeEnabled()
  })
})
