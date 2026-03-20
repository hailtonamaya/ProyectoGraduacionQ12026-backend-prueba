const express = require('express')
const router = express.Router()
const electionController = require('../controllers/electionController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')
const { validate } = require('../middleware/validate')

// Todas las rutas requieren auth de admin
router.use(authenticate, authorize('admin', 'admin_master'))

// CRUD
router.get('/', electionController.getAll)
router.get('/:id', electionController.getById)

router.post('/', validate({
  name: { required: true, type: 'string', minLength: 2 }
}), electionController.create)

router.put('/:id', electionController.update)
router.delete('/:id', electionController.remove)

// Acciones especiales
router.post('/:id/duplicate', electionController.duplicate)
router.put('/:id/activate', electionController.activate)
router.put('/:id/close', electionController.close)
router.put('/:id/archive', electionController.archive)
router.put('/:id/unarchive', electionController.unarchive)

// Resultados y validacion
router.get('/:id/results', electionController.getResults)
router.get('/:id/validate', electionController.getValidation)

module.exports = router
