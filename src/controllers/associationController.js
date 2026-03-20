const associationService = require('../services/associationService')
const { success, created, error } = require('../utils/responseHelper')

async function getAll(req, res, next) {
  try {
    const data = await associationService.getAllByElection(req.params.electionId)
    return success(res, data)
  } catch (err) {
    next(err)
  }
}

async function getById(req, res, next) {
  try {
    const data = await associationService.getById(req.params.id)
    return success(res, data)
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const data = await associationService.create(req.params.electionId, req.body)
    return created(res, data)
  } catch (err) {
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const data = await associationService.update(req.params.id, req.body)
    return success(res, data, 'Asociacion actualizada')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    await associationService.remove(req.params.id)
    return success(res, null, 'Asociacion eliminada')
  } catch (err) {
    next(err)
  }
}

module.exports = { getAll, getById, create, update, remove }
