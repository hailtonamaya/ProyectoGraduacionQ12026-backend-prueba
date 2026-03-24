const express = require('express')
const router = express.Router()
const candidateController = require('../controllers/candidateController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')
const { validate } = require('../middleware/validate')

router.use(authenticate, authorize('admin', 'admin_master'))

router.get('/', candidateController.getAll)
router.get('/:id', candidateController.getById)

router.post('/', validate({
  full_name: { required: true, type: 'string', minLength: 2 }
}), candidateController.create)

router.post('/import', candidateController.bulkCreate)

router.put('/:id', candidateController.update)
router.delete('/:id', candidateController.remove)

module.exports = router
