const express = require('express')
const router = express.Router()
const electionController = require('../controllers/electionController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')
const { validate } = require('../middleware/validate')

router.use(authenticate, authorize('admin', 'admin_master'))

// CRUD
router.get('/', electionController.getAll)
router.get('/:id', electionController.getById)

router.post('/', validate({
  title: { required: true, type: 'string', minLength: 2 },
  organization_id: { required: true, type: 'string' },
  start_at: { required: true, type: 'string' },
  end_at: { required: true, type: 'string' }
}), electionController.create)

router.put('/:id', electionController.update)
router.delete('/:id', electionController.remove)

// Acciones
router.post('/:id/duplicate', electionController.duplicate)
router.put('/:id/open', electionController.open)
router.put('/:id/close', electionController.close)
router.put('/:id/reopen', electionController.reopen)

// Reportes
router.get('/:id/results', electionController.getResults)
router.get('/:id/validate', electionController.getValidation)

module.exports = router
