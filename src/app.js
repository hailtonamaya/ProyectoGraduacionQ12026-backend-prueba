const express = require('express')
const cors = require('cors')

const candidateRoutes = require('./routes/candidateRoutes')
const errorHandler = require('./middleware/errorHandler')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api', candidateRoutes)

app.use(errorHandler)

module.exports = app