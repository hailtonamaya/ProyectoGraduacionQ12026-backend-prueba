const express = require('express')
const cors = require('cors')

const candidateRoutes = require('./routes/candidateRoutes')
const electionRoutes = require('./routes/electionRoutes')
const organizationRoutes = require('./routes/organizationRoutes')
const errorHandler = require('./middleware/errorHandler')


const app = express()

app.use(cors())
app.use(express.json())

app.use('/candidates', candidateRoutes)
app.use('/elections', electionRoutes)
app.use('/organizations', organizationRoutes)

app.use(errorHandler)

module.exports = app