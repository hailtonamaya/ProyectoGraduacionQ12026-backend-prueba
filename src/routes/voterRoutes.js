const express = require('express')
const router = express.Router()
const voterController = require('../controllers/voterController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')
const { validate } = require('../middleware/validate')

router.use(authenticate, authorize('admin', 'admin_master'))

// Votantes por eleccion
router.get('/election/:electionId', voterController.getAll)
router.get('/:id', voterController.getById)

router.post('/election/:electionId', validate({
  full_name: { required: true, type: 'string', minLength: 2 },
  account_number: { required: true, type: 'string' },
  email: { required: true, type: 'email' }
}), voterController.create)

// Importar votantes en lote
router.post('/election/:electionId/import', voterController.bulkCreate)

router.put('/:id', voterController.update)
router.delete('/:id', voterController.remove)

module.exports = router
