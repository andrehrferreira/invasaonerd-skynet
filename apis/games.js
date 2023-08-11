const igdb = require('igdb-api-node').default;
const client = igdb('a2e0b2bacda809e39ac98c8c6d1c8486');

client.games({
    search: 'Harry Potter', // Return all fields
    limit: 30, // Limit to 5 results
    offset: 0 // Index offset for results
}, [
    'name',
    'rating',
    'cover',
    'developers',
    'videos',
    'websites'
]).then(response => {
    // response.body contains the parsed JSON response to this query
    console.log(response.body );
}).catch(error => {
    throw error;
});
