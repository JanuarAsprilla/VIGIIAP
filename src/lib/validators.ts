/**
 * validators.ts — Funciones puras de validación de formularios.
 * Cada función retorna el mensaje de error o null si es válido.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateRequired(value: string | null | undefined, label: string): string | null {
  return value?.toString().trim() ? null : `${label} es requerido`
}

export function validateEmail(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return 'El correo electrónico es requerido'
  if (!EMAIL_REGEX.test(trimmed)) return 'Ingrese un correo electrónico válido'
  return null
}

export function validateMinLength(value: string | null | undefined, min: number, label: string): string | null {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return `${label} es requerido`
  if (trimmed.length < min) return `${label} debe tener al menos ${min} caracteres`
  return null
}

export function validatePassword(value: string | null | undefined, minLength = 6): string | null {
  if (!value) return 'La contraseña es requerida'
  if (value.length < minLength) return `La contraseña debe tener al menos ${minLength} caracteres`
  return null
}

export function validatePasswordStrength(value: string | null | undefined): string | null {
  if (!value) return 'La contraseña es requerida'
  if (value.length < 8)                    return 'La contraseña debe tener al menos 8 caracteres'
  if (!/[A-Z]/.test(value))               return 'Debe incluir al menos una letra mayúscula'
  if (!/[a-z]/.test(value))               return 'Debe incluir al menos una letra minúscula'
  if (!/[0-9]/.test(value))               return 'Debe incluir al menos un número'
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(value))
    return 'Debe incluir al menos un carácter especial (!@#$%...)'
  return null
}

export interface PasswordCriteria {
  length: boolean
  upper: boolean
  lower: boolean
  number: boolean
  special: boolean
}

export function passwordCriteria(value = ''): PasswordCriteria {
  return {
    length:  value.length >= 8,
    upper:   /[A-Z]/.test(value),
    lower:   /[a-z]/.test(value),
    number:  /[0-9]/.test(value),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(value),
  }
}

export function validatePasswordMatch(value: string, confirmation: string): string | null {
  if (value !== confirmation) return 'Las contraseñas no coinciden'
  return null
}

export function validateCheckbox(checked: boolean, message: string): string | null {
  return checked ? null : message
}

export function validateSelect(value: string | null | undefined, label: string): string | null {
  return value?.trim() ? null : `Seleccione ${label}`
}
