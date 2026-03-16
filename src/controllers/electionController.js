const electionService = require('../services/electionService')

async function getElections(req, res, next) {
    try {
        const elections = await electionService.getElections()
        res.json(elections)
    } catch (error) {
        next(error)
    }
}

module.exports = {
    getElections
}