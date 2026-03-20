const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const supabase = require('../config/supabase')

async function loginAdmin(email, password) {
  const { data: admin, error } = await supabase
    .from('admin')
    .select('*')
    .eq('email', email)
    .eq('is_active', true)
    .single()

  if (error || !admin) {
    throw { status: 401, message: 'Credenciales invalidas' }
  }

  const validPassword = await bcrypt.compare(password, admin.password_hash)
  if (!validPassword) {
    throw { status: 401, message: 'Credenciales invalidas' }
  }

  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role, type: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  )

  const { password_hash, ...adminData } = admin
  return { token, admin: adminData }
}

async function loginVoter(email, votingCode) {
  const { data: voter, error } = await supabase
    .from('voter')
    .select('*, election!inner(id, name, status)')
    .eq('email', email)
    .eq('voting_code', votingCode)
    .eq('election.status', 'active')
    .single()

  if (error || !voter) {
    throw { status: 401, message: 'Credenciales invalidas o eleccion no activa' }
  }

  if (voter.has_voted) {
    throw { status: 403, message: 'Ya has emitido tu voto en esta eleccion' }
  }

  const token = jwt.sign(
    { id: voter.id, email: voter.email, election_id: voter.election_id, type: 'voter' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  )

  return { token, voter: { id: voter.id, full_name: voter.full_name, election: voter.election } }
}

async function getProfile(adminId) {
  const { data, error } = await supabase
    .from('admin')
    .select('id, email, full_name, role, is_active, created_at')
    .eq('id', adminId)
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function updateProfile(adminId, updates) {
  const updateData = { updated_at: new Date().toISOString() }
  if (updates.full_name) updateData.full_name = updates.full_name
  if (updates.email) updateData.email = updates.email

  const { data, error } = await supabase
    .from('admin')
    .update(updateData)
    .eq('id', adminId)
    .select('id, email, full_name, role, is_active, created_at')
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function changePassword(adminId, currentPassword, newPassword) {
  const { data: admin, error: fetchError } = await supabase
    .from('admin')
    .select('password_hash')
    .eq('id', adminId)
    .single()

  if (fetchError) throw new Error(fetchError.message)

  const valid = await bcrypt.compare(currentPassword, admin.password_hash)
  if (!valid) {
    throw { status: 400, message: 'Contrasena actual incorrecta' }
  }

  const password_hash = await bcrypt.hash(newPassword, 10)
  const { error } = await supabase
    .from('admin')
    .update({ password_hash, updated_at: new Date().toISOString() })
    .eq('id', adminId)

  if (error) throw new Error(error.message)
  return true
}

module.exports = { loginAdmin, loginVoter, getProfile, updateProfile, changePassword }
