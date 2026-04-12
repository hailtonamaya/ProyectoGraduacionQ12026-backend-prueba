const express = require('express')
const router = express.Router()
const adminController = require('../controllers/adminController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')
const { validate } = require('../middleware/validate')

router.use(authenticate, authorize('admin_master'))

router.get('/', adminController.getAll)
router.get('/:id', adminController.getById)

router.post('/', validate({
  email: { required: true, type: 'email' },
  password: { required: true, type: 'string', minLength: 6 },
  full_name: { required: true, type: 'string', minLength: 2 },
  role: { required: false, enum: ['admin', 'admin_master'] }
}), adminController.create)

router.put('/:id', adminController.update)
router.put('/:id/deactivate', adminController.deactivate)
router.delete('/:id', adminController.remove)

module.exports = router
