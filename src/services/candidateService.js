const supabase = require('../config/supabase')

async function getAllByAssociation(associationId) {
  const { data, error } = await supabase
    .from('candidate')
    .select('*')
    .eq('association_id', associationId)
    .order('created_at')

  if (error) throw new Error(error.message)
  return data
}

async function getById(id) {
  const { data, error } = await supabase
    .from('candidate')
    .select('*, association:association_id(id, name)')
    .eq('id', id)
    .single()

  if (error) throw { status: 404, message: 'Candidato no encontrado' }
  return data
}

async function create(associationId, { full_name, photo_url, role }) {
  const { data, error } = await supabase
    .from('candidate')
    .insert({ association_id: associationId, full_name, photo_url, role })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function bulkCreate(associationId, candidates) {
  const rows = candidates.map(c => ({
    association_id: associationId,
    full_name: c.full_name,
    photo_url: c.photo_url || null,
    role: c.role || null
  }))

  const { data, error } = await supabase
    .from('candidate')
    .insert(rows)
    .select()

  if (error) throw new Error(error.message)
  return data
}

async function update(id, updates) {
  const updateData = {}
  if (updates.full_name !== undefined) updateData.full_name = updates.full_name
  if (updates.photo_url !== undefined) updateData.photo_url = updates.photo_url
  if (updates.role !== undefined) updateData.role = updates.role

  const { data, error } = await supabase
    .from('candidate')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw { status: 404, message: 'Candidato no encontrado' }
  return data
}

async function remove(id) {
  const { error } = await supabase
    .from('candidate')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  return true
}

module.exports = { getAllByAssociation, getById, create, bulkCreate, update, remove }
