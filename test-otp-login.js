require('dotenv').config()
const readline = require('readline')
const app = require('./src/app')

const PORT = 3334
const BASE = `http://localhost:${PORT}/api`

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve))
}

async function req(method, path, body = null, token = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  }
  if (token) opts.headers.Authorization = `Bearer ${token}`
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(`${BASE}${path}`, opts)
  return res.json()
}

async function run() {
  console.log('\n\x1b[36m==========================================\x1b[0m')
  console.log('\x1b[36m  PRUEBA DE LOGIN CON OTP - CORREO UNITEC\x1b[0m')
  console.log('\x1b[36m==========================================\x1b[0m\n')

  // Paso 1: Pedir email
  const email = await ask('\x1b[33mIngresa tu correo institucional (@unitec.edu): \x1b[0m')

  if (!email.endsWith('@unitec.edu')) {
    console.log('\n\x1b[31m[ERROR] Solo se permite correo @unitec.edu\x1b[0m\n')
    rl.close()
    return
  }

  // Paso 2: Enviar OTP
  console.log('\n\x1b[36m[1/3] Enviando codigo al correo...\x1b[0m')
  const sendResult = await req('POST', '/auth/voter/send-otp', { email })

  if (!sendResult.success) {
    console.log(`\x1b[31m[ERROR] ${sendResult.message}\x1b[0m\n`)
    rl.close()
    return
  }

  console.log(`\x1b[32m[OK] ${sendResult.message}\x1b[0m`)
  console.log('\x1b[33m     Revisa tu bandeja de entrada (y spam)\x1b[0m\n')

  // Paso 3: Pedir codigo
  const code = await ask('\x1b[33mIngresa el codigo de 6 digitos: \x1b[0m')

  // Paso 4: Verificar OTP
  console.log('\n\x1b[36m[2/3] Verificando codigo...\x1b[0m')
  const verifyResult = await req('POST', '/auth/voter/verify-otp', {
    email,
    token: code.trim()
  })

  if (!verifyResult.success) {
    console.log(`\x1b[31m[ERROR] ${verifyResult.message}\x1b[0m\n`)
    rl.close()
    return
  }

  console.log('\x1b[32m[OK] Login exitoso!\x1b[0m\n')

  // Paso 5: Mostrar datos
  const data = verifyResult.data
  const token = data.token

  console.log('\x1b[36m[3/3] Resultado:\x1b[0m')
  console.log(`  Email:         ${data.email}`)
  console.log(`  Auth User ID:  ${data.auth_user_id}`)
  console.log(`  Tiene perfil:  ${data.has_profile ? 'SI' : 'NO'}`)
  console.log(`  Token:         ${token.substring(0, 30)}...`)

  if (data.has_profile && data.voter) {
    console.log(`\n\x1b[36m  Datos del votante:\x1b[0m`)
    console.log(`  Nombre:        ${data.voter.full_name}`)
    console.log(`  ID:            ${data.voter.institutional_id}`)
    console.log(`  Organizacion:  ${data.voter.organization?.name || 'N/A'}`)
  } else {
    console.log(`\n\x1b[33m  Este correo aun no tiene perfil de votante.`)
    console.log(`  Un admin debe crear el perfil en /voters/profiles\x1b[0m`)
  }

  // Paso 6: Probar el token consultando elecciones disponibles
  if (data.has_profile) {
    console.log('\n\x1b[36m[EXTRA] Probando token - consultando elecciones disponibles...\x1b[0m')
    const electionsResult = await req('GET', '/vote/elections', null, token)

    if (electionsResult.success) {
      const elections = electionsResult.data?.elections || []
      console.log(`\x1b[32m[OK] Token valido - ${elections.length} eleccion(es) disponible(s)\x1b[0m`)
      for (const e of elections) {
        console.log(`  - ${e.title} (${e.status})`)
      }
    } else {
      console.log(`\x1b[31m[ERROR] ${electionsResult.message}\x1b[0m`)
    }
  }

  console.log('\n\x1b[36m==========================================\x1b[0m')
  console.log('\x1b[36m  PRUEBA FINALIZADA\x1b[0m')
  console.log('\x1b[36m==========================================\x1b[0m\n')

  rl.close()
}

const server = app.listen(PORT, () => {
  console.log(`Servidor de pruebas OTP en puerto ${PORT}`)
  run()
    .catch(e => console.error('Error fatal:', e))
    .finally(() => server.close())
})
