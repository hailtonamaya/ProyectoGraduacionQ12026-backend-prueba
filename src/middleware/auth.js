const jwt = require('jsonwebtoken')
const { supabase } = require('../config/supabase')
const { unauthorized } = require('../utils/responseHelper')

// Middleware para admins (JWT custom)
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

// Middleware para votantes (Supabase Auth JWT)
async function authenticateVoter(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return unauthorized(res, 'Token de acceso requerido')
  }

  const token = header.split(' ')[1]

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return unauthorized(res, 'Token invalido o expirado')
    }

    req.voter = { id: user.id, email: user.email }
    next()
  } catch (err) {
    return unauthorized(res, 'Token invalido o expirado')
  }
}

module.exports = { authenticate, authenticateVoter }
