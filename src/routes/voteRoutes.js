const express = require('express')
const router = express.Router()
const voteController = require('../controllers/voteController')
const { authenticateVoter } = require('../middleware/auth')

// Todas las rutas requieren auth de votante
router.use(authenticateVoter)

// Obtener info de la eleccion (asociaciones y candidatos)
router.get('/election', voteController.getElectionInfo)

// Estado del votante
router.get('/status', voteController.getStatus)

// Emitir voto (association_id: null = voto en blanco)
router.post('/cast', voteController.castVote)

module.exports = router
