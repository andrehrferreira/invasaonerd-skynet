/**
 * API Series
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 * @revision Andre Ferreira <andre@invasaonerd.com.br>
 */

'use strict';

const requestPromise = require('request-promise'),
	movieApi = {
		urlSearch: 'https://api.themoviedb.org/3/search/tv',
		urlDetails: 'https://api.themoviedb.org/3/tv/',
		appKey: '?api_key=f1c8ddd206d8543fac2ff357ceaa9b39&query=',
		language: '&language=pt-BR',
		imageInclude: '&append_to_response=images&include_image_language=pt-BR,null'
	},
	Crawler = require("crawler")

const crawler = new Crawler({ maxConnections: 10 })

module.exports = {
	search: (req, res, mongodb, cache) => {
		const { ref } = req.params
		const { links } = req.query
		cache('api-series', ref.toLowerCase()).then(serie => {
				res.send(serie)
			})
			.catch(() => {
				requestPromise.get(movieApi.urlSearch + movieApi.appKey + encodeURI(ref) + movieApi.language + movieApi.imageInclude).then((response) => {
						Promise.all(JSON.parse(response).results.filter((s, i) => i < 10).map(serie => {
							return new Promise(resolve => {
								crawler.queue({
									uri: `https://www.imdb.com/search/title?title=${encodeURI(serie.original_name.split(' ').join('+'))}&title_type=tv_series`,
									callback: function (err, resp, done) {
										if (!err) {
											const { $ } = resp
											const imdb = $('#main > div > div > div.lister-list > div:nth-child(1) > div.lister-item-content > h3 > a')
											const rate = $('#main > div > div > div.lister-list > div:nth-child(1) > div.lister-item-content > div > div.inline-block.ratings-imdb-rating > strong').text()
											const voteCount = $('#main > div > div > div.lister-list > div:nth-child(1) > div.lister-item-content > p.sort-num_votes-visible > span:nth-child(2)').text()
											if (voteCount) serie.vote_count = voteCount
											if (rate) serie.vote_average = parseFloat(rate)
											if (imdb.length) serie.imdb = imdb[0].attribs.href.split('/')[2]
											resolve(serie)
										}
										done()
									}
								})
							})
						})).then(series => {
							cache('api-series', ref.toLowerCase(), series, 'inAweek')
							res.send(series)
						})
					})
					.catch(err => {
						console.log(err)
						res.send([])
					})
			})
	},

	details: (req, res, mongodb, cache) => {
		const { ref } = req.params
		cache('api-series-details', ref.toLowerCase()).then(serie => {
			res.send(serie)
		})
		.catch(() => {
			requestPromise.get(movieApi.urlDetails + encodeURI(ref) + movieApi.appKey + movieApi.language + movieApi.imageInclude).then((response) => {
				const serie = JSON.parse(response)
				serie.images.backdrops = serie.images.backdrops.filter((image, index) => {
					return index < 20
				})
				cache('api-series-details', ref.toLowerCase(), serie, 'inAweek')
				res.send(serie)
			})
		})
	},

	seasonDetails(req, res, mongodb, cache) {
		const {
			serieId,
			seasonNumber
		} = req.query
		cache('api-season-details', serieId + '-' + seasonNumber).then(season => {
				res.send(season)
			})
			.catch(() => {
				requestPromise.get(movieApi.urlDetails + encodeURI(serieId) + '/season/' + encodeURI(seasonNumber) + movieApi.appKey + movieApi.language + movieApi.imageInclude).then((response) => {
					const season = JSON.parse(response)
					if (season.episodes.length) {
						cache('api-season-details', serieId + '-' + seasonNumber, season, 'inAweek')
						res.send(season)
					} else {
						cache('api-season-details', serieId + '-' + seasonNumber, season, 'inAweek')
						res.send(season)
					}
				})
			})
	}
}

function storeSeries(db, data) {}
