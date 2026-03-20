const express = require('express')
const router = express.Router()
const associationController = require('../controllers/associationController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')
const { validate } = require('../middleware/validate')

router.use(authenticate, authorize('admin', 'admin_master'))

// Asociaciones por eleccion
router.get('/election/:electionId', associationController.getAll)
router.get('/:id', associationController.getById)

router.post('/election/:electionId', validate({
  name: { required: true, type: 'string', minLength: 2 }
}), associationController.create)

router.put('/:id', associationController.update)
router.delete('/:id', associationController.remove)

module.exports = router
