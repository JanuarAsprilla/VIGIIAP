import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MedioDropzone from '@/components/ui/MedioDropzone'

// userEvent.upload() emula el filtrado por `accept` del selector nativo del
// SO (silenciosamente descarta un archivo que no combina, sin que llegue al
// componente) -- para probar la validación propia ante un formato no
// admitido hace falta fireEvent.change, que dispara el evento directo sin
// esa emulación.
function subirDirecto(input: HTMLElement, archivos: File[]) {
  Object.defineProperty(input, 'files', { value: archivos, configurable: true })
  fireEvent.change(input)
}

function archivo(nombre: string, tipo: string, bytes: number): File {
  return new File([new Uint8Array(bytes)], nombre, { type: tipo })
}

describe('MedioDropzone — validación', () => {
  test('un archivo de formato admitido y tamaño válido se reporta como aceptado', async () => {
    const onArchivos = vi.fn()
    const user = userEvent.setup()
    render(<MedioDropzone onArchivos={onArchivos} />)

    const f = archivo('foto.jpg', 'image/jpeg', 1000)
    await user.upload(screen.getByLabelText(/Subir fotos o video/i), f)

    expect(onArchivos).toHaveBeenCalledWith([f], [])
  })

  test('un formato no admitido se rechaza con el motivo correspondiente', () => {
    const onArchivos = vi.fn()
    render(<MedioDropzone onArchivos={onArchivos} />)

    const f = archivo('documento.pdf', 'application/pdf', 1000)
    subirDirecto(screen.getByLabelText(/Subir fotos o video/i), [f])

    expect(onArchivos).toHaveBeenCalledWith([], [{ nombre: 'documento.pdf', motivo: 'Formato no admitido' }])
  })

  test('una imagen que supera los 15MB se rechaza por tamaño', () => {
    const onArchivos = vi.fn()
    render(<MedioDropzone onArchivos={onArchivos} />)

    const f = archivo('grande.jpg', 'image/jpeg', 16 * 1024 * 1024)
    subirDirecto(screen.getByLabelText(/Subir fotos o video/i), [f])

    expect(onArchivos).toHaveBeenCalledWith([], [{ nombre: 'grande.jpg', motivo: 'Supera el máximo de 15MB' }])
  })

  test('un video mp4 dentro del límite se acepta', async () => {
    const onArchivos = vi.fn()
    const user = userEvent.setup()
    render(<MedioDropzone onArchivos={onArchivos} />)

    const f = archivo('clip.mp4', 'video/mp4', 1000)
    await user.upload(screen.getByLabelText(/Subir fotos o video/i), f)

    expect(onArchivos).toHaveBeenCalledWith([f], [])
  })

  test('varios archivos mezclados se clasifican cada uno por separado', () => {
    const onArchivos = vi.fn()
    render(<MedioDropzone onArchivos={onArchivos} />)

    const buena = archivo('foto.jpg', 'image/jpeg', 1000)
    const mala = archivo('doc.pdf', 'application/pdf', 1000)
    subirDirecto(screen.getByLabelText(/Subir fotos o video/i), [buena, mala])

    expect(onArchivos).toHaveBeenCalledWith([buena], [{ nombre: 'doc.pdf', motivo: 'Formato no admitido' }])
  })
})

describe('MedioDropzone — deshabilitado', () => {
  test('con disabled, el input está deshabilitado y no acepta selección', () => {
    render(<MedioDropzone onArchivos={vi.fn()} disabled />)
    expect(screen.getByLabelText(/Subir fotos o video/i)).toBeDisabled()
  })
})
