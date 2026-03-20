const voteService = require('../services/voteService')
const { success, error } = require('../utils/responseHelper')

async function castVote(req, res, next) {
  try {
    const { association_id } = req.body
    const data = await voteService.castVote(req.voter.id, req.voter.election_id, association_id || null)
    return success(res, data, 'Voto registrado exitosamente')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function getStatus(req, res, next) {
  try {
    const data = await voteService.getVoterStatus(req.voter.id, req.voter.election_id)
    return success(res, data)
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function getElectionInfo(req, res, next) {
  try {
    const data = await voteService.getElectionForVoter(req.voter.election_id)
    return success(res, data)
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

module.exports = { castVote, getStatus, getElectionInfo }
