const { validationError } = require('../utils/responseHelper')

function validate(schema) {
  return (req, res, next) => {
    const errors = []

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field]

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} es requerido`)
        continue
      }

      if (value === undefined || value === null) continue

      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push(`${field} debe ser texto`)
      }

      if (rules.type === 'number' && typeof value !== 'number') {
        errors.push(`${field} debe ser un numero`)
      }

      if (rules.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push(`${field} debe ser un email valido`)
      }

      if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        errors.push(`${field} debe tener al menos ${rules.minLength} caracteres`)
      }

      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        errors.push(`${field} debe tener maximo ${rules.maxLength} caracteres`)
      }

      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} debe ser uno de: ${rules.enum.join(', ')}`)
      }
    }

    if (errors.length > 0) {
      return validationError(res, 'Errores de validacion', errors)
    }

    next()
  }
}

module.exports = { validate }
