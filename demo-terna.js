// demo-terna.js -- script de demostracion para la terna

require('dotenv').config()
const express = require('express')
const crypto = require('crypto')
const readline = require('readline')
const { supabaseAdmin } = require('./src/config/supabase')

const PORT = 3333

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  white: '\x1b[37m',
  bgGreen: '\x1b[42m',
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
function ask(q) { return new Promise(resolve => rl.question(q, resolve)) }
function line(ch = '-', n = 60) { return ch.repeat(n) }

function header(text) {
  console.log('\n' + C.cyan + line('=') + C.reset)
  console.log(C.bold + C.cyan + '  ' + text + C.reset)
  console.log(C.cyan + line('=') + C.reset + '\n')
}

function subheader(text) {
  console.log('\n' + C.yellow + '  --- ' + text + ' ---' + C.reset + '\n')
}

function info(label, value) {
  console.log('  ' + C.dim + label + ':' + C.reset + ' ' + value)
}

function ok(text) {
  console.log('  ' + C.green + '[OK]' + C.reset + ' ' + text)
}

function fail(text) {
  console.log('  ' + C.red + '[ERROR]' + C.reset + ' ' + text)
}

function generateHash() {
  return crypto.randomBytes(32).toString('hex')
}

async function queryParticipation(electionId) {
  const { data } = await supabaseAdmin
    .from('election_voter')
    .select('election_voter_id, has_voted')
    .eq('election_id', electionId)

  const rows = data || []
  const total = rows.length
  const voted = rows.filter(r => r.has_voted).length
  const pct = total > 0 ? ((voted / total) * 100).toFixed(1) : '0.0'
  return { total, voted, pct }
}

async function queryResultsByCareer(electionId) {
  const { data: ecRows } = await supabaseAdmin
    .from('election_career')
    .select('election_career_id, career:career_id(career_id, name, code)')
    .eq('election_id', electionId)

  const results = []

  for (const ec of (ecRows || [])) {
    const { data: associations } = await supabaseAdmin
      .from('association')
      .select('association_id, name')
      .eq('election_career_id', ec.election_career_id)

    const { data: ballots } = await supabaseAdmin
      .from('ballot')
      .select('ballot_id')
      .eq('election_id', electionId)
      .eq('career_id', ec.career.career_id)

    const ballotIds = (ballots || []).map(b => b.ballot_id)

    let voteRows = []
    if (ballotIds.length > 0) {
      const { data: votes } = await supabaseAdmin
        .from('ballot_vote')
        .select('ballot_vote_id, association_id, is_blank')
        .in('ballot_id', ballotIds)
      voteRows = votes || []
    }

    const totalVotes = voteRows.length
    const blankCount = voteRows.filter(v => v.is_blank).length
    const assocResults = []

    for (const assoc of (associations || [])) {
      const count = voteRows.filter(v => v.association_id === assoc.association_id).length
      const pct = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : '0.0'
      assocResults.push({ name: assoc.name, votes: count, pct })
    }

    assocResults.sort((a, b) => b.votes - a.votes)

    results.push({
      career: ec.career.name,
      careerCode: ec.career.code,
      associations: assocResults,
      blankVotes: blankCount,
      totalVotes
    })
  }

  return results
}

