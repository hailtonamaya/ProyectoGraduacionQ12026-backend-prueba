const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/authRoutes')
const adminRoutes = require('./routes/adminRoutes')
const campusRoutes = require('./routes/campusRoutes')
const careerRoutes = require('./routes/careerRoutes')
const electionRoutes = require('./routes/electionRoutes')
const associationRoutes = require('./routes/associationRoutes')
const candidateRoutes = require('./routes/candidateRoutes')
const voterRoutes = require('./routes/voterRoutes')
const voteRoutes = require('./routes/voteRoutes')
const errorHandler = require('./middleware/errorHandler')

const app = express()

app.use(cors())
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Rutas
app.use('/api/auth', authRoutes)
app.use('/api/admins', adminRoutes)
app.use('/api/campus', campusRoutes)
app.use('/api/careers', careerRoutes)
app.use('/api/elections', electionRoutes)
app.use('/api/associations', associationRoutes)
app.use('/api/candidates', candidateRoutes)
app.use('/api/voters', voterRoutes)
app.use('/api/vote', voteRoutes)

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' })
})

app.use(errorHandler)

module.exports = app
