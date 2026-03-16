const organizationService = require('../services/organizationService')

async function getOrganizations(req, res, next) {
    try {
        const organizations = await organizationService.getOrganizations()
        res.json(organizations)
    } catch (error) {
        next(error)
    }
}

module.exports = {
    getOrganizations
}