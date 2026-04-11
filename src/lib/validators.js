/**
 * validators.js — Funciones puras de validación de formularios.
 *
 * Principio: cada función tiene una única responsabilidad y
 * devuelve un string con el mensaje de error, o null si es válido.
 * Son independientes del framework — se pueden probar sin React.
 *
 * Uso:
 *   const emailError = validateEmail(form.email)
 *   if (emailError) errors.email = emailError
 */

// RFC-5322 simplificado. Suficiente para validación de UI institucional.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Valida que el campo no esté vacío.
 * @param {string} value
 * @param {string} label — nombre del campo para el mensaje de error
 * @returns {string|null}
 */
export function validateRequired(value, label) {
  return value?.toString().trim() ? null : `${label} es requerido`
}

/**
 * Valida formato de correo electrónico.
 * @param {string} value
 * @returns {string|null}
 */
export function validateEmail(value) {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return 'El correo electrónico es requerido'
  if (!EMAIL_REGEX.test(trimmed)) return 'Ingrese un correo electrónico válido'
  return null
}

/**
 * Valida longitud mínima de un campo de texto.
 * @param {string} value
 * @param {number} min
 * @param {string} label
 * @returns {string|null}
 */
export function validateMinLength(value, min, label) {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return `${label} es requerido`
  if (trimmed.length < min) return `${label} debe tener al menos ${min} caracteres`
  return null
}

/**
 * Valida contraseña con longitud mínima configurable.
 * @param {string} value
 * @param {number} [minLength=6]
 * @returns {string|null}
 */
export function validatePassword(value, minLength = 6) {
  if (!value) return 'La contraseña es requerida'
  if (value.length < minLength) return `La contraseña debe tener al menos ${minLength} caracteres`
  return null
}

/**
 * Valida que dos contraseñas coincidan.
 * @param {string} value
 * @param {string} confirmation
 * @returns {string|null}
 */
export function validatePasswordMatch(value, confirmation) {
  if (value !== confirmation) return 'Las contraseñas no coinciden'
  return null
}

/**
 * Valida que un checkbox esté marcado (ej. aceptar términos).
 * @param {boolean} checked
 * @param {string} message
 * @returns {string|null}
 */
export function validateCheckbox(checked, message) {
  return checked ? null : message
}

/**
 * Valida que se haya seleccionado una opción en un select.
 * @param {string} value
 * @param {string} label
 * @returns {string|null}
 */
export function validateSelect(value, label) {
  return value?.trim() ? null : `Seleccione ${label}`
}
