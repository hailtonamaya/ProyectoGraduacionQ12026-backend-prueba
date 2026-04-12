const express = require('express')
const router = express.Router()
const voteController = require('../controllers/voteController')
const { authenticateVoter } = require('../middleware/auth')

router.use(authenticateVoter)

router.get('/elections', voteController.getMyElections)
router.get('/elections/:electionId/ballot', voteController.getBallot)
router.post('/elections/:electionId/cast', voteController.castVote)
router.get('/elections/:electionId/status', voteController.getStatus)

module.exports = router
