const electionService = require('../services/electionService')
const { success, created, error } = require('../utils/responseHelper')

async function getAll(req, res, next) {
  try {
    const { status, search, organization_id } = req.query
    const data = await electionService.getAll({ status, search, organization_id })
    return success(res, data)
  } catch (err) {
    next(err)
  }
}

async function getById(req, res, next) {
  try {
    const data = await electionService.getById(req.params.id)
    return success(res, data)
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const data = await electionService.create(req.body)
    return created(res, data)
  } catch (err) {
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const data = await electionService.update(req.params.id, req.body)
    return success(res, data, 'Eleccion actualizada')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    await electionService.remove(req.params.id)
    return success(res, null, 'Eleccion eliminada')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function duplicate(req, res, next) {
  try {
    const data = await electionService.duplicate(req.params.id)
    return created(res, data, 'Eleccion duplicada')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function open(req, res, next) {
  try {
    const data = await electionService.changeStatus(req.params.id, 'open')
    return success(res, data, 'Eleccion abierta')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function close(req, res, next) {
  try {
    const data = await electionService.changeStatus(req.params.id, 'closed')
    return success(res, data, 'Eleccion cerrada')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function reopen(req, res, next) {
  try {
    const data = await electionService.changeStatus(req.params.id, 'draft')
    return success(res, data, 'Eleccion reabierta como borrador')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function getResults(req, res, next) {
  try {
    const data = await electionService.getResults(req.params.id)
    return success(res, data)
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function getValidation(req, res, next) {
  try {
    const data = await electionService.getValidation(req.params.id)
    return success(res, data)
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

module.exports = {
  getAll, getById, create, update, remove, duplicate,
  open, close, reopen, getResults, getValidation
}
