require('dotenv').config()
const readline = require('readline')
const app = require('./src/app')

const PORT = 3333
const BASE = `http://localhost:${PORT}/api`

let adminToken = ''
let voterToken = ''

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve))
}

async function req(method, path, body = null, token = adminToken) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  }
  if (token) opts.headers.Authorization = `Bearer ${token}`
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(`${BASE}${path}`, opts)
  return res.json()
}

function printResponse(data) {
  console.log('\n\x1b[36m--- Respuesta ---\x1b[0m')
  console.log(JSON.stringify(data, null, 2))
  console.log()
}

function printMenu(title, options) {
  console.log(`\n\x1b[33m=== ${title} ===\x1b[0m`)
  options.forEach(([key, label]) => {
    console.log(`  \x1b[32m${key}\x1b[0m) ${label}`)
  })
  console.log(`  \x1b[32m0\x1b[0m) Volver`)
}

// ========== AUTH ==========
async function menuAuth() {
  while (true) {
    printMenu('AUTENTICACION', [
      ['1', 'Login Admin'],
      ['2', 'Login Votante'],
      ['3', 'Ver perfil admin'],
      ['4', 'Editar perfil admin'],
      ['5', 'Cambiar contrasena'],
    ])
    const op = await ask('Opcion: ')

    if (op === '0') return
    if (op === '1') {
      const email = await ask('Email: ')
      const password = await ask('Password: ')
      const d = await req('POST', '/auth/login', { email, password }, null)
      printResponse(d)
      if (d.success) {
        adminToken = d.data.token
        console.log('\x1b[32m  Token admin guardado automaticamente.\x1b[0m')
      }
    } else if (op === '2') {
      const email = await ask('Email: ')
      const password = await ask('Password: ')
      const d = await req('POST', '/auth/login-voter', { email, password }, null)
      printResponse(d)
      if (d.success) {
        voterToken = d.data.token
        console.log('\x1b[32m  Token votante guardado automaticamente.\x1b[0m')
      }
    } else if (op === '3') {
      printResponse(await req('GET', '/auth/profile'))
    } else if (op === '4') {
      const full_name = await ask('Nuevo nombre: ')
      printResponse(await req('PUT', '/auth/profile', { full_name }))
    } else if (op === '5') {
      const current_password = await ask('Contrasena actual: ')
      const new_password = await ask('Nueva contrasena: ')
      printResponse(await req('PUT', '/auth/change-password', { current_password, new_password }))
    }
  }
}

// ========== ADMINS ==========
async function menuAdmins() {
  while (true) {
    printMenu('GESTION DE ADMINISTRADORES', [
      ['1', 'Listar administradores'],
      ['2', 'Ver administrador por ID'],
      ['3', 'Crear administrador'],
      ['4', 'Editar administrador'],
      ['5', 'Desactivar administrador'],
      ['6', 'Eliminar administrador'],
    ])
    const op = await ask('Opcion: ')

    if (op === '0') return
    if (op === '1') {
      printResponse(await req('GET', '/admins'))
    } else if (op === '2') {
      const id = await ask('ID: ')
      printResponse(await req('GET', `/admins/${id}`))
    } else if (op === '3') {
      const email = await ask('Email: ')
      const password = await ask('Password: ')
      const full_name = await ask('Nombre completo: ')
      const role = await ask('Rol (admin/admin_master): ') || 'admin'
      printResponse(await req('POST', '/admins', { email, password, full_name, role }))
    } else if (op === '4') {
      const id = await ask('ID del admin: ')
      const full_name = await ask('Nuevo nombre (enter para omitir): ')
      const email = await ask('Nuevo email (enter para omitir): ')
      const body = {}
      if (full_name) body.full_name = full_name
      if (email) body.email = email
      printResponse(await req('PUT', `/admins/${id}`, body))
    } else if (op === '5') {
      const id = await ask('ID del admin: ')
      printResponse(await req('PUT', `/admins/${id}/deactivate`))
    } else if (op === '6') {
      const id = await ask('ID del admin: ')
      printResponse(await req('DELETE', `/admins/${id}`))
    }
  }
}

