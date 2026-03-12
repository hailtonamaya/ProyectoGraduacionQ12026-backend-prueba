function errorHandler(err, req, res, next) {
  console.error(err)

  res.status(500).json({
    error: true,
    message: err.message || "Internal Server Error"
  })
}

module.exports = errorHandler