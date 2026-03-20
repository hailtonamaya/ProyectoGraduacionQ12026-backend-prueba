const supabase = require('../config/supabase')

async function getAll() {
  const { data, error } = await supabase
    .from('campus')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw new Error(error.message)
  return data
}

async function getById(id) {
  const { data, error } = await supabase
    .from('campus')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw { status: 404, message: 'Campus no encontrado' }
  return data
}

async function create({ name }) {
  const { data, error } = await supabase
    .from('campus')
    .insert({ name })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') throw { status: 409, message: 'Ya existe un campus con ese nombre' }
    throw new Error(error.message)
  }
  return data
}

async function update(id, { name, is_active }) {
  const updateData = {}
  if (name !== undefined) updateData.name = name
  if (is_active !== undefined) updateData.is_active = is_active

  const { data, error } = await supabase
    .from('campus')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw { status: 404, message: 'Campus no encontrado' }
  return data
}

async function remove(id) {
  const { error } = await supabase
    .from('campus')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  return true
}

module.exports = { getAll, getById, create, update, remove }
