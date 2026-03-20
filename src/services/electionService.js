const supabase = require('../config/supabase')

async function getAll({ status, search } = {}) {
  let query = supabase
    .from('election')
    .select('*, campus(id, name), admin:created_by(id, full_name)')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

async function getById(id) {
  const { data, error } = await supabase
    .from('election')
    .select('*, campus(id, name), admin:created_by(id, full_name)')
    .eq('id', id)
    .single()

  if (error) throw { status: 404, message: 'Eleccion no encontrada' }
  return data
}

async function create({ name, description, campus_id, start_date, end_date, created_by }) {
  const { data, error } = await supabase
    .from('election')
    .insert({ name, description, campus_id, start_date, end_date, status: 'draft', created_by })
    .select('*, campus(id, name)')
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function update(id, updates) {
  const updateData = { updated_at: new Date().toISOString() }
  const fields = ['name', 'description', 'campus_id', 'start_date', 'end_date']
  for (const field of fields) {
    if (updates[field] !== undefined) updateData[field] = updates[field]
  }

  const { data, error } = await supabase
    .from('election')
    .update(updateData)
    .eq('id', id)
    .select('*, campus(id, name)')
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw { status: 404, message: 'Eleccion no encontrada' }
  return data
}

async function remove(id) {
  const election = await getById(id)
  if (election.status === 'active') {
    throw { status: 400, message: 'No se puede eliminar una eleccion activa' }
  }

  const { error } = await supabase
    .from('election')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  return true
}

async function duplicate(id) {
  const original = await getById(id)
  const { data, error } = await supabase
    .from('election')
    .insert({
      name: `${original.name} (copia)`,
      description: original.description,
      campus_id: original.campus_id,
      status: 'draft',
      created_by: original.created_by
    })
    .select('*, campus(id, name)')
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function changeStatus(id, newStatus) {
  const election = await getById(id)
  const transitions = {
    draft: ['active'],
    active: ['closed'],
    closed: ['archived'],
    archived: ['draft']
  }

  const allowed = transitions[election.status] || []
  if (!allowed.includes(newStatus)) {
    throw { status: 400, message: `No se puede cambiar de '${election.status}' a '${newStatus}'` }
  }

  if (newStatus === 'active') {
    await validateElectionReady(id)
  }

  const { data, error } = await supabase
    .from('election')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, campus(id, name)')
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function validateElectionReady(electionId) {
  const { data: associations } = await supabase
    .from('association')
    .select('id')
    .eq('election_id', electionId)

  if (!associations || associations.length === 0) {
    throw { status: 400, message: 'La eleccion debe tener al menos una asociacion' }
  }

  for (const assoc of associations) {
    const { data: candidates } = await supabase
      .from('candidate')
      .select('id')
      .eq('association_id', assoc.id)

    if (!candidates || candidates.length === 0) {
      throw { status: 400, message: 'Todas las asociaciones deben tener al menos un candidato' }
    }
  }

  const { data: voters } = await supabase
    .from('voter')
    .select('id')
    .eq('election_id', electionId)

  if (!voters || voters.length === 0) {
    throw { status: 400, message: 'La eleccion debe tener al menos un votante registrado' }
  }

  return true
}

async function getResults(id) {
  const election = await getById(id)

  const { data: votes, error } = await supabase
    .from('vote')
    .select('association_id, is_blank')
    .eq('election_id', id)

  if (error) throw new Error(error.message)

  const { data: associations } = await supabase
    .from('association')
    .select('id, name, photo_url, career:career_id(id, name)')
    .eq('election_id', id)

  const { data: voters } = await supabase
    .from('voter')
    .select('id')
    .eq('election_id', id)

  const totalVoters = voters ? voters.length : 0
  const totalVotes = votes ? votes.length : 0
  const blankVotes = votes ? votes.filter(v => v.is_blank).length : 0

  const results = (associations || []).map(assoc => {
    const voteCount = votes ? votes.filter(v => v.association_id === assoc.id).length : 0
    return {
      association: assoc,
      votes: voteCount,
      percentage: totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(2) : '0.00'
    }
  }).sort((a, b) => b.votes - a.votes)

  return {
    election: { id: election.id, name: election.name, status: election.status },
    total_voters: totalVoters,
    total_votes: totalVotes,
    participation: totalVoters > 0 ? ((totalVotes / totalVoters) * 100).toFixed(2) : '0.00',
    blank_votes: blankVotes,
    results
  }
}

async function getValidation(id) {
  const election = await getById(id)

  const { data: associations } = await supabase
    .from('association')
    .select('id, name')
    .eq('election_id', id)

  const issues = []
  const associationDetails = []

  if (!associations || associations.length === 0) {
    issues.push('No hay asociaciones creadas')
  } else {
    for (const assoc of associations) {
      const { data: candidates } = await supabase
        .from('candidate')
        .select('id')
        .eq('association_id', assoc.id)

      const count = candidates ? candidates.length : 0
      associationDetails.push({ name: assoc.name, candidates: count })
      if (count === 0) {
        issues.push(`La asociacion "${assoc.name}" no tiene candidatos`)
      }
    }
  }

  const { data: voters } = await supabase
    .from('voter')
    .select('id')
    .eq('election_id', id)

  if (!voters || voters.length === 0) {
    issues.push('No hay votantes registrados')
  }

  if (!election.start_date || !election.end_date) {
    issues.push('Fechas de inicio y fin no configuradas')
  }

  return {
    election: { id: election.id, name: election.name, status: election.status },
    is_ready: issues.length === 0,
    associations: associationDetails,
    voters_count: voters ? voters.length : 0,
    issues
  }
}

module.exports = {
  getAll, getById, create, update, remove, duplicate,
  changeStatus, getResults, getValidation
}
