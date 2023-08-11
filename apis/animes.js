var kitsu = require('node-kitsu');

kitsu.searchAnime('dragon ball z', 0).then(results => {
    console.log(results[0])
});
