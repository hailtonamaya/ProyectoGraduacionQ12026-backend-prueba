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

  const valid = await bcrypt.compare(password, admin.password_hash)
  if (!valid) {
    throw { status: 401, message: 'Credenciales invalidas' }
  }

  const token = jwt.sign(
    { id: admin.admin_id, email: admin.email, role: admin.role, type: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  )

  const { password_hash, ...adminData } = admin
  return { token, admin: adminData }
}

async function loginVoter(email, password) {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (authError) {
    throw { status: 401, message: 'Credenciales invalidas' }
  }

  const { data: voter, error: voterError } = await supabase
    .from('voter_profile')
    .select('*, organization:organization_id(organization_id, name, code)')
    .eq('auth_user_id', authData.user.id)
    .eq('is_active', true)
    .single()

  if (voterError || !voter) {
    throw { status: 401, message: 'Perfil de votante no encontrado o inactivo' }
  }

  return {
    token: authData.session.access_token,
    voter: {
      voter_id: voter.voter_id,
      full_name: voter.full_name,
      institutional_id: voter.institutional_id,
      organization: voter.organization
    }
  }
}

async function getAdminProfile(adminId) {
  const { data, error } = await supabase
    .from('admin')
    .select('admin_id, email, full_name, role, is_active, created_at')
    .eq('admin_id', adminId)
    .single()

  if (error) throw { status: 404, message: 'Administrador no encontrado' }
  return data
}

async function updateAdminProfile(adminId, updates) {
  const updateData = { updated_at: new Date().toISOString() }
  if (updates.full_name) updateData.full_name = updates.full_name
  if (updates.email) updateData.email = updates.email

  const { data, error } = await supabase
    .from('admin')
    .update(updateData)
    .eq('admin_id', adminId)
    .select('admin_id, email, full_name, role, is_active, created_at')
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function changePassword(adminId, currentPassword, newPassword) {
  const { data: admin, error: fetchError } = await supabase
    .from('admin')
    .select('password_hash')
    .eq('admin_id', adminId)
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
    .eq('admin_id', adminId)

  if (error) throw new Error(error.message)
  return true
}

module.exports = { loginAdmin, loginVoter, getAdminProfile, updateAdminProfile, changePassword }