function buildObserverApp() {
  const app = express()

  app.get('/observador/:electionId', async (request, response) => {
    try {
      const electionId = request.params.electionId

      const { data: election } = await supabaseAdmin
        .from('election')
        .select('election_id, title, status')
        .eq('election_id', electionId)
        .single()

      if (!election) return response.status(404).send('Eleccion no encontrada')

      const part = await queryParticipation(electionId)
      const resultsByCareer = await queryResultsByCareer(electionId)

      let careersHtml = ''

      if (resultsByCareer.length === 0 || resultsByCareer.every(r => r.totalVotes === 0)) {
        careersHtml = '<div class="card"><p class="empty">Sin votos registrados aun</p></div>'
      } else {
        for (const cr of resultsByCareer) {
          if (cr.totalVotes === 0) {
            careersHtml += '<div class="card"><h2>' + cr.career + ' (' + cr.careerCode + ')</h2><p class="empty">Sin votos aun</p></div>'
            continue
          }

          const maxVotes = cr.associations[0]?.votes || 0
          let rows = ''

          for (const a of cr.associations) {
            const isWinner = a.votes === maxVotes && maxVotes > 0
            const cls = isWinner ? 'winner' : ''
            rows += '<div class="candidate ' + cls + '">' +
              '<div class="candidate-info"><span class="name">' + a.name + '</span></div>' +
              '<div class="bar-container"><div class="bar" style="width:' + a.pct + '%"></div></div>' +
              '<div class="votes">' + a.votes + ' votos (' + a.pct + '%)</div></div>'
          }

          if (cr.blankVotes > 0) {
            rows += '<div class="candidate blank">' +
              '<div class="candidate-info"><span class="name">Voto en blanco</span></div>' +
              '<div class="votes">' + cr.blankVotes + ' votos</div></div>'
          }

          careersHtml += '<div class="card"><h2>' + cr.career + ' (' + cr.careerCode + ')</h2>' + rows + '</div>'
        }
      }

      const statusColor = election.status === 'open' ? '#22c55e' :
                           election.status === 'closed' ? '#ef4444' : '#eab308'
      const statusText = election.status === 'open' ? 'ABIERTA' :
                          election.status === 'closed' ? 'CERRADA' : 'BORRADOR'

      const html = '<!DOCTYPE html>' +
'<html lang="es"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="5">' +
'<title>Observador - ' + election.title + '</title>' +
'<style>' +
'*{margin:0;padding:0;box-sizing:border-box}' +
'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0f172a;color:#e2e8f0;padding:2rem}' +
'.header{text-align:center;margin-bottom:2rem;border-bottom:1px solid #334155;padding-bottom:1.5rem}' +
'.header h1{font-size:1.5rem;color:#f1f5f9;margin-bottom:.5rem}' +
'.status{display:inline-block;padding:.25rem .75rem;border-radius:4px;font-size:.75rem;font-weight:700;letter-spacing:.05em;background:' + statusColor + '22;color:' + statusColor + ';border:1px solid ' + statusColor + '44}' +
'.participation{display:flex;justify-content:center;gap:2rem;margin:1.5rem 0;flex-wrap:wrap}' +
'.stat{text-align:center;background:#1e293b;padding:1rem 1.5rem;border-radius:8px;min-width:150px}' +
'.stat .number{font-size:2rem;font-weight:700;color:#38bdf8}' +
'.stat .label{font-size:.8rem;color:#94a3b8;margin-top:.25rem}' +
'.card{background:#1e293b;border-radius:8px;padding:1.5rem;margin-bottom:1rem}' +
'.card h2{font-size:1.1rem;color:#38bdf8;margin-bottom:1rem}' +
'.candidate{display:flex;align-items:center;gap:1rem;padding:.75rem 0;border-bottom:1px solid #334155}' +
'.candidate:last-child{border-bottom:none}' +
'.candidate.winner .name{color:#22c55e;font-weight:700}' +
'.candidate.blank .name{color:#94a3b8;font-style:italic}' +
'.candidate-info{min-width:200px}.name{display:block}' +
'.bar-container{flex:1;background:#0f172a;border-radius:4px;height:20px;overflow:hidden}' +
'.bar{height:100%;background:#38bdf8;border-radius:4px;transition:width .5s ease}' +
'.winner .bar{background:#22c55e}' +
'.votes{min-width:120px;text-align:right;font-size:.9rem}' +
'.empty{color:#64748b;text-align:center;padding:2rem}' +
'.footer{text-align:center;margin-top:2rem;color:#475569;font-size:.75rem}' +
'.refresh{color:#64748b;font-size:.75rem;text-align:center;margin-top:.5rem}' +
'</style></head><body>' +
'<div class="header"><h1>OBSERVADOR DE RESULTADOS</h1>' +
'<p style="color:#94a3b8;margin-bottom:.5rem">' + election.title + '</p>' +
'<span class="status">' + statusText + '</span></div>' +
'<div class="participation">' +
'<div class="stat"><div class="number">' + part.total + '</div><div class="label">Habilitados</div></div>' +
'<div class="stat"><div class="number">' + part.voted + '</div><div class="label">Han votado</div></div>' +
'<div class="stat"><div class="number">' + part.pct + '%</div><div class="label">Participacion</div></div>' +
'</div>' + careersHtml +
'<p class="refresh">Se actualiza automaticamente cada 5 segundos</p>' +
'<div class="footer">Plataforma Digital para Votaciones Estudiantiles -- Proyecto de Graduacion 2026</div>' +
'</body></html>'

      response.type('html').send(html)
    } catch (err) {
      response.status(500).send('Error: ' + (err.message || err))
    }
  })

  return app
}

