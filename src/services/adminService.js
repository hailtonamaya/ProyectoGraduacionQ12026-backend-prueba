const bcrypt = require('bcryptjs')
const supabase = require('../config/supabase')

async function getAll() {
  const { data, error } = await supabase
    .from('admin')
    .select('id, email, full_name, role, is_active, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

async function getById(id) {
  const { data, error } = await supabase
    .from('admin')
    .select('id, email, full_name, role, is_active, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error) throw { status: 404, message: 'Administrador no encontrado' }
  return data
}

async function create({ email, password, full_name, role = 'admin' }) {
  const password_hash = await bcrypt.hash(password, 10)

  const { data, error } = await supabase
    .from('admin')
    .insert({ email, password_hash, full_name, role })
    .select('id, email, full_name, role, is_active, created_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw { status: 409, message: 'Ya existe un administrador con ese email' }
    }
    throw new Error(error.message)
  }
  return data
}

async function update(id, updates) {
  const updateData = { updated_at: new Date().toISOString() }
  if (updates.full_name) updateData.full_name = updates.full_name
  if (updates.email) updateData.email = updates.email
  if (updates.role) updateData.role = updates.role
  if (updates.is_active !== undefined) updateData.is_active = updates.is_active

  const { data, error } = await supabase
    .from('admin')
    .update(updateData)
    .eq('id', id)
    .select('id, email, full_name, role, is_active, created_at, updated_at')
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw { status: 404, message: 'Administrador no encontrado' }
  return data
}

async function deactivate(id) {
  return update(id, { is_active: false })
}

async function remove(id) {
  const { error } = await supabase
    .from('admin')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  return true
}

module.exports = { getAll, getById, create, update, deactivate, remove }
