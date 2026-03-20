const supabase = require('../config/supabase')

async function getAll(campusId) {
  let query = supabase
    .from('career')
    .select('*, campus(id, name)')
    .eq('is_active', true)
    .order('name')

  if (campusId) {
    query = query.eq('campus_id', campusId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

async function getById(id) {
  const { data, error } = await supabase
    .from('career')
    .select('*, campus(id, name)')
    .eq('id', id)
    .single()

  if (error) throw { status: 404, message: 'Carrera no encontrada' }
  return data
}

async function create({ name, campus_id }) {
  const { data, error } = await supabase
    .from('career')
    .insert({ name, campus_id })
    .select('*, campus(id, name)')
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function update(id, updates) {
  const updateData = {}
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.campus_id !== undefined) updateData.campus_id = updates.campus_id
  if (updates.is_active !== undefined) updateData.is_active = updates.is_active

  const { data, error } = await supabase
    .from('career')
    .update(updateData)
    .eq('id', id)
    .select('*, campus(id, name)')
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw { status: 404, message: 'Carrera no encontrada' }
  return data
}

async function remove(id) {
  const { error } = await supabase
    .from('career')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  return true
}

module.exports = { getAll, getById, create, update, remove }