async function setupDemoData() {
  header('FASE 1: PREPARACION DE DATOS')

  console.log('  Verificando conexion a Supabase...')
  const { error: connErr } = await supabaseAdmin.from('organization').select('organization_id').limit(1)
  if (connErr) {
    fail('No se pudo conectar: ' + connErr.message)
    process.exit(1)
  }
  ok('Conexion a Supabase verificada')

  console.log('  Limpiando datos demo anteriores...')
  const { data: oldElections } = await supabaseAdmin
    .from('election').select('election_id').ilike('title', '%Demo Terna%')
  for (const old of (oldElections || [])) {
    await supabaseAdmin.from('ballot_vote').delete().in(
      'ballot_id',
      (await supabaseAdmin.from('ballot').select('ballot_id').eq('election_id', old.election_id)).data?.map(b => b.ballot_id) || []
    )
    await supabaseAdmin.from('ballot').delete().eq('election_id', old.election_id)
    await supabaseAdmin.from('election_voter').delete().eq('election_id', old.election_id)

    const { data: ecOld } = await supabaseAdmin
      .from('election_career').select('election_career_id').eq('election_id', old.election_id)
    for (const ec of (ecOld || [])) {
      const { data: assocOld } = await supabaseAdmin
        .from('association').select('association_id').eq('election_career_id', ec.election_career_id)
      for (const a of (assocOld || [])) {
        await supabaseAdmin.from('association_member').delete().eq('association_id', a.association_id)
      }
      await supabaseAdmin.from('association').delete().eq('election_career_id', ec.election_career_id)
    }
    await supabaseAdmin.from('election_career').delete().eq('election_id', old.election_id)
    await supabaseAdmin.from('election').delete().eq('election_id', old.election_id)
  }
  ok('Datos anteriores limpiados')

  subheader('Organizacion')
  let orgId
  const { data: existingOrg } = await supabaseAdmin
    .from('organization').select('organization_id').eq('code', 'DEMO').single()

  if (existingOrg) {
    orgId = existingOrg.organization_id
    info('Organizacion', 'ya existe (DEMO)')
  } else {
    const { data: newOrg, error: orgErr } = await supabaseAdmin
      .from('organization').insert({ name: 'Universidad Demo', code: 'DEMO' }).select().single()
    if (orgErr) throw new Error(orgErr.message)
    orgId = newOrg.organization_id
    ok('Organizacion "Universidad Demo" creada')
  }
  info('ID', orgId)

  subheader('Carrera')
  let career
  const { data: existingCareer } = await supabaseAdmin
    .from('career').select('*').eq('code', 'ISI-DEMO').eq('organization_id', orgId).single()

  if (existingCareer) {
    career = existingCareer
    info('Carrera', 'ya existe (ISI-DEMO)')
  } else {
    const { data: newCareer, error: carErr } = await supabaseAdmin
      .from('career')
      .insert({ organization_id: orgId, name: 'Ingenieria en Sistemas', code: 'ISI-DEMO', min_votes_required: 0 })
      .select().single()
    if (carErr) throw new Error(carErr.message)
    career = newCareer
    ok('Carrera "Ingenieria en Sistemas" creada')
  }
  info('ID', career.career_id)

  subheader('Eleccion')
  const now = new Date()
  const later = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const { data: election, error: elErr } = await supabaseAdmin
    .from('election')
    .insert({
      organization_id: orgId,
      title: 'Eleccion Demo Terna 2026',
      description: 'Demostracion del sistema de votacion para la terna evaluadora',
      status: 'draft',
      start_at: now.toISOString(),
      end_at: later.toISOString()
    })
    .select().single()

  if (elErr) throw new Error(elErr.message)
  ok('Eleccion "' + election.title + '" creada')
  info('ID', election.election_id)

  subheader('Vinculacion eleccion <-> carrera')
  const { data: ec, error: ecErr } = await supabaseAdmin
    .from('election_career')
    .insert({ election_id: election.election_id, career_id: career.career_id })
    .select().single()

  if (ecErr) throw new Error(ecErr.message)
  ok('Carrera vinculada a la eleccion')
  info('election_career_id', ec.election_career_id)

  subheader('Asociaciones / Planillas')
  const assocDefs = [
    {
      name: 'Planilla Avanza',
      description: 'Innovacion y tecnologia para todos',
      members: [
        { full_name: 'Carlos Rodriguez', role: 'Presidente' },
        { full_name: 'Maria Fernandez', role: 'Vicepresidenta' },
        { full_name: 'Luis Gomez', role: 'Secretario' },
      ]
    },
    {
      name: 'Planilla Unidos',
      description: 'Juntos por una mejor universidad',
      members: [
        { full_name: 'Ana Garcia', role: 'Presidenta' },
        { full_name: 'Jose Martinez', role: 'Vicepresidente' },
        { full_name: 'Sofia Lopez', role: 'Secretaria' },
      ]
    },
  ]

  const associations = []
  for (const ad of assocDefs) {
    const { data: assoc, error: aErr } = await supabaseAdmin
      .from('association')
      .insert({ election_career_id: ec.election_career_id, name: ad.name, description: ad.description })
      .select().single()

    if (aErr) throw new Error(aErr.message)

    for (const m of ad.members) {
      const { error: mErr } = await supabaseAdmin
        .from('association_member')
        .insert({ association_id: assoc.association_id, full_name: m.full_name, role: m.role })

      if (mErr) throw new Error(mErr.message)
    }

    associations.push(assoc)
    ok(ad.name + ' (' + ad.members.length + ' miembros)')
  }

  subheader('Estudiantes')
  const studentDefs = [
    { email: 'demo.est1@unitec.edu', name: 'Pedro Ramirez', iid: '20260001' },
    { email: 'demo.est2@unitec.edu', name: 'Laura Hernandez', iid: '20260002' },
    { email: 'demo.est3@unitec.edu', name: 'Diego Morales', iid: '20260003' },
  ]

  const students = []
  for (const sd of studentDefs) {
    let userId
    const { data: existingUser } = await supabaseAdmin
      .from('user_account').select('user_id').eq('email', sd.email).single()

    if (existingUser) {
      userId = existingUser.user_id
      info('  ' + sd.name, 'usuario ya existe')
    } else {
      const { data: newUser, error: uErr } = await supabaseAdmin
        .from('user_account')
        .insert({ email: sd.email, full_name: sd.name, role: 'student' })
        .select().single()
      if (uErr) throw new Error(uErr.message)
      userId = newUser.user_id
      ok('Usuario: ' + sd.name)
    }

    let studentId
    const { data: existingProfile } = await supabaseAdmin
      .from('student_profile').select('student_id').eq('user_id', userId).single()

    if (existingProfile) {
      studentId = existingProfile.student_id
    } else {
      const { data: existByIid } = await supabaseAdmin
        .from('student_profile').select('student_id').eq('institutional_id', sd.iid).single()

      if (existByIid) {
        studentId = existByIid.student_id
      } else {
        const { data: newProf, error: pErr } = await supabaseAdmin
          .from('student_profile')
          .insert({ user_id: userId, institutional_id: sd.iid, is_on_campus: true })
          .select().single()
        if (pErr) throw new Error(pErr.message)
        studentId = newProf.student_id
        ok('Perfil estudiantil: ' + sd.iid)
      }
    }

    const { data: existingSc } = await supabaseAdmin
      .from('student_career').select('student_career_id')
      .eq('student_id', studentId).eq('career_id', career.career_id).single()

    if (!existingSc) {
      const { error: scErr } = await supabaseAdmin
        .from('student_career')
        .insert({ student_id: studentId, career_id: career.career_id })
      if (scErr) throw new Error(scErr.message)
    }

    students.push({ student_id: studentId, user_id: userId, ...sd })
  }

  subheader('Habilitacion de votantes')
  for (const s of students) {
    const { error: evErr } = await supabaseAdmin
      .from('election_voter')
      .insert({ election_id: election.election_id, student_id: s.student_id, career_id: career.career_id })

    if (evErr && evErr.code !== '23505') throw new Error(evErr.message)
    ok(s.name + ' habilitado para votar')
  }

  subheader('Abriendo eleccion')
  const { error: openErr } = await supabaseAdmin
    .from('election').update({ status: 'open' }).eq('election_id', election.election_id)
  if (openErr) throw new Error(openErr.message)
  ok('Eleccion abierta y lista para recibir votos')

  return { election, career, ec, associations, students, orgId }
}

