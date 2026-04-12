const { supabase, supabaseAdmin } = require('../config/supabase')

async function getElectionForVoter(authUserId) {
  const { data: voter, error: voterError } = await supabase
    .from('voter_profile')
    .select('voter_id, full_name, organization:organization_id(name, code)')
    .eq('auth_user_id', authUserId)
    .single()

  if (voterError || !voter) {
    throw { status: 404, message: 'Perfil de votante no encontrado' }
  }

  const { data: enablements } = await supabase
    .from('election_voter')
    .select(`
      election_voter_id,
      has_voted,
      election:election_id(
        election_id, title, description, status, start_at, end_at,
        organization:organization_id(name, code)
      )
    `)
    .eq('voter_id', voter.voter_id)
    .eq('has_voted', false)

  const activeElections = (enablements || [])
    .filter(e => e.election && e.election.status === 'open')

  return { voter, elections: activeElections }
}

async function getElectionBallot(electionId, authUserId) {
  const { data: voter } = await supabase
    .from('voter_profile')
    .select('voter_id')
    .eq('auth_user_id', authUserId)
    .single()

  if (!voter) throw { status: 404, message: 'Perfil de votante no encontrado' }

  const { data: ev } = await supabase
    .from('election_voter')
    .select('election_voter_id, has_voted')
    .eq('election_id', electionId)
    .eq('voter_id', voter.voter_id)
    .single()

  if (!ev) throw { status: 403, message: 'No estas habilitado para votar en esta eleccion' }
  if (ev.has_voted) throw { status: 400, message: 'Ya emitiste tu voto en esta eleccion' }

  const { data: election } = await supabase
    .from('election')
    .select('election_id, title, description, organization:organization_id(name)')
    .eq('election_id', electionId)
    .eq('status', 'open')
    .single()

  if (!election) throw { status: 404, message: 'Eleccion no encontrada o no esta abierta' }

  const { data: positions } = await supabase
    .from('position')
    .select(`
      position_id, name, min_votes, max_votes, allows_blank, position_order,
      candidates:candidate_in_position(
        candidate_in_position_id,
        candidate:candidate_id(candidate_id, full_name, bio, photo_url, organization:organization_id(name, code))
      )
    `)
    .eq('election_id', electionId)
    .order('position_order')

  return { election, positions: positions || [] }
}

async function castVote(electionId, authUserId, votes) {
  const { data: voter } = await supabase
    .from('voter_profile')
    .select('voter_id')
    .eq('auth_user_id', authUserId)
    .single()

  if (!voter) throw { status: 404, message: 'Perfil de votante no encontrado' }

  const { data: ev } = await supabase
    .from('election_voter')
    .select('election_voter_id, has_voted')
    .eq('election_id', electionId)
    .eq('voter_id', voter.voter_id)
    .single()

  if (!ev) throw { status: 403, message: 'No estas habilitado para votar en esta eleccion' }
  if (ev.has_voted) throw { status: 400, message: 'Ya emitiste tu voto' }

  const { data: election } = await supabase
    .from('election')
    .select('status')
    .eq('election_id', electionId)
    .single()

  if (!election || election.status !== 'open') {
    throw { status: 400, message: 'La eleccion no esta abierta' }
  }

  const { data: positions } = await supabase
    .from('position')
    .select('position_id, name, allows_blank')
    .eq('election_id', electionId)

  const positionIds = new Set(positions.map(p => p.position_id))
  const votedPositions = new Set(votes.map(v => v.position_id))

  for (const pos of positions) {
    if (!votedPositions.has(pos.position_id)) {
      throw { status: 400, message: `Falta voto para el cargo: ${pos.name}` }
    }
  }

  for (const vote of votes) {
    if (!positionIds.has(vote.position_id)) {
      throw { status: 400, message: 'Posicion no pertenece a esta eleccion' }
    }

    if (!vote.is_blank && vote.candidate_in_position_id) {
      const { data: cip } = await supabase
        .from('candidate_in_position')
        .select('candidate_in_position_id')
        .eq('candidate_in_position_id', vote.candidate_in_position_id)
        .eq('position_id', vote.position_id)
        .single()

      if (!cip) {
        throw { status: 400, message: 'Candidato no valido para esta posicion' }
      }
    }
  }

  // supabaseAdmin para bypass de RLS
  const { data: ballot, error: ballotError } = await supabaseAdmin
    .from('ballot')
    .insert({ election_id: electionId })
    .select()
    .single()

  if (ballotError) throw new Error(ballotError.message)

  const ballotVotes = votes.map(v => ({
    ballot_id: ballot.ballot_id,
    position_id: v.position_id,
    candidate_in_position_id: v.is_blank ? null : v.candidate_in_position_id,
    is_blank: v.is_blank || false
  }))

  const { error: votesError } = await supabaseAdmin
    .from('ballot_vote')
    .insert(ballotVotes)

  if (votesError) {
    await supabaseAdmin.from('ballot').delete().eq('ballot_id', ballot.ballot_id)
    throw new Error(votesError.message)
  }

  const { error: updateError } = await supabaseAdmin
    .from('election_voter')
    .update({ has_voted: true, voted_at: new Date().toISOString() })
    .eq('election_voter_id', ev.election_voter_id)

  if (updateError) throw new Error(updateError.message)

  return { message: 'Voto registrado exitosamente', ballot_id: ballot.ballot_id }
}

async function getVoterStatus(electionId, authUserId) {
  const { data: voter } = await supabase
    .from('voter_profile')
    .select('voter_id, full_name')
    .eq('auth_user_id', authUserId)
    .single()

  if (!voter) throw { status: 404, message: 'Votante no encontrado' }

  const { data: ev } = await supabase
    .from('election_voter')
    .select('has_voted, voted_at')
    .eq('election_id', electionId)
    .eq('voter_id', voter.voter_id)
    .single()

  return {
    voter_id: voter.voter_id,
    full_name: voter.full_name,
    has_voted: ev ? ev.has_voted : false,
    voted_at: ev ? ev.voted_at : null
  }
}

module.exports = { getElectionForVoter, getElectionBallot, castVote, getVoterStatus }
