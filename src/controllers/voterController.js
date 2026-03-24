const voterService = require('../services/voterService')
const { success, created, error } = require('../utils/responseHelper')

// --- Voter Profiles ---

async function getAllProfiles(req, res, next) {
  try {
    const { organization_id, search } = req.query
    const data = await voterService.getAllProfiles({ organization_id, search })
    return success(res, data)
  } catch (err) {
    next(err)
  }
}

async function getProfileById(req, res, next) {
  try {
    const data = await voterService.getProfileById(req.params.id)
    return success(res, data)
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function createProfile(req, res, next) {
  try {
    const data = await voterService.createProfile(req.body)
    return created(res, data)
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function updateProfile(req, res, next) {
  try {
    const data = await voterService.updateProfile(req.params.id, req.body)
    return success(res, data, 'Votante actualizado')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function removeProfile(req, res, next) {
  try {
    await voterService.removeProfile(req.params.id)
    return success(res, null, 'Votante eliminado')
  } catch (err) {
    next(err)
  }
}

// --- Election Voters ---

async function getByElection(req, res, next) {
  try {
    const data = await voterService.getByElection(req.params.electionId, { search: req.query.search })
    return success(res, data)
  } catch (err) {
    next(err)
  }
}

async function enableVoter(req, res, next) {
  try {
    const data = await voterService.enableVoter(req.params.electionId, req.body.voter_id)
    return created(res, data, 'Votante habilitado')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function bulkEnableVoters(req, res, next) {
  try {
    const data = await voterService.bulkEnableVoters(req.params.electionId, req.body.voter_ids)
    return created(res, data, 'Votantes habilitados')
  } catch (err) {
    next(err)
  }
}

async function disableVoter(req, res, next) {
  try {
    await voterService.disableVoter(req.params.id)
    return success(res, null, 'Votante deshabilitado')
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getAllProfiles, getProfileById, createProfile, updateProfile, removeProfile,
  getByElection, enableVoter, bulkEnableVoters, disableVoter
}
