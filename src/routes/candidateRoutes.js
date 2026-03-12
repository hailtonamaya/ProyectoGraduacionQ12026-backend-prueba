const express = require('express')
const router = express.Router()
const candidateController = require('../controllers/candidateController')

router.get('/candidates', candidateController.getCandidates)
router.get('/candidates-in-position', candidateController.getCandidatesInPosition)

module.exports = router