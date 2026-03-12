const candidateService = require('../services/candidateService')

async function getCandidates(req, res, next) {
  try {
    const candidates = await candidateService.getCandidates()
    res.json(candidates)
  } catch (error) {
    next(error)
  }
}

async function getCandidatesInPosition(req, res, next) {
  try {
    const candidates = await candidateService.getCandidatesInPosition()
    res.json(candidates)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getCandidates,
  getCandidatesInPosition

}