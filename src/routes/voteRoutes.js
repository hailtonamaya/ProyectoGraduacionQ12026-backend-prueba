const express = require('express')
const router = express.Router()
const voteController = require('../controllers/voteController')
const { authenticateVoter } = require('../middleware/auth')

router.use(authenticateVoter)

// Ver elecciones disponibles
router.get('/elections', voteController.getMyElections)

// Ver boleta (posiciones + candidatos)
router.get('/elections/:electionId/ballot', voteController.getBallot)

// Emitir voto
router.post('/elections/:electionId/cast', voteController.castVote)

// Estado del voto
router.get('/elections/:electionId/status', voteController.getStatus)

module.exports = router
