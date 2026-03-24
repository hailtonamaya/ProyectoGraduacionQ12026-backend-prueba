const candidateService = require('../services/candidateService')
const { success, created, error } = require('../utils/responseHelper')

async function getAll(req, res, next) {
  try {
    const { organization_id, search } = req.query
    const data = await candidateService.getAll({ organization_id, search })
    return success(res, data)
  } catch (err) {
    next(err)
  }
}

async function getById(req, res, next) {
  try {
    const data = await candidateService.getById(req.params.id)
    return success(res, data)
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const data = await candidateService.create(req.body)
    return created(res, data)
  } catch (err) {
    next(err)
  }
}

async function bulkCreate(req, res, next) {
  try {
    const data = await candidateService.bulkCreate(req.body.candidates)
    return created(res, data, 'Candidatos importados')
  } catch (err) {
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const data = await candidateService.update(req.params.id, req.body)
    return success(res, data, 'Candidato actualizado')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    await candidateService.remove(req.params.id)
    return success(res, null, 'Candidato eliminado')
  } catch (err) {
    next(err)
  }
}

module.exports = { getAll, getById, create, bulkCreate, update, remove }
