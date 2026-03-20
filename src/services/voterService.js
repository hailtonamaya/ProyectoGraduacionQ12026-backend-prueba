const crypto = require('crypto')
const supabase = require('../config/supabase')

function generateVotingCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase()
}

async function getAllByElection(electionId, { search } = {}) {
  let query = supabase
    .from('voter')
    .select('id, full_name, account_number, email, has_voted, career:career_id(id, name), created_at')
    .eq('election_id', electionId)
    .order('full_name')

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,account_number.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

async function getById(id) {
  const { data, error } = await supabase
    .from('voter')
    .select('id, full_name, account_number, email, has_voted, voting_code, career:career_id(id, name), created_at')
    .eq('id', id)
    .single()

  if (error) throw { status: 404, message: 'Votante no encontrado' }
  return data
}

async function create(electionId, { full_name, account_number, email, career_id }) {
  const voting_code = generateVotingCode()

  const { data, error } = await supabase
    .from('voter')
    .insert({ election_id: electionId, full_name, account_number, email, career_id, voting_code })
    .select('id, full_name, account_number, email, voting_code, career:career_id(id, name), created_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw { status: 409, message: 'Este numero de cuenta ya esta registrado en esta eleccion' }
    }
    throw new Error(error.message)
  }
  return data
}

async function bulkCreate(electionId, voters) {
  const rows = voters.map(v => ({
    election_id: electionId,
    full_name: v.full_name,
    account_number: v.account_number,
    email: v.email,
    career_id: v.career_id || null,
    voting_code: generateVotingCode()
  }))

  const { data, error } = await supabase
    .from('voter')
    .insert(rows)
    .select('id, full_name, account_number, email, voting_code, created_at')

  if (error) throw new Error(error.message)
  return data
}

async function update(id, updates) {
  const updateData = {}
  if (updates.full_name !== undefined) updateData.full_name = updates.full_name
  if (updates.account_number !== undefined) updateData.account_number = updates.account_number
  if (updates.email !== undefined) updateData.email = updates.email
  if (updates.career_id !== undefined) updateData.career_id = updates.career_id

  const { data, error } = await supabase
    .from('voter')
    .update(updateData)
    .eq('id', id)
    .select('id, full_name, account_number, email, career:career_id(id, name), created_at')
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw { status: 404, message: 'Votante no encontrado' }
  return data
}

async function remove(id) {
  const { error } = await supabase
    .from('voter')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  return true
}

module.exports = { getAllByElection, getById, create, bulkCreate, update, remove }
