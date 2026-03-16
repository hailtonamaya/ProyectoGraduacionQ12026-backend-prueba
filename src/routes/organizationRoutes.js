const express = require('express')
const router = express.Router()
const organizationController = require('../controllers/organizationController')

router.get('/get-organizations', organizationController.getOrganizations)

module.exports = router