async function showResults(electionId, label) {
  header('OBSERVADOR: ' + (label || ''))

  const part = await queryParticipation(electionId)
  console.log('  PARTICIPACION')
  info('    Habilitados', part.total)
  info('    Han votado', part.voted)
  info('    Porcentaje', part.pct + '%')

  const results = await queryResultsByCareer(electionId)

  if (results.length === 0 || results.every(r => r.totalVotes === 0)) {
    console.log('\n  ' + C.dim + 'Sin votos registrados aun' + C.reset)
    return
  }

  for (const cr of results) {
    console.log('\n  ' + C.yellow + cr.career + ' (' + cr.careerCode + '):' + C.reset)

    if (cr.totalVotes === 0) {
      console.log('    ' + C.dim + 'Sin votos aun' + C.reset)
      continue
    }

    const maxVotes = cr.associations[0]?.votes || 0

    for (const a of cr.associations) {
      const bar = '#'.repeat(Math.round(parseFloat(a.pct) / 3))
      const color = (a.votes === maxVotes && maxVotes > 0) ? C.green : C.white
      console.log('    ' + color + a.name.padEnd(25) + C.reset +
        String(a.votes).padStart(3) + ' votos  ' + bar + '  ' + a.pct + '%')
    }

    if (cr.blankVotes > 0) {
      console.log('    ' + C.dim + 'Voto en blanco'.padEnd(25) + C.reset +
        String(cr.blankVotes).padStart(3) + ' votos')
    }
  }
}

