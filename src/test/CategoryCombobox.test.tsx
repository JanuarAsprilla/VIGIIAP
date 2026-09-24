import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CategoryCombobox from '@/components/admin/CategoryCombobox'

const OPCIONES = ['Fauna', 'Flora', 'Hidrología']

describe('CategoryCombobox — semántica ARIA', () => {
  test('el input expone role combobox con aria-expanded y aria-controls hacia el listbox', () => {
    render(<CategoryCombobox value="" onChange={vi.fn()} options={OPCIONES} />)
    const input = screen.getByRole('combobox')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    fireEvent.focus(input)
    expect(input).toHaveAttribute('aria-expanded', 'true')
    const listboxId = input.getAttribute('aria-controls')
    expect(listboxId).toBeTruthy()
    expect(screen.getByRole('listbox').id).toBe(listboxId)
  })

  test('cada opción visible tiene role option y aria-selected refleja el valor actual', () => {
    render(<CategoryCombobox value="Flora" onChange={vi.fn()} options={OPCIONES} />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    // El input arranca prellenado con el valor seleccionado ("Flora"), lo que
    // filtra la lista a esa única coincidencia -- se limpia para ver las 3.
    fireEvent.change(input, { target: { value: '' } })
    const opciones = screen.getAllByRole('option')
    expect(opciones).toHaveLength(3)
    const flora = opciones.find((o) => o.textContent?.includes('Flora'))!
    expect(flora).toHaveAttribute('aria-selected', 'true')
    const fauna = opciones.find((o) => o.textContent?.includes('Fauna'))!
    expect(fauna).toHaveAttribute('aria-selected', 'false')
  })
})

describe('CategoryCombobox — navegación por teclado', () => {
  test('ArrowDown mueve aria-activedescendant a la primera opción y sigue avanzando', () => {
    render(<CategoryCombobox value="" onChange={vi.fn()} options={OPCIONES} />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    const opciones = screen.getAllByRole('option')
    expect(input.getAttribute('aria-activedescendant')).toBe(opciones[0].id)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input.getAttribute('aria-activedescendant')).toBe(opciones[1].id)
  })

  test('ArrowUp no baja del primer elemento activo', () => {
    render(<CategoryCombobox value="" onChange={vi.fn()} options={OPCIONES} />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    const opciones = screen.getAllByRole('option')
    expect(input.getAttribute('aria-activedescendant')).toBe(opciones[0].id)
  })

  test('Enter sobre la opción activa la selecciona y cierra la lista', () => {
    const onChange = vi.fn()
    render(<CategoryCombobox value="" onChange={onChange} options={OPCIONES} />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.keyDown(input, { key: 'ArrowDown' }) // activa "Fauna" (índice 0)
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('Fauna')
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })

  test('Escape cierra la lista y descarta el texto no confirmado', () => {
    render(<CategoryCombobox value="Fauna" onChange={vi.fn()} options={OPCIONES} />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'xyz-no-existe' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).toHaveValue('Fauna')
  })
})
