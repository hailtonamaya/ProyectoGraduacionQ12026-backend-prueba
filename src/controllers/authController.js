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
    const { email, voting_code } = req.body
    const result = await authService.loginVoter(email, voting_code)
    return success(res, result, 'Login exitoso')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function getProfile(req, res, next) {
  try {
    const data = await authService.getProfile(req.user.id)
    return success(res, data)
  } catch (err) {
    next(err)
  }
}

async function updateProfile(req, res, next) {
  try {
    const data = await authService.updateProfile(req.user.id, req.body)
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

module.exports = { loginAdmin, loginVoter, getProfile, updateProfile, changePassword }