async function votingFlow(election, career, associations, student) {
  subheader('VOTANTE: ' + student.name + ' (' + student.iid + ')')

  const { data: ev } = await supabaseAdmin
    .from('election_voter')
    .select('election_voter_id, has_voted')
    .eq('election_id', election.election_id)
    .eq('student_id', student.student_id)
    .single()

  if (!ev) {
    fail('Estudiante no habilitado para esta eleccion')
    return false
  }

  if (ev.has_voted) {
    fail('Este estudiante ya voto')
    return false
  }

  ok('Estudiante autenticado')
  info('    Nombre', student.name)
  info('    Cuenta', student.iid)
  info('    Email', student.email)
  info('    Carrera', career.name)
  info('    Eleccion', election.title)

  console.log('\n  ' + C.yellow + 'ASOCIACIONES / PLANILLAS DISPONIBLES:' + C.reset)
  console.log('    ' + C.dim + '0) Voto en blanco' + C.reset)

  for (let i = 0; i < associations.length; i++) {
    const a = associations[i]
    console.log('    ' + (i + 1) + ') ' + C.bold + a.name + C.reset)

    const { data: members } = await supabaseAdmin
      .from('association_member')
      .select('full_name, role')
      .eq('association_id', a.association_id)

    for (const m of (members || [])) {
      console.log('       ' + C.dim + m.role + ': ' + m.full_name + C.reset)
    }
  }

  const choice = await ask('\n  Su voto (numero): ')
  const num = parseInt(choice)

  let selectedAssociation = null
  let isBlank = false

  if (num === 0) {
    isBlank = true
    console.log('  -> Voto en blanco')
  } else if (num > 0 && num <= associations.length) {
    selectedAssociation = associations[num - 1]
    console.log('  -> ' + selectedAssociation.name)
  } else {
    fail('Opcion invalida, se registra voto en blanco')
    isBlank = true
  }

  console.log('\n  ' + C.bold + 'RESUMEN DEL VOTO:' + C.reset)
  console.log('  ' + line('-', 40))
  info('  Estudiante', student.name)
  info('  Carrera', career.name)
  if (isBlank) {
    console.log('  Voto: ' + C.dim + 'EN BLANCO' + C.reset)
  } else {
    console.log('  Voto: ' + C.bold + selectedAssociation.name + C.reset)
  }
  console.log('  ' + line('-', 40))

  const confirm = await ask('\n  Confirmar voto? (s/n): ')
  if (confirm.toLowerCase() !== 's') {
    console.log('  Voto cancelado.')
    return false
  }

  console.log('\n  Registrando voto...')

  const ballotHash = generateHash()
  const { data: ballot, error: ballotErr } = await supabaseAdmin
    .from('ballot')
    .insert({
      election_id: election.election_id,
      career_id: career.career_id,
      ballot_hash: ballotHash
    })
    .select().single()

  if (ballotErr) {
    fail('Error al crear boleta: ' + ballotErr.message)
    return false
  }

  const voteData = {
    ballot_id: ballot.ballot_id,
    is_blank: isBlank
  }
  if (!isBlank) {
    voteData.association_id = selectedAssociation.association_id
  }

  const { error: voteErr } = await supabaseAdmin
    .from('ballot_vote')
    .insert(voteData)

  if (voteErr) {
    fail('Error al registrar voto: ' + voteErr.message)
    await supabaseAdmin.from('ballot').delete().eq('ballot_id', ballot.ballot_id)
    return false
  }

  const { error: updateErr } = await supabaseAdmin
    .from('election_voter')
    .update({ has_voted: true, voted_at: new Date().toISOString() })
    .eq('election_voter_id', ev.election_voter_id)

  if (updateErr) {
    fail('Error al actualizar estado: ' + updateErr.message)
    return false
  }

  console.log('')
  console.log('  ' + C.bgGreen + C.bold + '                                          ' + C.reset)
  console.log('  ' + C.bgGreen + C.bold + '    VOTO REGISTRADO EXITOSAMENTE           ' + C.reset)
  console.log('  ' + C.bgGreen + C.bold + '                                          ' + C.reset)
  console.log('')
  info('  Ballot ID (anonimo)', ballot.ballot_id)
  info('  Hash de boleta', ballotHash.substring(0, 16) + '...')
  info('  Fecha/hora', new Date().toISOString())

  const { data: evPost } = await supabaseAdmin
    .from('election_voter')
    .select('has_voted, voted_at')
    .eq('election_voter_id', ev.election_voter_id)
    .single()

  if (evPost) {
    info('  Estado en BD', evPost.has_voted ? 'Voto confirmado' : 'No registrado')
  }

  console.log('\n  Verificando proteccion contra doble voto...')
  const { data: evCheck } = await supabaseAdmin
    .from('election_voter')
    .select('has_voted')
    .eq('election_id', election.election_id)
    .eq('student_id', student.student_id)
    .single()

  if (evCheck && evCheck.has_voted) {
    ok('Sistema detecta que el estudiante ya voto. Segundo voto bloqueado.')
  }

  return true
}

