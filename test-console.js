require('dotenv').config()
const app = require('./src/app')

const PORT = 3333
const BASE = `http://localhost:${PORT}/api`
 
let adminToken = ''
let voterToken = ''
let orgId = ''
let electionId = ''
let positionId1 = ''
let positionId2 = ''
let candidateId1 = ''
let candidateId2 = ''
let candidateId3 = ''
let cipId1 = ''
let cipId2 = ''
let cipId3 = ''
let voterId = ''
let adminId = ''

// Helpers
async function req(method, path, body = null, token = adminToken) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  }
  if (token) opts.headers.Authorization = `Bearer ${token}`
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(`${BASE}${path}`, opts)
  const data = await res.json()
  return data
}

function log(step, label, result) {
  const status = result.success ? '\x1b[32mOK\x1b[0m' : '\x1b[31mFAIL\x1b[0m'
  const msg = result.message || ''
  console.log(`  [${step}] ${status} - ${label} ${!result.success ? '-> ' + msg : ''}`)
  return result
}

async function run() {
  console.log('\n\x1b[36m========================================\x1b[0m')
  console.log('\x1b[36m  CONSOLA DE PRUEBAS - API ELECCIONES\x1b[0m')
  console.log('\x1b[36m========================================\x1b[0m\n')

  // =============================================
  console.log('\x1b[33m--- HEALTH CHECK ---\x1b[0m')
  // =============================================
  let d = await req('GET', '/health', null, null)
  console.log(`  [0] \x1b[32mOK\x1b[0m - Health: ${d.status}\n`)

  // =============================================
  console.log('\x1b[33m--- AUTENTICACION ---\x1b[0m')
  // =============================================
  d = log('1.1', 'Login admin', await req('POST', '/auth/login', {
    email: 'admin@elecciones.edu',
    password: 'admin123'
  }, null))
  adminToken = d.data?.token || ''

  d = log('1.2', 'Login admin con password incorrecto', await req('POST', '/auth/login', {
    email: 'admin@elecciones.edu',
    password: 'wrongpassword'
  }, null))

  d = log('1.3', 'Login sin campos requeridos', await req('POST', '/auth/login', {
    email: '',
    password: ''
  }, null))

  d = log('1.4', 'Obtener perfil admin', await req('GET', '/auth/profile'))
  console.log(`         Nombre: ${d.data?.full_name}, Rol: ${d.data?.role}`)

  d = log('1.5', 'Actualizar perfil', await req('PUT', '/auth/profile', {
    full_name: 'Admin Master Actualizado'
  }))

  d = log('1.6', 'Cambiar contrasena (incorrecta actual)', await req('PUT', '/auth/change-password', {
    current_password: 'wrongpassword',
    new_password: 'newpassword123'
  }))

  console.log()

  // =============================================
  console.log('\x1b[33m--- GESTION DE ADMINISTRADORES (admin_master) ---\x1b[0m')
  // =============================================
  d = log('2.1', 'Crear administrador', await req('POST', '/admins', {
    email: 'admin2@elecciones.edu',
    password: 'password123',
    full_name: 'Admin Secundario',
    role: 'admin'
  }))
  adminId = d.data?.admin_id || ''

  d = log('2.2', 'Listar administradores', await req('GET', '/admins'))
  console.log(`         Total: ${d.data?.length} administradores`)

  d = log('2.3', 'Obtener administrador por ID', await req('GET', `/admins/${adminId}`))

  d = log('2.4', 'Editar administrador', await req('PUT', `/admins/${adminId}`, {
    full_name: 'Admin Secundario Editado'
  }))

  d = log('2.5', 'Desactivar administrador', await req('PUT', `/admins/${adminId}/deactivate`))
  console.log(`         is_active: ${d.data?.is_active}`)

  d = log('2.6', 'Crear admin con email duplicado', await req('POST', '/admins', {
    email: 'admin2@elecciones.edu',
    password: 'password123',
    full_name: 'Duplicado',
    role: 'admin'
  }))

  console.log()

  // =============================================
  console.log('\x1b[33m--- ORGANIZACIONES ---\x1b[0m')
  // =============================================
  d = log('3.1', 'Crear organizacion', await req('POST', '/organizations', {
    name: 'Asociacion de Ingenieria TEST',
    code: 'AIT' + Date.now().toString().slice(-4)
  }))
  orgId = d.data?.organization_id || ''

  d = log('3.2', 'Listar organizaciones', await req('GET', '/organizations'))
  console.log(`         Total: ${d.data?.length} organizaciones`)

  d = log('3.3', 'Obtener organizacion por ID', await req('GET', `/organizations/${orgId}`))
  console.log(`         Nombre: ${d.data?.name}, Codigo: ${d.data?.code}`)

  d = log('3.4', 'Editar organizacion', await req('PUT', `/organizations/${orgId}`, {
    name: 'Asociacion de Ingenieria EDITADA'
  }))

  console.log()

  // =============================================
  console.log('\x1b[33m--- ELECCIONES (CRUD) ---\x1b[0m')
  // =============================================
  d = log('4.1', 'Crear eleccion', await req('POST', '/elections', {
    title: 'Eleccion de Prueba Consola',
    description: 'Eleccion creada desde script de prueba',
    organization_id: orgId,
    start_at: '2026-05-01T08:00:00Z',
    end_at: '2026-05-01T18:00:00Z'
  }))
  electionId = d.data?.election_id || ''
  console.log(`         ID: ${electionId}, Status: ${d.data?.status}`)

  d = log('4.2', 'Listar elecciones', await req('GET', '/elections'))
  console.log(`         Total: ${d.data?.length} elecciones`)

  d = log('4.3', 'Filtrar elecciones por status', await req('GET', '/elections?status=draft'))
  console.log(`         Borradores: ${d.data?.length}`)

  d = log('4.4', 'Buscar elecciones', await req('GET', '/elections?search=Prueba'))
  console.log(`         Resultados: ${d.data?.length}`)

  d = log('4.5', 'Obtener eleccion por ID', await req('GET', `/elections/${electionId}`))

  d = log('4.6', 'Editar eleccion', await req('PUT', `/elections/${electionId}`, {
    title: 'Eleccion de Prueba EDITADA',
    description: 'Descripcion actualizada'
  }))

  d = log('4.7', 'Duplicar eleccion', await req('POST', `/elections/${electionId}/duplicate`))
  const duplicatedId = d.data?.election_id || ''
  console.log(`         Duplicada: ${d.data?.title}`)

  if (duplicatedId) {
    d = log('4.8', 'Eliminar eleccion duplicada', await req('DELETE', `/elections/${duplicatedId}`))
  }

  console.log()

  // =============================================
  console.log('\x1b[33m--- CARGOS / POSICIONES ---\x1b[0m')
  // =============================================
  d = log('5.1', 'Crear cargo: Presidente', await req('POST', `/positions/election/${electionId}`, {
    name: 'Presidente',
    min_votes: 1,
    max_votes: 1,
    allows_blank: true,
    position_order: 1
  }))
  positionId1 = d.data?.position_id || ''

  d = log('5.2', 'Crear cargo: Secretario', await req('POST', `/positions/election/${electionId}`, {
    name: 'Secretario',
    min_votes: 1,
    max_votes: 1,
    allows_blank: true,
    position_order: 2
  }))
  positionId2 = d.data?.position_id || ''

  d = log('5.3', 'Listar cargos de la eleccion', await req('GET', `/positions/election/${electionId}`))
  console.log(`         Total: ${d.data?.length} cargos`)

  d = log('5.4', 'Obtener cargo por ID', await req('GET', `/positions/${positionId1}`))
  console.log(`         Nombre: ${d.data?.name}, Max votos: ${d.data?.max_votes}`)

  d = log('5.5', 'Editar cargo', await req('PUT', `/positions/${positionId2}`, {
    name: 'Secretario General'
  }))

  console.log()

  // =============================================
  console.log('\x1b[33m--- CANDIDATOS ---\x1b[0m')
  // =============================================
  d = log('6.1', 'Crear candidato 1', await req('POST', '/candidates', {
    full_name: 'Maria Garcia',
    bio: 'Estudiante de 5to ano de ingenieria',
    organization_id: orgId
  }))
  candidateId1 = d.data?.candidate_id || ''

  d = log('6.2', 'Crear candidato 2', await req('POST', '/candidates', {
    full_name: 'Pedro Martinez',
    bio: 'Estudiante de 4to ano',
    organization_id: orgId
  }))
  candidateId2 = d.data?.candidate_id || ''

  d = log('6.3', 'Crear candidato 3', await req('POST', '/candidates', {
    full_name: 'Ana Lopez',
    bio: 'Estudiante de 3er ano'
  }))
  candidateId3 = d.data?.candidate_id || ''

  d = log('6.4', 'Importar candidatos en lote', await req('POST', '/candidates/import', {
    candidates: [
      { full_name: 'Carlos Ruiz', bio: 'Candidato importado 1' },
      { full_name: 'Laura Hernandez', bio: 'Candidata importada 2' }
    ]
  }))
  console.log(`         Importados: ${d.data?.length}`)

  d = log('6.5', 'Listar candidatos', await req('GET', '/candidates'))
  console.log(`         Total: ${d.data?.length} candidatos`)

  d = log('6.6', 'Buscar candidatos', await req('GET', '/candidates?search=Maria'))
  console.log(`         Resultados: ${d.data?.length}`)

  d = log('6.7', 'Filtrar por organizacion', await req('GET', `/candidates?organization_id=${orgId}`))
  console.log(`         De la org: ${d.data?.length}`)

  d = log('6.8', 'Editar candidato', await req('PUT', `/candidates/${candidateId1}`, {
    full_name: 'Maria Garcia Editada',
    bio: 'Bio actualizada'
  }))

  console.log()

  // =============================================
  console.log('\x1b[33m--- ASIGNAR CANDIDATOS A CARGOS ---\x1b[0m')
  // =============================================
  d = log('7.1', 'Asignar Maria a Presidente', await req('POST', `/positions/${positionId1}/candidates`, {
    candidate_id: candidateId1
  }))
  cipId1 = d.data?.candidate_in_position_id || ''

  d = log('7.2', 'Asignar Pedro a Presidente', await req('POST', `/positions/${positionId1}/candidates`, {
    candidate_id: candidateId2
  }))
  cipId2 = d.data?.candidate_in_position_id || ''

  d = log('7.3', 'Asignar Ana a Secretario', await req('POST', `/positions/${positionId2}/candidates`, {
    candidate_id: candidateId3
  }))
  cipId3 = d.data?.candidate_in_position_id || ''

  d = log('7.4', 'Asignar duplicado (debe fallar)', await req('POST', `/positions/${positionId1}/candidates`, {
    candidate_id: candidateId1
  }))

  d = log('7.5', 'Ver cargos con candidatos asignados', await req('GET', `/positions/election/${electionId}`))
  for (const pos of (d.data || [])) {
    console.log(`         ${pos.name}: ${pos.candidates?.length || 0} candidatos`)
  }

  console.log()

  // =============================================
  console.log('\x1b[33m--- VOTANTES ---\x1b[0m')
  // =============================================
  const voterEmail = `test${Date.now()}@universidad.edu`
  d = log('8.1', 'Crear perfil de votante', await req('POST', '/voters/profiles', {
    full_name: 'Estudiante de Prueba',
    institutional_id: 'ID' + Date.now().toString().slice(-6),
    email: voterEmail,
    password: 'password123',
    organization_id: orgId
  }))
  voterId = d.data?.voter_id || ''
  if (!d.success) console.log(`         Detalle: ${d.message}`)

  d = log('8.2', 'Listar perfiles de votantes', await req('GET', '/voters/profiles'))
  console.log(`         Total: ${d.data?.length} votantes`)

  if (voterId) {
    d = log('8.3', 'Obtener perfil por ID', await req('GET', `/voters/profiles/${voterId}`))

    d = log('8.4', 'Habilitar votante en eleccion', await req('POST', `/voters/election/${electionId}`, {
      voter_id: voterId
    }))

    d = log('8.5', 'Listar votantes de la eleccion', await req('GET', `/voters/election/${electionId}`))
    console.log(`         Habilitados: ${d.data?.length}`)

    d = log('8.6', 'Habilitar duplicado (debe fallar)', await req('POST', `/voters/election/${electionId}`, {
      voter_id: voterId
    }))
  } else {
    console.log('  \x1b[31m  SKIP 8.3-8.6: No se pudo crear votante (necesitas service_role key)\x1b[0m')
  }

  console.log()

  // =============================================
  console.log('\x1b[33m--- VALIDACION DE ELECCION (PASO 5) ---\x1b[0m')
  // =============================================
  d = log('9.1', 'Validar eleccion', await req('GET', `/elections/${electionId}/validate`))
  console.log(`         Ready: ${d.data?.is_ready}`)
  console.log(`         Posiciones: ${JSON.stringify(d.data?.positions)}`)
  console.log(`         Votantes: ${d.data?.voters_count}`)
  if (d.data?.issues?.length > 0) {
    console.log(`         Issues: ${d.data.issues.join(', ')}`)
  }

  console.log()

  // =============================================
  console.log('\x1b[33m--- ABRIR ELECCION ---\x1b[0m')
  // =============================================
  if (voterId) {
    d = log('10.1', 'Abrir eleccion', await req('PUT', `/elections/${electionId}/open`))
    console.log(`         Status: ${d.data?.status || d.message}`)
  } else {
    console.log('  \x1b[31m  SKIP: No hay votantes, no se puede abrir\x1b[0m')
  }

  console.log()

  // =============================================
  console.log('\x1b[33m--- FLUJO DE VOTACION (ESTUDIANTE) ---\x1b[0m')
  // =============================================
  if (voterId) {
    d = log('11.1', 'Login como votante', await req('POST', '/auth/login-voter', {
      email: voterEmail,
      password: 'password123'
    }, null))
    voterToken = d.data?.token || ''

    if (voterToken) {
      d = log('11.2', 'Ver elecciones disponibles', await req('GET', '/vote/elections', null, voterToken))
      console.log(`         Elecciones activas: ${d.data?.elections?.length}`)

      d = log('11.3', 'Ver boleta', await req('GET', `/vote/elections/${electionId}/ballot`, null, voterToken))
      if (d.data?.positions) {
        for (const pos of d.data.positions) {
          console.log(`         ${pos.name}: ${pos.candidates?.length || 0} candidatos`)
        }
      }

      d = log('11.4', 'Emitir voto', await req('POST', `/vote/elections/${electionId}/cast`, {
        votes: [
          { position_id: positionId1, candidate_in_position_id: cipId1, is_blank: false },
          { position_id: positionId2, candidate_in_position_id: null, is_blank: true }
        ]
      }, voterToken))

      d = log('11.5', 'Verificar estado (ya voto)', await req('GET', `/vote/elections/${electionId}/status`, null, voterToken))
      console.log(`         has_voted: ${d.data?.has_voted}`)

      d = log('11.6', 'Intentar votar de nuevo (debe fallar)', await req('POST', `/vote/elections/${electionId}/cast`, {
        votes: [
          { position_id: positionId1, candidate_in_position_id: cipId2, is_blank: false },
          { position_id: positionId2, candidate_in_position_id: cipId3, is_blank: false }
        ]
      }, voterToken))
    } else {
      console.log('  \x1b[31m  SKIP 11.2-11.6: Login de votante fallo\x1b[0m')
    }
  } else {
    console.log('  \x1b[31m  SKIP: No hay votante creado\x1b[0m')
  }

  console.log()

  // =============================================
  console.log('\x1b[33m--- RESULTADOS ---\x1b[0m')
  // =============================================
  d = log('12.1', 'Ver resultados', await req('GET', `/elections/${electionId}/results`))
  if (d.data?.participation) {
    console.log(`         Participacion: ${d.data.participation.participacion_pct}%`)
    console.log(`         Votaron: ${d.data.participation.total_votaron}/${d.data.participation.total_habilitados}`)
  }
  if (d.data?.results_by_position?.length > 0) {
    for (const r of d.data.results_by_position) {
      console.log(`         ${r.position_name} -> ${r.candidate_name}: ${r.total_votes} votos (${r.vote_percentage}%)`)
    }
  }

  console.log()

  // =============================================
  console.log('\x1b[33m--- CERRAR ELECCION ---\x1b[0m')
  // =============================================
  if (voterId) {
    d = log('13.1', 'Cerrar eleccion', await req('PUT', `/elections/${electionId}/close`))
    console.log(`         Status: ${d.data?.status || d.message}`)

    d = log('13.2', 'Reabrir como borrador', await req('PUT', `/elections/${electionId}/reopen`))
    console.log(`         Status: ${d.data?.status || d.message}`)
  }

  console.log()

  // =============================================
  console.log('\x1b[33m--- LIMPIEZA ---\x1b[0m')
  // =============================================
  if (voterId) {
    d = log('14.1', 'Eliminar perfil de votante', await req('DELETE', `/voters/profiles/${voterId}`))
  }
  if (adminId) {
    d = log('14.2', 'Eliminar admin secundario', await req('DELETE', `/admins/${adminId}`))
  }
  d = log('14.3', 'Eliminar eleccion (cascade borra posiciones, etc)', await req('DELETE', `/elections/${electionId}`))
  d = log('14.4', 'Eliminar organizacion', await req('DELETE', `/organizations/${orgId}`))

  // Restaurar nombre del admin
  await req('PUT', '/auth/profile', { full_name: 'Admin Master' })

  console.log('\n\x1b[36m========================================\x1b[0m')
  console.log('\x1b[36m  PRUEBAS FINALIZADAS\x1b[0m')
  console.log('\x1b[36m========================================\x1b[0m\n')
}

const server = app.listen(PORT, () => {
  console.log(`Servidor de pruebas en puerto ${PORT}`)
  run()
    .catch(e => console.error('Error fatal:', e))
    .finally(() => server.close())
})
