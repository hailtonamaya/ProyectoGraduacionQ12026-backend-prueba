const express = require('express')
const router = express.Router()
const electionController = require('../controllers/electionController')

router.get('/get-elections', electionController.getElections)

module.exports = router