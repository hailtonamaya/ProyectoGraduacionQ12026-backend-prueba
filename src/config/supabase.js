const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

// comprobar si se conecto a supabase
if(!supabase) {
  console.error('Error connecting to Supabase')
} else {
  console.log('Connected to Supabase')
}

module.exports = supabase