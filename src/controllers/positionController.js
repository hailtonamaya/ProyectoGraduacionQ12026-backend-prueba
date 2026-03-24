const positionService = require('../services/positionService')
const { success, created, error } = require('../utils/responseHelper')

async function getAll(req, res, next) {
  try {
    const data = await positionService.getAllByElection(req.params.electionId)
    return success(res, data)
  } catch (err) {
    next(err)
  }
}

async function getById(req, res, next) {
  try {
    const data = await positionService.getById(req.params.id)
    return success(res, data)
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const data = await positionService.create(req.params.electionId, req.body)
    return created(res, data)
  } catch (err) {
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const data = await positionService.update(req.params.id, req.body)
    return success(res, data, 'Cargo actualizado')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    await positionService.remove(req.params.id)
    return success(res, null, 'Cargo eliminado')
  } catch (err) {
    next(err)
  }
}

async function addCandidate(req, res, next) {
  try {
    const data = await positionService.addCandidate(req.params.positionId, req.body.candidate_id)
    return created(res, data, 'Candidato asignado al cargo')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function removeCandidate(req, res, next) {
  try {
    await positionService.removeCandidate(req.params.cipId)
    return success(res, null, 'Candidato removido del cargo')
  } catch (err) {
    next(err)
  }
}

module.exports = { getAll, getById, create, update, remove, addCandidate, removeCandidate }
