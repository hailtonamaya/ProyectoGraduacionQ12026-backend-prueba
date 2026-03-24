const voteService = require('../services/voteService')
const { success, error } = require('../utils/responseHelper')

async function getMyElections(req, res, next) {
  try {
    const data = await voteService.getElectionForVoter(req.voter.id)
    return success(res, data)
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function getBallot(req, res, next) {
  try {
    const data = await voteService.getElectionBallot(req.params.electionId, req.voter.id)
    return success(res, data)
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function castVote(req, res, next) {
  try {
    const { votes } = req.body
    const data = await voteService.castVote(req.params.electionId, req.voter.id, votes)
    return success(res, data, 'Voto registrado exitosamente')
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

async function getStatus(req, res, next) {
  try {
    const data = await voteService.getVoterStatus(req.params.electionId, req.voter.id)
    return success(res, data)
  } catch (err) {
    if (err.status) return error(res, err.message, err.status)
    next(err)
  }
}

module.exports = { getMyElections, getBallot, castVote, getStatus }