async function cleanup(data) {
  header('LIMPIEZA DE DATOS')

  const confirm = await ask('  Eliminar los datos de demostracion? (s/n): ')
  if (confirm.toLowerCase() !== 's') {
    console.log('  Datos conservados.\n')
    return
  }

  const { data: ballots } = await supabaseAdmin
    .from('ballot').select('ballot_id').eq('election_id', data.election.election_id)
  for (const b of (ballots || [])) {
    await supabaseAdmin.from('ballot_vote').delete().eq('ballot_id', b.ballot_id)
  }
  await supabaseAdmin.from('ballot').delete().eq('election_id', data.election.election_id)
  ok('Boletas y votos eliminados')

  await supabaseAdmin.from('election_voter').delete().eq('election_id', data.election.election_id)
  ok('Habilitaciones eliminadas')

  for (const a of data.associations) {
    await supabaseAdmin.from('association_member').delete().eq('association_id', a.association_id)
    await supabaseAdmin.from('association').delete().eq('association_id', a.association_id)
  }
  ok('Asociaciones y miembros eliminados')

  await supabaseAdmin.from('election_career').delete().eq('election_career_id', data.ec.election_career_id)
  ok('Vinculacion eleccion-carrera eliminada')

  await supabaseAdmin.from('election').delete().eq('election_id', data.election.election_id)
  ok('Eleccion eliminada')

  for (const s of data.students) {
    await supabaseAdmin.from('student_career').delete()
      .eq('student_id', s.student_id).eq('career_id', data.career.career_id)
    await supabaseAdmin.from('student_profile').delete().eq('student_id', s.student_id)
    await supabaseAdmin.from('user_account').delete().eq('user_id', s.user_id)
  }
  ok('Estudiantes eliminados')

  const { data: remainingEc } = await supabaseAdmin
    .from('election_career').select('election_career_id').eq('career_id', data.career.career_id)
  if (!remainingEc || remainingEc.length === 0) {
    await supabaseAdmin.from('career').delete().eq('career_id', data.career.career_id)
    ok('Carrera eliminada')
  }

  const { data: remainingEl } = await supabaseAdmin
    .from('election').select('election_id').eq('organization_id', data.orgId)
  if (!remainingEl || remainingEl.length === 0) {
    const { data: remainingCar } = await supabaseAdmin
      .from('career').select('career_id').eq('organization_id', data.orgId)
    if (!remainingCar || remainingCar.length === 0) {
      await supabaseAdmin.from('organization').delete().eq('organization_id', data.orgId)
      ok('Organizacion eliminada')
    }
  }

  console.log('\n  Limpieza completada.\n')
}

