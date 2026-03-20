function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message)

  const statusCode = err.status || 500
  const message = statusCode === 500 ? 'Error interno del servidor' : err.message

  res.status(statusCode).json({
    success: false,
    message
  })
}

module.exports = errorHandler
