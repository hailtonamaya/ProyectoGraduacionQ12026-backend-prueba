const jwt = require('jsonwebtoken')
const { unauthorized } = require('../utils/responseHelper')

function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return unauthorized(res, 'Token de acceso requerido')
  }

  const token = header.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return unauthorized(res, 'Token invalido o expirado')
  }
}

function authenticateVoter(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return unauthorized(res, 'Token de acceso requerido')
  }

  const token = header.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.type !== 'voter') {
      return unauthorized(res, 'Acceso solo para votantes')
    }
    req.voter = decoded
    next()
  } catch (err) {
    return unauthorized(res, 'Token invalido o expirado')
  }
}

module.exports = { authenticate, authenticateVoter }
