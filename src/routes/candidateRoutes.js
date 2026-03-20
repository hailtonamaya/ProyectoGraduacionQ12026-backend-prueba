const express = require('express')
const router = express.Router()
const candidateController = require('../controllers/candidateController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')
const { validate } = require('../middleware/validate')

router.use(authenticate, authorize('admin', 'admin_master'))

// Candidatos por asociacion
router.get('/association/:associationId', candidateController.getAll)
router.get('/:id', candidateController.getById)

router.post('/association/:associationId', validate({
  full_name: { required: true, type: 'string', minLength: 2 }
}), candidateController.create)

// Importar candidatos en lote
router.post('/association/:associationId/import', candidateController.bulkCreate)

router.put('/:id', candidateController.update)
router.delete('/:id', candidateController.remove)

module.exports = router
