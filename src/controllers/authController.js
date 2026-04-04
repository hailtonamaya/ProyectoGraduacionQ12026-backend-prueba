const authService = require('../services/authService')
const { success, error } = require('../utils/responseHelper')

async function loginAdmin(req, res, next) {
  try {
    const { email, password } = req.body
    const result = await authService.loginAdmin(email, password)
    return success(res, result, 'Login exitoso')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function loginVoter(req, res, next) {
  try {
    const { email, password } = req.body
    const result = await authService.loginVoter(email, password)
    return success(res, result, 'Login exitoso')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function getProfile(req, res, next) {
  try {
    const data = await authService.getAdminProfile(req.user.id)
    return success(res, data)
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function updateProfile(req, res, next) {
  try {
    const data = await authService.updateAdminProfile(req.user.id, req.body)
    return success(res, data, 'Perfil actualizado')
  } catch (err) {
    next(err)
  }
}

async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body
    await authService.changePassword(req.user.id, current_password, new_password)
    return success(res, null, 'Contrasena actualizada')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function sendOtp(req, res, next) {
  try {
    const { email } = req.body
    const result = await authService.sendVoterOtp(email)
    return success(res, result, 'Codigo enviado al correo')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { email, token } = req.body
    const result = await authService.verifyVoterOtp(email, token)
    return success(res, result, 'Login exitoso')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

module.exports = { loginAdmin, loginVoter, getProfile, updateProfile, changePassword, sendOtp, verifyOtp }