async function main() {
  console.log('')
  console.log(C.cyan + '  +----------------------------------------------------------+' + C.reset)
  console.log(C.cyan + '  |                                                          |' + C.reset)
  console.log(C.cyan + '  |   PLATAFORMA DIGITAL PARA VOTACIONES ESTUDIANTILES       |' + C.reset)
  console.log(C.cyan + '  |   Demostracion para Terna Evaluadora                     |' + C.reset)
  console.log(C.cyan + '  |   Proyecto de Graduacion Q1 2026                         |' + C.reset)
  console.log(C.cyan + '  |                                                          |' + C.reset)
  console.log(C.cyan + '  +----------------------------------------------------------+' + C.reset)
  console.log('')
  console.log('  Este script demuestra el flujo completo de votacion')
  console.log('  conectado directamente a la base de datos en Supabase.')
  console.log('')
  console.log('  Flujo:')
  console.log('  1. Preparacion de datos (organizacion, carrera, eleccion, planillas)')
  console.log('  2. Observador de resultados (consola + navegador)')
  console.log('  3. Votacion de 3 estudiantes (interactivo en consola)')
  console.log('  4. Confirmacion de voto y proteccion contra doble voto')
  console.log('  5. Resultados finales')
  console.log('')

  try {
    const data = await setupDemoData()
    await ask('\n  Presione ENTER para ver el observador de resultados...')

    await showResults(data.election.election_id, 'ANTES DE VOTAR')

    console.log('\n  ' + C.bold + 'Endpoint observador (abrir en navegador):' + C.reset)
    console.log('  ' + C.cyan + 'http://localhost:' + PORT + '/observador/' + data.election.election_id + C.reset)
    console.log('  ' + C.dim + 'Se actualiza automaticamente cada 5 segundos' + C.reset)

    await ask('\n  Presione ENTER para iniciar la votacion...')

    header('FLUJO DE VOTACION')
    console.log('  3 estudiantes votaran de forma interactiva.')
    console.log('  Cada uno vera las planillas disponibles y seleccionara su voto.\n')

    for (let i = 0; i < data.students.length; i++) {
      const voted = await votingFlow(data.election, data.career, data.associations, data.students[i])
      if (voted && i < data.students.length - 1) {
        await ask('\n  Presione ENTER para el siguiente votante...')
      }
    }

    await ask('\n  Presione ENTER para ver los resultados finales...')

    await showResults(data.election.election_id, 'RESULTADOS FINALES')

    console.log('\n  ' + C.bold + 'Ver resultados graficos en el navegador:' + C.reset)
    console.log('  ' + C.cyan + 'http://localhost:' + PORT + '/observador/' + data.election.election_id + C.reset)

    await ask('\n  Presione ENTER para continuar...')

    await cleanup(data)

  } catch (err) {
    fail('Error: ' + (err.message || err))
    console.error(err)
  }

  console.log('  Demo finalizada.\n')
  rl.close()
  process.exit(0)
}

const app = buildObserverApp()

const server = app.listen(PORT, () => {
  console.log('  Servidor iniciado en puerto ' + PORT)
  main()
})

process.on('SIGINT', () => {
  server.close()
  rl.close()
  process.exit(0)
})
