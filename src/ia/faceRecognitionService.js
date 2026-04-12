const { supabase } = require('../config/supabase')

function euclideanDistance(desc1, desc2) {
  let sum = 0
  for (let i = 0; i < desc1.length; i++) {
    sum += Math.pow(desc1[i] - desc2[i], 2)
  }
  return Math.sqrt(sum)
}

async function registerFace(email, fullName, descriptor) {
  if (!Array.isArray(descriptor) || descriptor.length !== 128) {
    throw { status: 400, message: 'Descriptor facial invalido (debe ser array de 128 valores)' }
  }

  const { data, error } = await supabase
    .from('face_registration')
    .upsert({
      email,
      full_name: fullName,
      face_descriptor: descriptor,
      created_at: new Date().toISOString()
    }, { onConflict: 'email' })
    .select()
    .single()

  if (error) throw { status: 500, message: error.message }

  return {
    face_id: data.face_id,
    email: data.email,
    full_name: data.full_name
  }
}

async function verifyFace(email, descriptor) {
  if (!Array.isArray(descriptor) || descriptor.length !== 128) {
    throw { status: 400, message: 'Descriptor facial invalido (debe ser array de 128 valores)' }
  }

  const { data: registration, error } = await supabase
    .from('face_registration')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !registration) {
    throw { status: 404, message: 'No se encontro registro facial para este email' }
  }

  const storedDescriptor = registration.face_descriptor
  const distance = euclideanDistance(descriptor, storedDescriptor)
  const threshold = 0.6
  const match = distance < threshold
  const confidence = Math.max(0, Math.min(100, ((threshold - distance) / threshold) * 100))

  return {
    match,
    distance: parseFloat(distance.toFixed(4)),
    threshold,
    confidence: parseFloat(confidence.toFixed(2)),
    full_name: match ? registration.full_name : null,
    email: match ? registration.email : null
  }
}

module.exports = { registerFace, verifyFace, euclideanDistance }
