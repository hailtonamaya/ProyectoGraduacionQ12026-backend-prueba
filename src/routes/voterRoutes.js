const express = require('express')
const router = express.Router()
const voterController = require('../controllers/voterController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')
const { validate } = require('../middleware/validate')

router.use(authenticate, authorize('admin', 'admin_master'))

// --- Perfiles de votantes ---
router.get('/profiles', voterController.getAllProfiles)
router.get('/profiles/:id', voterController.getProfileById)

router.post('/profiles', validate({
  full_name: { required: true, type: 'string', minLength: 2 },
  institutional_id: { required: true, type: 'string' },
  email: { required: true, type: 'email' },
  password: { required: true, type: 'string', minLength: 6 },
  organization_id: { required: true, type: 'string' }
}), voterController.createProfile)

router.put('/profiles/:id', voterController.updateProfile)
router.delete('/profiles/:id', voterController.removeProfile)

// --- Habilitacion de votantes por eleccion ---
router.get('/election/:electionId', voterController.getByElection)

router.post('/election/:electionId', validate({
  voter_id: { required: true, type: 'string' }
}), voterController.enableVoter)

router.post('/election/:electionId/bulk', voterController.bulkEnableVoters)

router.delete('/:id', voterController.disableVoter)

module.exports = router
