const supabase = require('../config/supabase')

async function getCandidates() {
  const { data, error } = await supabase
    .from('candidate')
    .select('*')
    .limit(10)

  if (error) {
    throw new Error(error.message)
  }

  return data
}

async function getCandidatesInPosition() {
  const { data, error } = await supabase
    .from('candidate_in_position')
    .select('*')
    .limit(10)

  if (error) {
    throw new Error(error.message)
  }

  return data
}

module.exports = {
  getCandidates,
  getCandidatesInPosition
}