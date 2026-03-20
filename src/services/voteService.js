const supabase = require('../config/supabase')

async function castVote(voterId, electionId, associationId) {
  // Verificar que el votante existe y no ha votado
  const { data: voter, error: voterError } = await supabase
    .from('voter')
    .select('id, has_voted, election_id')
    .eq('id', voterId)
    .eq('election_id', electionId)
    .single()

  if (voterError || !voter) {
    throw { status: 404, message: 'Votante no encontrado en esta eleccion' }
  }

  if (voter.has_voted) {
    throw { status: 400, message: 'Ya has emitido tu voto' }
  }

  // Verificar que la eleccion esta activa
  const { data: election } = await supabase
    .from('election')
    .select('status')
    .eq('id', electionId)
    .single()

  if (!election || election.status !== 'active') {
    throw { status: 400, message: 'La eleccion no esta activa' }
  }

  const isBlank = !associationId

  // Si no es voto en blanco, verificar que la asociacion pertenece a la eleccion
  if (!isBlank) {
    const { data: association } = await supabase
      .from('association')
      .select('id')
      .eq('id', associationId)
      .eq('election_id', electionId)
      .single()

    if (!association) {
      throw { status: 400, message: 'Asociacion no valida para esta eleccion' }
    }
  }

  // Registrar voto
  const { data: vote, error: voteError } = await supabase
    .from('vote')
    .insert({
      election_id: electionId,
      voter_id: voterId,
      association_id: isBlank ? null : associationId,
      is_blank: isBlank
    })
    .select()
    .single()

  if (voteError) {
    if (voteError.code === '23505') {
      throw { status: 400, message: 'Ya has emitido tu voto' }
    }
    throw new Error(voteError.message)
  }

  // Marcar votante como que ya voto
  await supabase
    .from('voter')
    .update({ has_voted: true })
    .eq('id', voterId)

  return { message: 'Voto registrado exitosamente', vote_id: vote.id }
}

async function getVoterStatus(voterId, electionId) {
  const { data: voter, error } = await supabase
    .from('voter')
    .select('id, full_name, has_voted')
    .eq('id', voterId)
    .eq('election_id', electionId)
    .single()

  if (error) throw { status: 404, message: 'Votante no encontrado' }
  return voter
}

async function getElectionForVoter(electionId) {
  const { data: election, error } = await supabase
    .from('election')
    .select('id, name, description, status')
    .eq('id', electionId)
    .eq('status', 'active')
    .single()

  if (error) throw { status: 404, message: 'Eleccion no encontrada o no activa' }

  const { data: associations } = await supabase
    .from('association')
    .select('id, name, photo_url, career:career_id(id, name), candidates:candidate(id, full_name, photo_url, role)')
    .eq('election_id', electionId)
    .order('name')

  return { election, associations }
}

module.exports = { castVote, getVoterStatus, getElectionForVoter }
