const express = require('express')
const router = express.Router()
const faceAuthController = require('./faceAuthController')
const { validate } = require('../middleware/validate')

router.post('/face/register', validate({
  email: { required: true, type: 'email' },
  full_name: { required: true, type: 'string', minLength: 2 },
  descriptor: { required: true }
}), faceAuthController.registerFace)

router.post('/face/verify', validate({
  email: { required: true, type: 'email' },
  descriptor: { required: true }
}), faceAuthController.verifyFace)

module.exports = router