// ========== ORGANIZACIONES ==========
async function menuOrganizations() {
  while (true) {
    printMenu('ORGANIZACIONES', [
      ['1', 'Listar organizaciones'],
      ['2', 'Ver organizacion por ID'],
      ['3', 'Crear organizacion'],
      ['4', 'Editar organizacion'],
      ['5', 'Eliminar organizacion'],
    ])
    const op = await ask('Opcion: ')

    if (op === '0') return
    if (op === '1') {
      printResponse(await req('GET', '/organizations'))
    } else if (op === '2') {
      const id = await ask('ID: ')
      printResponse(await req('GET', `/organizations/${id}`))
    } else if (op === '3') {
      const name = await ask('Nombre: ')
      const code = await ask('Codigo (ej: ATIC): ')
      printResponse(await req('POST', '/organizations', { name, code }))
    } else if (op === '4') {
      const id = await ask('ID: ')
      const name = await ask('Nuevo nombre (enter para omitir): ')
      const code = await ask('Nuevo codigo (enter para omitir): ')
      const body = {}
      if (name) body.name = name
      if (code) body.code = code
      printResponse(await req('PUT', `/organizations/${id}`, body))
    } else if (op === '5') {
      const id = await ask('ID: ')
      printResponse(await req('DELETE', `/organizations/${id}`))
    }
  }
}

// ========== ELECCIONES ==========
async function menuElections() {
  while (true) {
    printMenu('ELECCIONES', [
      ['1', 'Listar elecciones'],
      ['2', 'Filtrar por status (draft/open/closed)'],
      ['3', 'Buscar por nombre'],
      ['4', 'Ver eleccion por ID'],
      ['5', 'Crear eleccion'],
      ['6', 'Editar eleccion'],
      ['7', 'Duplicar eleccion'],
      ['8', 'Eliminar eleccion'],
      ['9', 'Validar eleccion (Paso 5)'],
      ['10', 'Abrir eleccion'],
      ['11', 'Cerrar eleccion'],
      ['12', 'Reabrir como borrador'],
      ['13', 'Ver resultados'],
    ])
    const op = await ask('Opcion: ')

    if (op === '0') return
    if (op === '1') {
      printResponse(await req('GET', '/elections'))
    } else if (op === '2') {
      const status = await ask('Status (draft/open/closed): ')
      printResponse(await req('GET', `/elections?status=${status}`))
    } else if (op === '3') {
      const search = await ask('Buscar: ')
      printResponse(await req('GET', `/elections?search=${search}`))
    } else if (op === '4') {
      const id = await ask('ID: ')
      printResponse(await req('GET', `/elections/${id}`))
    } else if (op === '5') {
      const title = await ask('Titulo: ')
      const description = await ask('Descripcion: ')
      const organization_id = await ask('ID de organizacion: ')
      const start_at = await ask('Fecha inicio (YYYY-MM-DDTHH:mm:ssZ): ')
      const end_at = await ask('Fecha fin (YYYY-MM-DDTHH:mm:ssZ): ')
      printResponse(await req('POST', '/elections', { title, description, organization_id, start_at, end_at }))
    } else if (op === '6') {
      const id = await ask('ID de eleccion: ')
      const title = await ask('Nuevo titulo (enter para omitir): ')
      const description = await ask('Nueva descripcion (enter para omitir): ')
      const body = {}
      if (title) body.title = title
      if (description) body.description = description
      printResponse(await req('PUT', `/elections/${id}`, body))
    } else if (op === '7') {
      const id = await ask('ID de eleccion a duplicar: ')
      printResponse(await req('POST', `/elections/${id}/duplicate`))
    } else if (op === '8') {
      const id = await ask('ID de eleccion: ')
      printResponse(await req('DELETE', `/elections/${id}`))
    } else if (op === '9') {
      const id = await ask('ID de eleccion: ')
      printResponse(await req('GET', `/elections/${id}/validate`))
    } else if (op === '10') {
      const id = await ask('ID de eleccion: ')
      printResponse(await req('PUT', `/elections/${id}/open`))
    } else if (op === '11') {
      const id = await ask('ID de eleccion: ')
      printResponse(await req('PUT', `/elections/${id}/close`))
    } else if (op === '12') {
      const id = await ask('ID de eleccion: ')
      printResponse(await req('PUT', `/elections/${id}/reopen`))
    } else if (op === '13') {
      const id = await ask('ID de eleccion: ')
      printResponse(await req('GET', `/elections/${id}/results`))
    }
  }
}

