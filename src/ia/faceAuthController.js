const faceRecognitionService = require('./faceRecognitionService')
const { success, error } = require('../utils/responseHelper')

async function registerFace(req, res, next) {
  try {
    const { email, full_name, descriptor } = req.body
    const result = await faceRecognitionService.registerFace(email, full_name, descriptor)
    return success(res, result, 'Rostro registrado exitosamente')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function verifyFace(req, res, next) {
  try {
    const { email, descriptor } = req.body
    const result = await faceRecognitionService.verifyFace(email, descriptor)
    const message = result.match ? 'Autenticacion facial exitosa' : 'Rostro no coincide'
    return success(res, result, message)
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

module.exports = { registerFace, verifyFace }
