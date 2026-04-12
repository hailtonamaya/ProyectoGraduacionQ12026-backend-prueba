const express = require('express')
const router = express.Router()
const positionController = require('../controllers/positionController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')
const { validate } = require('../middleware/validate')

router.use(authenticate, authorize('admin', 'admin_master'))

router.get('/election/:electionId', positionController.getAll)
router.get('/:id', positionController.getById)

router.post('/election/:electionId', validate({
  name: { required: true, type: 'string', minLength: 2 }
}), positionController.create)

router.put('/:id', positionController.update)
router.delete('/:id', positionController.remove)

router.post('/:positionId/candidates', validate({
  candidate_id: { required: true, type: 'string' }
}), positionController.addCandidate)

router.delete('/candidates/:cipId', positionController.removeCandidate)

module.exports = router