// ========== POSICIONES / CARGOS ==========
async function menuPositions() {
  while (true) {
    printMenu('CARGOS / POSICIONES', [
      ['1', 'Listar cargos de una eleccion'],
      ['2', 'Ver cargo por ID'],
      ['3', 'Crear cargo'],
      ['4', 'Editar cargo'],
      ['5', 'Eliminar cargo'],
      ['6', 'Asignar candidato a cargo'],
      ['7', 'Remover candidato de cargo'],
    ])
    const op = await ask('Opcion: ')

    if (op === '0') return
    if (op === '1') {
      const electionId = await ask('ID de eleccion: ')
      printResponse(await req('GET', `/positions/election/${electionId}`))
    } else if (op === '2') {
      const id = await ask('ID del cargo: ')
      printResponse(await req('GET', `/positions/${id}`))
    } else if (op === '3') {
      const electionId = await ask('ID de eleccion: ')
      const name = await ask('Nombre del cargo (ej: Presidente): ')
      const min_votes = parseInt(await ask('Min votos (default 1): ') || '1')
      const max_votes = parseInt(await ask('Max votos (default 1): ') || '1')
      const allows_blank = (await ask('Permite voto en blanco? (s/n, default s): ') || 's') === 's'
      const position_order = parseInt(await ask('Orden (default 1): ') || '1')
      printResponse(await req('POST', `/positions/election/${electionId}`, {
        name, min_votes, max_votes, allows_blank, position_order
      }))
    } else if (op === '4') {
      const id = await ask('ID del cargo: ')
      const name = await ask('Nuevo nombre (enter para omitir): ')
      const body = {}
      if (name) body.name = name
      printResponse(await req('PUT', `/positions/${id}`, body))
    } else if (op === '5') {
      const id = await ask('ID del cargo: ')
      printResponse(await req('DELETE', `/positions/${id}`))
    } else if (op === '6') {
      const positionId = await ask('ID del cargo: ')
      const candidate_id = await ask('ID del candidato: ')
      printResponse(await req('POST', `/positions/${positionId}/candidates`, { candidate_id }))
    } else if (op === '7') {
      const cipId = await ask('ID de candidate_in_position: ')
      printResponse(await req('DELETE', `/positions/candidates/${cipId}`))
    }
  }
}

// ========== CANDIDATOS ==========
async function menuCandidates() {
  while (true) {
    printMenu('CANDIDATOS', [
      ['1', 'Listar candidatos'],
      ['2', 'Filtrar por organizacion'],
      ['3', 'Buscar por nombre'],
      ['4', 'Ver candidato por ID'],
      ['5', 'Crear candidato'],
      ['6', 'Importar candidatos (lote)'],
      ['7', 'Editar candidato'],
      ['8', 'Eliminar candidato'],
    ])
    const op = await ask('Opcion: ')

    if (op === '0') return
    if (op === '1') {
      printResponse(await req('GET', '/candidates'))
    } else if (op === '2') {
      const organization_id = await ask('ID de organizacion: ')
      printResponse(await req('GET', `/candidates?organization_id=${organization_id}`))
    } else if (op === '3') {
      const search = await ask('Buscar: ')
      printResponse(await req('GET', `/candidates?search=${search}`))
    } else if (op === '4') {
      const id = await ask('ID: ')
      printResponse(await req('GET', `/candidates/${id}`))
    } else if (op === '5') {
      const full_name = await ask('Nombre completo: ')
      const bio = await ask('Bio (enter para omitir): ')
      const photo_url = await ask('URL de foto (enter para omitir): ')
      const organization_id = await ask('ID de organizacion (enter para omitir): ')
      const body = { full_name }
      if (bio) body.bio = bio
      if (photo_url) body.photo_url = photo_url
      if (organization_id) body.organization_id = organization_id
      printResponse(await req('POST', '/candidates', body))
    } else if (op === '6') {
      const candidates = []
      console.log('  Ingresa candidatos (nombre vacio para terminar):')
      while (true) {
        const full_name = await ask('  Nombre: ')
        if (!full_name) break
        const bio = await ask('  Bio: ')
        candidates.push({ full_name, bio: bio || null })
      }
      if (candidates.length > 0) {
        printResponse(await req('POST', '/candidates/import', { candidates }))
      }
    } else if (op === '7') {
      const id = await ask('ID: ')
      const full_name = await ask('Nuevo nombre (enter para omitir): ')
      const bio = await ask('Nueva bio (enter para omitir): ')
      const body = {}
      if (full_name) body.full_name = full_name
      if (bio) body.bio = bio
      printResponse(await req('PUT', `/candidates/${id}`, body))
    } else if (op === '8') {
      const id = await ask('ID: ')
      printResponse(await req('DELETE', `/candidates/${id}`))
    }
  }
}

