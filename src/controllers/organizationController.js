const organizationService = require('../services/organizationService')
const { success, created, error } = require('../utils/responseHelper')

async function getAll(req, res, next) {
  try {
    const data = await organizationService.getAll()
    return success(res, data)
  } catch (err) {
    next(err)
  }
}

async function getById(req, res, next) {
  try {
    const data = await organizationService.getById(req.params.id)
    return success(res, data)
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const data = await organizationService.create(req.body)
    return created(res, data)
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const data = await organizationService.update(req.params.id, req.body)
    return success(res, data, 'Organizacion actualizada')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    await organizationService.remove(req.params.id)
    return success(res, null, 'Organizacion eliminada')
  } catch (err) {
    next(err)
  }
}

module.exports = { getAll, getById, create, update, remove }
