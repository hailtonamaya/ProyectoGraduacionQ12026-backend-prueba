const careerService = require('../services/careerService')
const { success, created, error } = require('../utils/responseHelper')

async function getAll(req, res, next) {
  try {
    const data = await careerService.getAll(req.query.campus_id)
    return success(res, data)
  } catch (err) {
    next(err)
  }
}

async function getById(req, res, next) {
  try {
    const data = await careerService.getById(req.params.id)
    return success(res, data)
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const data = await careerService.create(req.body)
    return created(res, data)
  } catch (err) {
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const data = await careerService.update(req.params.id, req.body)
    return success(res, data, 'Carrera actualizada')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    await careerService.remove(req.params.id)
    return success(res, null, 'Carrera eliminada')
  } catch (err) {
    next(err)
  }
}

module.exports = { getAll, getById, create, update, remove }
