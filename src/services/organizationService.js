const { supabase } = require('../config/supabase')

async function getAll() {
  const { data, error } = await supabase
    .from('organization')
    .select('*')
    .order('name')

  if (error) throw new Error(error.message)
  return data
}

async function getById(id) {
  const { data, error } = await supabase
    .from('organization')
    .select('*')
    .eq('organization_id', id)
    .single()

  if (error) throw { status: 404, message: 'Organizacion no encontrada' }
  return data
}

async function create({ name, code }) {
  const { data, error } = await supabase
    .from('organization')
    .insert({ name, code })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw { status: 409, message: 'Ya existe una organizacion con ese codigo' }
    }
    throw new Error(error.message)
  }
  return data
}

async function update(id, updates) {
  const updateData = {}
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.code !== undefined) updateData.code = updates.code

  const { data, error } = await supabase
    .from('organization')
    .update(updateData)
    .eq('organization_id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw { status: 409, message: 'Ya existe una organizacion con ese codigo' }
    }
    throw new Error(error.message)
  }
  if (!data) throw { status: 404, message: 'Organizacion no encontrada' }
  return data
}

async function remove(id) {
  const { error } = await supabase
    .from('organization')
    .delete()
    .eq('organization_id', id)

  if (error) throw new Error(error.message)
  return true
}

module.exports = { getAll, getById, create, update, remove }
