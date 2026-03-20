const adminService = require('../services/adminService')
const { success, created, error, notFound } = require('../utils/responseHelper')

async function getAll(req, res, next) {
  try {
    const data = await adminService.getAll()
    return success(res, data)
  } catch (err) {
    next(err)
  }
}

async function getById(req, res, next) {
  try {
    const data = await adminService.getById(req.params.id)
    return success(res, data)
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const data = await adminService.create(req.body)
    return created(res, data)
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const data = await adminService.update(req.params.id, req.body)
    return success(res, data, 'Administrador actualizado')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function deactivate(req, res, next) {
  try {
    const data = await adminService.deactivate(req.params.id)
    return success(res, data, 'Administrador desactivado')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    await adminService.remove(req.params.id)
    return success(res, null, 'Administrador eliminado')
  } catch (err) {
    next(err)
  }
}

module.exports = { getAll, getById, create, update, deactivate, remove }
