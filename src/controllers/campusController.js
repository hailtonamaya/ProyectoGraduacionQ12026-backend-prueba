const campusService = require('../services/campusService')
const { success, created, error } = require('../utils/responseHelper')

async function getAll(req, res, next) {
  try {
    const data = await campusService.getAll()
    return success(res, data)
  } catch (err) {
    next(err)
  }
}

async function getById(req, res, next) {
  try {
    const data = await campusService.getById(req.params.id)
    return success(res, data)
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const data = await campusService.create(req.body)
    return created(res, data)
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const data = await campusService.update(req.params.id, req.body)
    return success(res, data, 'Campus actualizado')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    await campusService.remove(req.params.id)
    return success(res, null, 'Campus eliminado')
  } catch (err) {
    next(err)
  }
}

module.exports = { getAll, getById, create, update, remove }
