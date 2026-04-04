const express = require('express')
const cors = require('cors')
const path = require('path')

const authRoutes = require('./routes/authRoutes')
const adminRoutes = require('./routes/adminRoutes')
const organizationRoutes = require('./routes/organizationRoutes')
const electionRoutes = require('./routes/electionRoutes')
const positionRoutes = require('./routes/positionRoutes')
const candidateRoutes = require('./routes/candidateRoutes')
const voterRoutes = require('./routes/voterRoutes')
const voteRoutes = require('./routes/voteRoutes')
const faceAuthRoutes = require('./ia/faceAuthRoutes')
const errorHandler = require('./middleware/errorHandler')

const app = express()

app.use(cors())
app.use(express.json({ limit: '5mb' }))

// Archivos estaticos (UI de prueba)
app.use(express.static(path.join(__dirname, '..', 'public')))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Rutas
app.use('/api/auth', authRoutes)
app.use('/api/admins', adminRoutes)
app.use('/api/organizations', organizationRoutes)
app.use('/api/elections', electionRoutes)
app.use('/api/positions', positionRoutes)
app.use('/api/candidates', candidateRoutes)
app.use('/api/voters', voterRoutes)
app.use('/api/vote', voteRoutes)

// Rutas IA - Reconocimiento facial
app.use('/api/ia', faceAuthRoutes)

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' })
})

app.use(errorHandler)

module.exports = app
