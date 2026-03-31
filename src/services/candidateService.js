const { supabase } = require('../config/supabase')

async function getAll({ organization_id, search } = {}) {
  let query = supabase
    .from('candidate')
    .select('*, organization:organization_id(organization_id, name, code)')
    .order('full_name')

  if (organization_id) query = query.eq('organization_id', organization_id)
  if (search) query = query.ilike('full_name', `%${search}%`)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

async function getById(id) {
  const { data, error } = await supabase
    .from('candidate')
    .select('*, organization:organization_id(organization_id, name, code)')
    .eq('candidate_id', id)
    .single()

  if (error) throw { status: 404, message: 'Candidato no encontrado' }
  return data
}

async function create({ full_name, bio, photo_url, organization_id }) {
  const { data, error } = await supabase
    .from('candidate')
    .insert({ full_name, bio, photo_url, organization_id })
    .select('*, organization:organization_id(organization_id, name, code)')
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function bulkCreate(candidates) {
  const rows = candidates.map(c => ({
    full_name: c.full_name,
    bio: c.bio || null,
    photo_url: c.photo_url || null,
    organization_id: c.organization_id || null
  }))

  const { data, error } = await supabase
    .from('candidate')
    .insert(rows)
    .select('*, organization:organization_id(organization_id, name, code)')

  if (error) throw new Error(error.message)
  return data
}

async function update(id, updates) {
  const allowed = ['full_name', 'bio', 'photo_url', 'organization_id']
  const updateData = {}
  for (const field of allowed) {
    if (updates[field] !== undefined) updateData[field] = updates[field]
  }

  const { data, error } = await supabase
    .from('candidate')
    .update(updateData)
    .eq('candidate_id', id)
    .select('*, organization:organization_id(organization_id, name, code)')
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw { status: 404, message: 'Candidato no encontrado' }
  return data
}

async function remove(id) {
  const { error } = await supabase
    .from('candidate')
    .delete()
    .eq('candidate_id', id)

  if (error) throw new Error(error.message)
  return true
}

module.exports = { getAll, getById, create, bulkCreate, update, remove }
