/**
 * API Games
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 * @revision Andre Ferreira <andre@invasaonerd.com.br>
 */

"use strict";

const IGDB = require('igdb-api-node').default,
	apiIGDB = IGDB('a2e0b2bacda809e39ac98c8c6d1c8486'),
	translate = require('translate');

translate.engine = 'yandex';
translate.key = 'trnsl.1.1.20180811T204940Z.ffe2b5cd06f8d28c.22c475c93acd6c24bba2564f7734828673d57137';

module.exports = (req, res, mongodb, cache) => {
	const ref = encodeURI(req.params.ref);

	cache('api-games', ref.toLowerCase()).then((games) => {
		res.send(games)
	}).catch(() => {
		apiIGDB.games({
			filters: { 'name': ref },
			search: ref,
			limit: 30,
			offset: 0
		}, [
			'name',
			'rating',
			'cover',
			'developers',
			'first_release_date',
			'artworks',
			'videos',
			'genres',
			'screenshots',
			'platforms',
			'summary',
			'websites'
		]).then(response => {
			translateGamesSummaries(response.body).then(games => {
				cache('api-games', ref.toLowerCase(), games, 'inAday');
				saveGamesToDatabase(mongodb, games);
				res.send(games);
			})
		}).catch(error => {
			res.send(error);
		})
	})
}

function saveGamesToDatabase(db, list) {
	list.forEach(item => {
    db.collection('api-games').updateOne({ name: item.name }, { $set: item }, { upsert: true });
	})
}

function translateGamesSummaries(games) {
	return Promise.all(games.filter(g => g.cover).map(game => {
		return new Promise((resolve, reject) => {
			translate(game.summary, {
				to: 'pt'
			}).then(text => {
				if (text) game.summary = text;
				resolve(formatImages(game))
			})
		})
	}))
}

function formatImages(game) {
	if (game.screenshots) {
		game.screenshots = game.screenshots.map((image) => {
			image.url = 'https:' + image.url.split('t_thumb').join('t_screenshot_big')
			return image
		});
	}

	if (game.artworks) {
		game.artworks = game.artworks.map((image) => {
			image.url = 'https:' + image.url.split('t_thumb').join('t_screenshot_big')
			return image
		});
	}

	game.cover.url = 'https:' + game.cover.url.split('t_thumb').join('t_720p');

	return game
}
