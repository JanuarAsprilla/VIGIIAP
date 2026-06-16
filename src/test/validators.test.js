import { describe, test, expect } from 'vitest'
import {
  validateRequired,
  validateEmail,
  validateMinLength,
  validatePassword,
  validatePasswordStrength,
  passwordCriteria,
  validatePasswordMatch,
  validateCheckbox,
  validateSelect,
} from '../lib/validators'

// ─── validateRequired ──────────────────────────────────────────────────────────
describe('validateRequired', () => {
  test('returns null for a non-empty string', () => {
    expect(validateRequired('algo', 'Campo')).toBeNull()
  })

  test('returns error message for empty string', () => {
    expect(validateRequired('', 'Nombre')).toBe('Nombre es requerido')
  })

  test('returns error message for whitespace-only string', () => {
    expect(validateRequired('   ', 'Nombre')).toBe('Nombre es requerido')
  })

  test('returns error message for null', () => {
    expect(validateRequired(null, 'Nombre')).toBe('Nombre es requerido')
  })

  test('returns error message for undefined', () => {
    expect(validateRequired(undefined, 'Nombre')).toBe('Nombre es requerido')
  })
})

// ─── validateEmail ─────────────────────────────────────────────────────────────
describe('validateEmail', () => {
  test('returns null for a valid email', () => {
    expect(validateEmail('user@example.com')).toBeNull()
  })

  test('returns null for email with subdomain', () => {
    expect(validateEmail('user@mail.iiap.gov.co')).toBeNull()
  })

  test('returns error for empty string', () => {
    expect(validateEmail('')).toBe('El correo electrónico es requerido')
  })

  test('returns error for null', () => {
    expect(validateEmail(null)).toBe('El correo electrónico es requerido')
  })

  test('returns error for undefined', () => {
    expect(validateEmail(undefined)).toBe('El correo electrónico es requerido')
  })

  test('returns error for missing @', () => {
    expect(validateEmail('userexample.com')).toBe('Ingrese un correo electrónico válido')
  })

  test('returns error for missing domain', () => {
    expect(validateEmail('user@')).toBe('Ingrese un correo electrónico válido')
  })

  test('returns error for missing TLD', () => {
    expect(validateEmail('user@example')).toBe('Ingrese un correo electrónico válido')
  })

  test('returns error for email with spaces', () => {
    expect(validateEmail('user @example.com')).toBe('Ingrese un correo electrónico válido')
  })
})

// ─── validateMinLength ─────────────────────────────────────────────────────────
describe('validateMinLength', () => {
  test('returns null when length >= min', () => {
    expect(validateMinLength('hola mundo', 5, 'Campo')).toBeNull()
  })

  test('returns null when length equals min exactly', () => {
    expect(validateMinLength('abc', 3, 'Campo')).toBeNull()
  })

  test('returns length error when string is too short', () => {
    expect(validateMinLength('ab', 3, 'Campo')).toBe('Campo debe tener al menos 3 caracteres')
  })

  test('returns required error for empty string', () => {
    expect(validateMinLength('', 3, 'Campo')).toBe('Campo es requerido')
  })

  test('returns required error for null', () => {
    expect(validateMinLength(null, 3, 'Campo')).toBe('Campo es requerido')
  })
})

// ─── validatePassword ─────────────────────────────────────────────────────────
describe('validatePassword', () => {
  test('returns null for valid password with default minimum', () => {
    expect(validatePassword('secret')).toBeNull()
  })

  test('returns null for password meeting custom minimum', () => {
    expect(validatePassword('12345678', 8)).toBeNull()
  })

  test('returns error for password shorter than default minimum', () => {
    expect(validatePassword('abc')).toBe('La contraseña debe tener al menos 6 caracteres')
  })

  test('returns error for empty string', () => {
    expect(validatePassword('')).toBe('La contraseña es requerida')
  })

  test('returns error for null', () => {
    expect(validatePassword(null)).toBe('La contraseña es requerida')
  })

  test('returns error for undefined', () => {
    expect(validatePassword(undefined)).toBe('La contraseña es requerida')
  })
})

// ─── validatePasswordStrength ─────────────────────────────────────────────────
describe('validatePasswordStrength', () => {
  test('returns null for a strong password', () => {
    expect(validatePasswordStrength('Abcde1@8')).toBeNull()
  })

  test('returns required error for null', () => {
    expect(validatePasswordStrength(null)).toBe('La contraseña es requerida')
  })

  test('returns error when shorter than 8 chars', () => {
    expect(validatePasswordStrength('Ab1@')).toBe('La contraseña debe tener al menos 8 caracteres')
  })

  test('returns error when missing uppercase', () => {
    expect(validatePasswordStrength('abcde1@8')).toBe('Debe incluir al menos una letra mayúscula')
  })

  test('returns error when missing lowercase', () => {
    expect(validatePasswordStrength('ABCDE1@8')).toBe('Debe incluir al menos una letra minúscula')
  })

  test('returns error when missing number', () => {
    expect(validatePasswordStrength('Abcdefg@')).toBe('Debe incluir al menos un número')
  })

  test('returns error when missing special char', () => {
    expect(validatePasswordStrength('Abcde1234')).toBe('Debe incluir al menos un carácter especial (!@#$%...)')
  })
})

// ─── passwordCriteria ─────────────────────────────────────────────────────────
describe('passwordCriteria', () => {
  test('all criteria true for a strong password', () => {
    const result = passwordCriteria('Abcde1@8')
    expect(result).toEqual({ length: true, upper: true, lower: true, number: true, special: true })
  })

  test('all criteria false for empty string (default)', () => {
    const result = passwordCriteria()
    expect(result).toEqual({ length: false, upper: false, lower: false, number: false, special: false })
  })

  test('length false for short password', () => {
    expect(passwordCriteria('Ab1@').length).toBe(false)
  })

  test('upper false when no uppercase', () => {
    expect(passwordCriteria('abcde1@8').upper).toBe(false)
  })

  test('special true when special char present', () => {
    expect(passwordCriteria('A1!').special).toBe(true)
  })
})

// ─── validatePasswordMatch ────────────────────────────────────────────────────
describe('validatePasswordMatch', () => {
  test('returns null when passwords match', () => {
    expect(validatePasswordMatch('mypass', 'mypass')).toBeNull()
  })

  test('returns error when passwords differ', () => {
    expect(validatePasswordMatch('mypass', 'other')).toBe('Las contraseñas no coinciden')
  })

  test('returns error for empty vs non-empty', () => {
    expect(validatePasswordMatch('', 'something')).toBe('Las contraseñas no coinciden')
  })
})

// ─── validateCheckbox ─────────────────────────────────────────────────────────
describe('validateCheckbox', () => {
  test('returns null when checked is true', () => {
    expect(validateCheckbox(true, 'Acepta términos')).toBeNull()
  })

  test('returns provided message when unchecked', () => {
    expect(validateCheckbox(false, 'Acepta términos')).toBe('Acepta términos')
  })
})

// ─── validateSelect ───────────────────────────────────────────────────────────
describe('validateSelect', () => {
  test('returns null for a selected value', () => {
    expect(validateSelect('admin', 'rol')).toBeNull()
  })

  test('returns error for empty string', () => {
    expect(validateSelect('', 'rol')).toBe('Seleccione rol')
  })

  test('returns error for null', () => {
    expect(validateSelect(null, 'rol')).toBe('Seleccione rol')
  })

  test('returns error for undefined', () => {
    expect(validateSelect(undefined, 'rol')).toBe('Seleccione rol')
  })
})
