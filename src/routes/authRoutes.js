const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')
const { validate } = require('../middleware/validate')

router.post('/login', validate({
  email: { required: true, type: 'email' },
  password: { required: true, type: 'string', minLength: 6 }
}), authController.loginAdmin)

router.post('/login-voter', validate({
  email: { required: true, type: 'email' },
  password: { required: true, type: 'string' }
}), authController.loginVoter)

router.post('/voter/send-otp', validate({
  email: { required: true, type: 'email' }
}), authController.sendOtp)

router.post('/voter/verify-otp', validate({
  email: { required: true, type: 'email' },
  token: { required: true, type: 'string', minLength: 6 }
}), authController.verifyOtp)

router.get('/profile', authenticate, authController.getProfile)
router.put('/profile', authenticate, authController.updateProfile)
router.put('/change-password', authenticate, validate({
  current_password: { required: true, type: 'string' },
  new_password: { required: true, type: 'string', minLength: 6 }
}), authController.changePassword)

module.exports = router
