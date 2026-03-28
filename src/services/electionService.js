const supabase = require('../config/supabase')

async function getAll({ status, search, organization_id } = {}) {
  let query = supabase
    .from('election')
    .select('*, organization:organization_id(organization_id, name, code)')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (organization_id) query = query.eq('organization_id', organization_id)
  if (search) query = query.ilike('title', `%${search}%`)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

async function getById(id) {
  const { data, error } = await supabase
    .from('election')
    .select('*, organization:organization_id(organization_id, name, code)')
    .eq('election_id', id)
    .single()

  if (error) throw { status: 404, message: 'Eleccion no encontrada' }
  return data
}

async function create({ title, description, start_at, end_at, organization_id }) {
  const { data, error } = await supabase
    .from('election')
    .insert({ title, description, start_at, end_at, organization_id, status: 'draft' })
    .select('*, organization:organization_id(organization_id, name, code)')
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function update(id, updates) {
  const allowed = ['title', 'description', 'start_at', 'end_at', 'organization_id']
  const updateData = {}
  for (const field of allowed) {
    if (updates[field] !== undefined) updateData[field] = updates[field]
  }

  const { data, error } = await supabase
    .from('election')
    .update(updateData)
    .eq('election_id', id)
    .select('*, organization:organization_id(organization_id, name, code)')
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw { status: 404, message: 'Eleccion no encontrada' }
  return data
}

async function remove(id) {
  const election = await getById(id)
  if (election.status === 'open') {
    throw { status: 400, message: 'No se puede eliminar una eleccion abierta' }
  }

  const { error } = await supabase
    .from('election')
    .delete()
    .eq('election_id', id)

  if (error) throw new Error(error.message)
  return true
}

async function duplicate(id) {
  const original = await getById(id)
  const { data, error } = await supabase
    .from('election')
    .insert({
      title: `${original.title} (copia)`,
      description: original.description,
      start_at: original.start_at,
      end_at: original.end_at,
      organization_id: original.organization_id,
      status: 'draft'
    })
    .select('*, organization:organization_id(organization_id, name, code)')
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function changeStatus(id, newStatus) {
  const election = await getById(id)
  const transitions = {
    draft: ['open'],
    open: ['closed'],
    closed: ['draft']
  }

  const allowed = transitions[election.status] || []
  if (!allowed.includes(newStatus)) {
    throw { status: 400, message: `No se puede cambiar de '${election.status}' a '${newStatus}'` }
  }

  if (newStatus === 'open') {
    await validateElectionReady(id)
  }

  const { data, error } = await supabase
    .from('election')
    .update({ status: newStatus })
    .eq('election_id', id)
    .select('*, organization:organization_id(organization_id, name, code)')
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function validateElectionReady(electionId) {
  // Verificar que tiene posiciones
  const { data: positions } = await supabase
    .from('position')
    .select('position_id, name')
    .eq('election_id', electionId)

  if (!positions || positions.length === 0) {
    throw { status: 400, message: 'La eleccion debe tener al menos un cargo/posicion' }
  }

  // Verificar que cada posicion tiene candidatos
  for (const pos of positions) {
    const { data: cips } = await supabase
      .from('candidate_in_position')
      .select('candidate_in_position_id')
      .eq('position_id', pos.position_id)

    if (!cips || cips.length === 0) {
      throw { status: 400, message: `El cargo "${pos.name}" no tiene candidatos asignados` }
    }
  }

  // Verificar que tiene votantes habilitados
  const { data: voters } = await supabase
    .from('election_voter')
    .select('election_voter_id')
    .eq('election_id', electionId)

  if (!voters || voters.length === 0) {
    throw { status: 400, message: 'La eleccion debe tener al menos un votante habilitado' }
  }

  return true
}

async function getResults(id) {
  const election = await getById(id)

  // Resultados por posicion usando la vista
  const { data: results, error: resultsError } = await supabase
    .from('v_results_by_position')
    .select('*')
    .eq('election_id', id)

  // Participacion
  const { data: participation } = await supabase
    .from('v_participation')
    .select('*')
    .eq('election_id', id)
    .single()

  // Votos en blanco
  const { data: blankVotes } = await supabase
    .from('v_blank_votes')
    .select('*')
    .eq('election_id', id)

  return {
    election: { election_id: election.election_id, title: election.title, status: election.status },
    participation: participation || { total_habilitados: 0, total_votaron: 0, participacion_pct: 0 },
    results_by_position: results || [],
    blank_votes: blankVotes || []
  }
}

async function getValidation(id) {
  const election = await getById(id)
  const issues = []

  // Posiciones
  const { data: positions } = await supabase
    .from('position')
    .select('position_id, name')
    .eq('election_id', id)
    .order('position_order')

  if (!positions || positions.length === 0) {
    issues.push('No hay cargos/posiciones creados')
  }

  const positionDetails = []
  if (positions) {
    for (const pos of positions) {
      const { data: cips } = await supabase
        .from('candidate_in_position')
        .select('candidate_in_position_id')
        .eq('position_id', pos.position_id)

      const count = cips ? cips.length : 0
      positionDetails.push({ name: pos.name, candidates: count })
      if (count === 0) {
        issues.push(`El cargo "${pos.name}" no tiene candidatos`)
      }
    }
  }

  // Votantes
  const { data: voters } = await supabase
    .from('election_voter')
    .select('election_voter_id')
    .eq('election_id', id)

  if (!voters || voters.length === 0) {
    issues.push('No hay votantes habilitados')
  }

  return {
    election: { election_id: election.election_id, title: election.title, status: election.status },
    is_ready: issues.length === 0,
    positions: positionDetails,
    voters_count: voters ? voters.length : 0,
    issues
  }
}

module.exports = {
  getAll, getById, create, update, remove, duplicate,
  changeStatus, getResults, getValidation
}
