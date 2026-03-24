const supabase = require('../config/supabase')

// --- Voter Profiles ---

async function getAllProfiles({ organization_id, search } = {}) {
  let query = supabase
    .from('voter_profile')
    .select('*, organization:organization_id(organization_id, name, code)')
    .eq('is_active', true)
    .order('full_name')

  if (organization_id) query = query.eq('organization_id', organization_id)
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,institutional_id.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

async function getProfileById(id) {
  const { data, error } = await supabase
    .from('voter_profile')
    .select('*, organization:organization_id(organization_id, name, code)')
    .eq('voter_id', id)
    .single()

  if (error) throw { status: 404, message: 'Votante no encontrado' }
  return data
}

async function createProfile({ institutional_id, full_name, organization_id, email, password }) {
  // Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (authError) {
    if (authError.message.includes('already')) {
      throw { status: 409, message: 'Ya existe un usuario con ese email' }
    }
    throw new Error(authError.message)
  }

  // Crear perfil de votante
  const { data, error } = await supabase
    .from('voter_profile')
    .insert({
      auth_user_id: authData.user.id,
      institutional_id,
      full_name,
      organization_id
    })
    .select('*, organization:organization_id(organization_id, name, code)')
    .single()

  if (error) {
    // Rollback: eliminar usuario auth si falla el perfil
    await supabase.auth.admin.deleteUser(authData.user.id)
    if (error.code === '23505') {
      throw { status: 409, message: 'Ya existe un votante con ese numero de cuenta' }
    }
    throw new Error(error.message)
  }

  return data
}

async function updateProfile(id, updates) {
  const allowed = ['full_name', 'organization_id', 'is_active']
  const updateData = {}
  for (const field of allowed) {
    if (updates[field] !== undefined) updateData[field] = updates[field]
  }

  const { data, error } = await supabase
    .from('voter_profile')
    .update(updateData)
    .eq('voter_id', id)
    .select('*, organization:organization_id(organization_id, name, code)')
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw { status: 404, message: 'Votante no encontrado' }
  return data
}

async function removeProfile(id) {
  // Obtener auth_user_id para eliminar de Supabase Auth
  const { data: profile } = await supabase
    .from('voter_profile')
    .select('auth_user_id')
    .eq('voter_id', id)
    .single()

  const { error } = await supabase
    .from('voter_profile')
    .delete()
    .eq('voter_id', id)

  if (error) throw new Error(error.message)

  // Eliminar usuario auth
  if (profile?.auth_user_id) {
    await supabase.auth.admin.deleteUser(profile.auth_user_id)
  }

  return true
}

// --- Election Voters (habilitacion) ---

async function getByElection(electionId, { search } = {}) {
  let query = supabase
    .from('election_voter')
    .select(`
      election_voter_id,
      has_voted,
      voted_at,
      voter:voter_id(voter_id, full_name, institutional_id, organization:organization_id(name, code))
    `)
    .eq('election_id', electionId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

async function enableVoter(electionId, voterId) {
  const { data, error } = await supabase
    .from('election_voter')
    .insert({ election_id: electionId, voter_id: voterId })
    .select(`
      election_voter_id,
      has_voted,
      voter:voter_id(voter_id, full_name, institutional_id)
    `)
    .single()

  if (error) {
    if (error.code === '23505') {
      throw { status: 409, message: 'Este votante ya esta habilitado en esta eleccion' }
    }
    throw new Error(error.message)
  }
  return data
}

async function bulkEnableVoters(electionId, voterIds) {
  const rows = voterIds.map(voter_id => ({
    election_id: electionId,
    voter_id
  }))

  const { data, error } = await supabase
    .from('election_voter')
    .insert(rows)
    .select('election_voter_id, voter:voter_id(voter_id, full_name, institutional_id)')

  if (error) throw new Error(error.message)
  return data
}

async function disableVoter(electionVoterId) {
  const { error } = await supabase
    .from('election_voter')
    .delete()
    .eq('election_voter_id', electionVoterId)

  if (error) throw new Error(error.message)
  return true
}

module.exports = {
  getAllProfiles, getProfileById, createProfile, updateProfile, removeProfile,
  getByElection, enableVoter, bulkEnableVoters, disableVoter
}
