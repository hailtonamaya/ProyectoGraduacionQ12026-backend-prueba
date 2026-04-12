const { supabase } = require('../config/supabase')

async function getAllByElection(electionId) {
  const { data, error } = await supabase
    .from('position')
    .select(`
      *,
      candidates:candidate_in_position(
        candidate_in_position_id,
        candidate:candidate_id(candidate_id, full_name, bio, photo_url, organization:organization_id(name, code))
      )
    `)
    .eq('election_id', electionId)
    .order('position_order')

  if (error) throw new Error(error.message)
  return data
}

async function getById(id) {
  const { data, error } = await supabase
    .from('position')
    .select(`
      *,
      candidates:candidate_in_position(
        candidate_in_position_id,
        candidate:candidate_id(candidate_id, full_name, bio, photo_url, organization:organization_id(name, code))
      )
    `)
    .eq('position_id', id)
    .single()

  if (error) throw { status: 404, message: 'Cargo no encontrado' }
  return data
}

async function create(electionId, { name, min_votes, max_votes, allows_blank, position_order }) {
  const { data, error } = await supabase
    .from('position')
    .insert({
      election_id: electionId,
      name,
      min_votes: min_votes || 1,
      max_votes: max_votes || 1,
      allows_blank: allows_blank !== undefined ? allows_blank : true,
      position_order: position_order || 1
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function update(id, updates) {
  const allowed = ['name', 'min_votes', 'max_votes', 'allows_blank', 'position_order']
  const updateData = {}
  for (const field of allowed) {
    if (updates[field] !== undefined) updateData[field] = updates[field]
  }

  const { data, error } = await supabase
    .from('position')
    .update(updateData)
    .eq('position_id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw { status: 404, message: 'Cargo no encontrado' }
  return data
}

async function remove(id) {
  const { error } = await supabase
    .from('position')
    .delete()
    .eq('position_id', id)

  if (error) throw new Error(error.message)
  return true
}

async function addCandidate(positionId, candidateId) {
  const { data, error } = await supabase
    .from('candidate_in_position')
    .insert({ position_id: positionId, candidate_id: candidateId })
    .select(`
      candidate_in_position_id,
      candidate:candidate_id(candidate_id, full_name, photo_url)
    `)
    .single()

  if (error) {
    if (error.code === '23505') {
      throw { status: 409, message: 'Este candidato ya esta asignado a este cargo' }
    }
    throw new Error(error.message)
  }
  return data
}

async function removeCandidate(candidateInPositionId) {
  const { error } = await supabase
    .from('candidate_in_position')
    .delete()
    .eq('candidate_in_position_id', candidateInPositionId)

  if (error) throw new Error(error.message)
  return true
}

module.exports = { getAllByElection, getById, create, update, remove, addCandidate, removeCandidate }
