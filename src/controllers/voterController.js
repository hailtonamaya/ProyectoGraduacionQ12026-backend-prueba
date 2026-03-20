const voterService = require('../services/voterService')
const { success, created, error } = require('../utils/responseHelper')

async function getAll(req, res, next) {
  try {
    const data = await voterService.getAllByElection(req.params.electionId, { search: req.query.search })
    return success(res, data)
  } catch (err) {
    next(err)
  }
}

async function getById(req, res, next) {
  try {
    const data = await voterService.getById(req.params.id)
    return success(res, data)
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const data = await voterService.create(req.params.electionId, req.body)
    return created(res, data)
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function bulkCreate(req, res, next) {
  try {
    const data = await voterService.bulkCreate(req.params.electionId, req.body.voters)
    return created(res, data, 'Votantes importados')
  } catch (err) {
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const data = await voterService.update(req.params.id, req.body)
    return success(res, data, 'Votante actualizado')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    await voterService.remove(req.params.id)
    return success(res, null, 'Votante eliminado')
  } catch (err) {
    next(err)
  }
}

module.exports = { getAll, getById, create, bulkCreate, update, remove }
