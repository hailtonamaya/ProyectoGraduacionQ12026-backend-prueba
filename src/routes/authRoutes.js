const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')
const { validate } = require('../middleware/validate')

// Login admin
router.post('/login', validate({
  email: { required: true, type: 'email' },
  password: { required: true, type: 'string', minLength: 6 }
}), authController.loginAdmin)

// Login votante (Supabase Auth)
router.post('/login-voter', validate({
  email: { required: true, type: 'email' },
  password: { required: true, type: 'string' }
}), authController.loginVoter)

// Perfil admin (requiere auth)
router.get('/profile', authenticate, authController.getProfile)
router.put('/profile', authenticate, authController.updateProfile)
router.put('/change-password', authenticate, validate({
  current_password: { required: true, type: 'string' },
  new_password: { required: true, type: 'string', minLength: 6 }
}), authController.changePassword)

module.exports = router
