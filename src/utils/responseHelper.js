function success(res, data, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  })
}

function created(res, data, message = 'Recurso creado exitosamente') {
  return success(res, data, message, 201)
}

function error(res, message = 'Error interno del servidor', statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null
  })
}

function validationError(res, message = 'Datos invalidos', errors = []) {
  return res.status(400).json({
    success: false,
    message,
    errors
  })
}

function notFound(res, message = 'Recurso no encontrado') {
  return error(res, message, 404)
}

function unauthorized(res, message = 'No autorizado') {
  return error(res, message, 401)
}

function forbidden(res, message = 'No tiene permisos para esta accion') {
  return error(res, message, 403)
}

module.exports = { success, created, error, validationError, notFound, unauthorized, forbidden }
