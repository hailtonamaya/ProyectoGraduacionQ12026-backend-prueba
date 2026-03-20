const express = require('express')
const router = express.Router()
const careerController = require('../controllers/careerController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')
const { validate } = require('../middleware/validate')

router.get('/', authenticate, careerController.getAll)
router.get('/:id', authenticate, careerController.getById)

router.post('/', authenticate, authorize('admin_master'), validate({
  name: { required: true, type: 'string', minLength: 2 },
  campus_id: { required: true, type: 'string' }
}), careerController.create)

router.put('/:id', authenticate, authorize('admin_master'), careerController.update)
router.delete('/:id', authenticate, authorize('admin_master'), careerController.remove)

module.exports = router
