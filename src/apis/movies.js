/**
 * API Filmes
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 * @revision Andre Ferreira <andre@invasaonerd.com.br>
 */

'use strict';

const requestPromise = require('request-promise')
      // nameToImdb = require("name-to-imdb");

module.exports = (req, res, mongodb, cache) => {
	const ref = req.params.ref;

	cache('api-movies', ref.toLowerCase()).then((movies) => {
		res.json(movies);
	}).catch(() => {
        const movieApi = {
        	url: 'https://api.themoviedb.org/3/search/movie',
        	appKey: '?api_key=f1c8ddd206d8543fac2ff357ceaa9b39&query=',
        	language: '&language=pt-BR',
        	imageInclude: '&append_to_response=images&include_image_language=pt-BR,null'
        }

        requestPromise.get(movieApi.url + movieApi.appKey + encodeURI(ref) + movieApi.language + movieApi.imageInclude).then((response) => {
        	const movies = JSON.parse(response).results;
        	cache('api-movies', ref.toLowerCase(), movies, 'inAday');
        	// storeMovies(mongodb, movies);
        	res.send(movies);
        })
        .catch(err => {
        	console.log(err);
        	res.send(err);
        })
	});
}

// function storeMovies(db, data) {
// 	data.forEach(d => {
// 		db.collection('api-movies').findOne({
//       name: d.original_title
// 		}, (err, movie) => {
// 			if (!movie) {
// 				nameToImdb({
// 					name: d.original_title,
// 					year: d.release_date.split('-')[0]
// 				}, (err, imdb, res) => {
// 					d.name = d.original_title
// 					d.imdb = (imdb) ? imdb : '';
// 					db.collection('api-movies').insertOne(d);
// 				})
// 			}
// 		})
// 	})
// }
