const supabase = require('../config/supabase')

async function getElections() {
    const { data, error } = await supabase
        .from('election')
        .select('*')
    
    if (error) {
        throw new Error(error.message)
    }

    return data
}

module.exports = {
    getElections
}