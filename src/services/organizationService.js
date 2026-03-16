const supabase = require('../config/supabase')

async function getOrganizations() {
    const { data, error } = await supabase
    .from('organization')
    .select('*')

    if (error) {
        throw new Error(error.message)
    }
    return data
}

module.exports = {
    getOrganizations
}