// ========== VOTANTES ==========
async function menuVoters() {
  while (true) {
    printMenu('VOTANTES', [
      ['1', 'Listar perfiles de votantes'],
      ['2', 'Ver perfil por ID'],
      ['3', 'Crear perfil de votante'],
      ['4', 'Editar perfil'],
      ['5', 'Eliminar perfil'],
      ['6', 'Ver votantes habilitados en eleccion'],
      ['7', 'Habilitar votante en eleccion'],
      ['8', 'Habilitar varios votantes (bulk)'],
      ['9', 'Deshabilitar votante de eleccion'],
    ])
    const op = await ask('Opcion: ')

    if (op === '0') return
    if (op === '1') {
      printResponse(await req('GET', '/voters/profiles'))
    } else if (op === '2') {
      const id = await ask('ID: ')
      printResponse(await req('GET', `/voters/profiles/${id}`))
    } else if (op === '3') {
      const full_name = await ask('Nombre completo: ')
      const institutional_id = await ask('Numero de cuenta: ')
      const email = await ask('Email: ')
      const password = await ask('Password: ')
      const organization_id = await ask('ID de organizacion: ')
      printResponse(await req('POST', '/voters/profiles', {
        full_name, institutional_id, email, password, organization_id
      }))
    } else if (op === '4') {
      const id = await ask('ID: ')
      const full_name = await ask('Nuevo nombre (enter para omitir): ')
      const body = {}
      if (full_name) body.full_name = full_name
      printResponse(await req('PUT', `/voters/profiles/${id}`, body))
    } else if (op === '5') {
      const id = await ask('ID: ')
      printResponse(await req('DELETE', `/voters/profiles/${id}`))
    } else if (op === '6') {
      const electionId = await ask('ID de eleccion: ')
      printResponse(await req('GET', `/voters/election/${electionId}`))
    } else if (op === '7') {
      const electionId = await ask('ID de eleccion: ')
      const voter_id = await ask('ID del votante: ')
      printResponse(await req('POST', `/voters/election/${electionId}`, { voter_id }))
    } else if (op === '8') {
      const electionId = await ask('ID de eleccion: ')
      const ids = await ask('IDs de votantes (separados por coma): ')
      const voter_ids = ids.split(',').map(s => s.trim()).filter(Boolean)
      printResponse(await req('POST', `/voters/election/${electionId}/bulk`, { voter_ids }))
    } else if (op === '9') {
      const id = await ask('ID de election_voter: ')
      printResponse(await req('DELETE', `/voters/${id}`))
    }
  }
}

