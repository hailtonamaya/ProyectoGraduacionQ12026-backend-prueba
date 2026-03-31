const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Cliente principal - para operaciones generales del backend
// Usa service_role key para bypasear RLS
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Cliente admin dedicado - para operaciones sensibles (ballot, votes)
// Nunca se contamina con tokens de usuario
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

if (!supabase) {
  console.error('Error connecting to Supabase')
} else {
  console.log('Connected to Supabase')
}

module.exports = { supabase, supabaseAdmin }
