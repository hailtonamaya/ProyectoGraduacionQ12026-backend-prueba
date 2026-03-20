const express = require('express')
const router = express.Router()
const campusController = require('../controllers/campusController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')
const { validate } = require('../middleware/validate')

// Lectura abierta para admins autenticados
router.get('/', authenticate, campusController.getAll)
router.get('/:id', authenticate, campusController.getById)

// Solo admin_master puede crear/editar/eliminar
router.post('/', authenticate, authorize('admin_master'), validate({
  name: { required: true, type: 'string', minLength: 2 }
}), campusController.create)

router.put('/:id', authenticate, authorize('admin_master'), campusController.update)
router.delete('/:id', authenticate, authorize('admin_master'), campusController.remove)

module.exports = router
