const express = require('express')
const router = express.Router()
const organizationController = require('../controllers/organizationController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')
const { validate } = require('../middleware/validate')

router.use(authenticate)

router.get('/', organizationController.getAll)
router.get('/:id', organizationController.getById)

router.post('/', authorize('admin_master', 'admin'), validate({
  name: { required: true, type: 'string', minLength: 2 },
  code: { required: true, type: 'string', minLength: 2, maxLength: 20 }
}), organizationController.create)

router.put('/:id', authorize('admin_master', 'admin'), organizationController.update)
router.delete('/:id', authorize('admin_master'), organizationController.remove)

module.exports = router