// ========== FLUJO VOTACION ==========
async function menuVoting() {
  while (true) {
    if (!voterToken) {
      console.log('\n\x1b[31m  No hay token de votante. Usa Auth > Login Votante primero.\x1b[0m')
      return
    }

    printMenu('FLUJO DE VOTACION (ESTUDIANTE)', [
      ['1', 'Ver mis elecciones disponibles'],
      ['2', 'Ver boleta de una eleccion'],
      ['3', 'Emitir voto'],
      ['4', 'Ver estado de mi voto'],
    ])
    const op = await ask('Opcion: ')

    if (op === '0') return
    if (op === '1') {
      printResponse(await req('GET', '/vote/elections', null, voterToken))
    } else if (op === '2') {
      const electionId = await ask('ID de eleccion: ')
      printResponse(await req('GET', `/vote/elections/${electionId}/ballot`, null, voterToken))
    } else if (op === '3') {
      const electionId = await ask('ID de eleccion: ')

      // Mostrar boleta primero
      const ballot = await req('GET', `/vote/elections/${electionId}/ballot`, null, voterToken)
      if (!ballot.success) {
        printResponse(ballot)
        continue
      }

      const votes = []
      console.log('\n  Votacion por cargo:')
      for (const pos of ballot.data.positions) {
        console.log(`\n  \x1b[33mCargo: ${pos.name}\x1b[0m`)
        if (pos.allows_blank) console.log(`    \x1b[90m0) Voto en blanco\x1b[0m`)
        pos.candidates.forEach((c, i) => {
          const name = c.candidate?.full_name || 'Sin nombre'
          const org = c.candidate?.organization?.name || ''
          console.log(`    ${i + 1}) ${name} ${org ? `(${org})` : ''}`)
        })

        const choice = await ask('  Tu voto (numero): ')
        const num = parseInt(choice)

        if (num === 0 && pos.allows_blank) {
          votes.push({ position_id: pos.position_id, candidate_in_position_id: null, is_blank: true })
        } else if (num > 0 && num <= pos.candidates.length) {
          votes.push({
            position_id: pos.position_id,
            candidate_in_position_id: pos.candidates[num - 1].candidate_in_position_id,
            is_blank: false
          })
        } else {
          console.log('  \x1b[31mOpcion invalida, se registra voto en blanco\x1b[0m')
          votes.push({ position_id: pos.position_id, candidate_in_position_id: null, is_blank: true })
        }
      }

      console.log('\n  \x1b[33mResumen de tu voto:\x1b[0m')
      for (const v of votes) {
        const pos = ballot.data.positions.find(p => p.position_id === v.position_id)
        if (v.is_blank) {
          console.log(`    ${pos.name}: VOTO EN BLANCO`)
        } else {
          const cand = pos.candidates.find(c => c.candidate_in_position_id === v.candidate_in_position_id)
          console.log(`    ${pos.name}: ${cand?.candidate?.full_name}`)
        }
      }

      const confirm = await ask('\n  Confirmar voto? (s/n): ')
      if (confirm.toLowerCase() === 's') {
        printResponse(await req('POST', `/vote/elections/${electionId}/cast`, { votes }, voterToken))
      } else {
        console.log('  Voto cancelado.')
      }
    } else if (op === '4') {
      const electionId = await ask('ID de eleccion: ')
      printResponse(await req('GET', `/vote/elections/${electionId}/status`, null, voterToken))
    }
  }
}

// ========== MENU PRINCIPAL ==========
async function main() {
  console.log('\x1b[36m')
  console.log('  ╔═══════════════════════════════════════════════╗')
  console.log('  ║   PLATAFORMA DE VOTACIONES ESTUDIANTILES     ║')
  console.log('  ║   Consola de Administracion                  ║')
  console.log('  ╚═══════════════════════════════════════════════╝')
  console.log('\x1b[0m')

  while (true) {
    const tokenStatus = adminToken ? '\x1b[32m(conectado)\x1b[0m' : '\x1b[31m(sin token)\x1b[0m'
    const voterStatus = voterToken ? '\x1b[32m(conectado)\x1b[0m' : '\x1b[90m(sin token)\x1b[0m'

    console.log(`\n\x1b[33m=== MENU PRINCIPAL ===\x1b[0m  Admin: ${tokenStatus}  Votante: ${voterStatus}`)
    console.log('  \x1b[32m1\x1b[0m) Autenticacion')
    console.log('  \x1b[32m2\x1b[0m) Administradores')
    console.log('  \x1b[32m3\x1b[0m) Organizaciones')
    console.log('  \x1b[32m4\x1b[0m) Elecciones')
    console.log('  \x1b[32m5\x1b[0m) Cargos / Posiciones')
    console.log('  \x1b[32m6\x1b[0m) Candidatos')
    console.log('  \x1b[32m7\x1b[0m) Votantes')
    console.log('  \x1b[32m8\x1b[0m) Flujo de Votacion (estudiante)')
    console.log('  \x1b[32m0\x1b[0m) Salir')

    const op = await ask('\nOpcion: ')

    if (op === '0') {
      console.log('\nHasta luego.\n')
      rl.close()
      process.exit(0)
    }

    const menus = {
      '1': menuAuth,
      '2': menuAdmins,
      '3': menuOrganizations,
      '4': menuElections,
      '5': menuPositions,
      '6': menuCandidates,
      '7': menuVoters,
      '8': menuVoting,
    }

    if (menus[op]) {
      await menus[op]()
    }
  }
}

const server = app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}\n`)
  main().catch(e => {
    console.error('Error:', e)
    process.exit(1)
  })
})

process.on('SIGINT', () => {
  server.close()
  rl.close()
  process.exit(0)
})
