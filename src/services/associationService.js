const supabase = require('../config/supabase')

async function getAllByElection(electionId) {
  const { data, error } = await supabase
    .from('association')
    .select('*, career:career_id(id, name), candidates:candidate(id, full_name, photo_url, role)')
    .eq('election_id', electionId)
    .order('name')

  if (error) throw new Error(error.message)
  return data
}

async function getById(id) {
  const { data, error } = await supabase
    .from('association')
    .select('*, career:career_id(id, name), candidates:candidate(id, full_name, photo_url, role)')
    .eq('id', id)
    .single()

  if (error) throw { status: 404, message: 'Asociacion no encontrada' }
  return data
}

async function create(electionId, { name, photo_url, career_id, min_votes, max_votes }) {
  const { data, error } = await supabase
    .from('association')
    .insert({ election_id: electionId, name, photo_url, career_id, min_votes, max_votes })
    .select('*, career:career_id(id, name)')
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function update(id, updates) {
  const updateData = { updated_at: new Date().toISOString() }
  const fields = ['name', 'photo_url', 'career_id', 'min_votes', 'max_votes']
  for (const field of fields) {
    if (updates[field] !== undefined) updateData[field] = updates[field]
  }

  const { data, error } = await supabase
    .from('association')
    .update(updateData)
    .eq('id', id)
    .select('*, career:career_id(id, name)')
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw { status: 404, message: 'Asociacion no encontrada' }
  return data
}

async function remove(id) {
  const { error } = await supabase
    .from('association')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  return true
}

module.exports = { getAllByElection, getById, create, update, remove }
