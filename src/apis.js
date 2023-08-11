/**
 * API
 * @author André Ferreira <andre@invasaonerd.com.br>
 */

"use strict";

const wiki = require('./apis/wiki'),
	books = require('./apis/books'),
	games = require('./apis/games'),
	steamGames = require('./apis/steam'),
	movies = require('./apis/movies'),
	series = require('./apis/series'),
	ChannelRequests = require('./apis/channel/methods'),
	youtubeVideos = require('./apis/yt-videos'),
	youtubeChannels = require('./apis/yt-channels'),
	youtubePlaylists = require('./apis/yt-playlist'),
	liveStrems = require('./apis/lives'),
	facebookInfo = require('./apis/facebook-info'),
	rssReader = require('./apis/rss-reader'),
	twitter = require('./apis/twitter'),
	instagram = require('./apis/instagram')

const {
	fetchFavicon
} = require('@meltwater/fetch-favicon');

module.exports = (cache, app, mongodb, schema) => {

	/* WIKIPEDIA */
	app.get("/api/wiki/:ref", (req, res) => {
		wiki(req, res, mongodb, cache)
	});

	/* BOOKS */
	app.get("/api/books/:ref", (req, res) => {
		books(req, res, mongodb, cache)
	});

	// MOVIES
	app.get("/api/movies/:ref", (req, res) => {
		movies(req, res, mongodb, cache)
	});

	// SERIES
	app.get("/api/series/:ref", (req, res) => {
		series.search(req, res, mongodb, cache)
	});

	// SERIE DETAILS
	app.get("/api/series-details/:ref", (req, res) => {
		series.details(req, res, mongodb, cache)
	});

	// SERIE SEASON DETAIL
	app.get("/api/season-details", (req, res) => {
		series.seasonDetails(req, res, mongodb, cache)
	});

	// GAMES
	app.get("/api/games/:ref", (req, res) => {
		games(req, res, mongodb, cache)
	});

	// STEAM GAMES
	app.get('/api/steamgames/:ref', (req, res) => {
		const {
			ref
		} = req.params
		steamGames(ref, cache, mongodb, schema).then(games => {
			res.send(games.filter(game => {
				return game.steam_appid !== undefined
			}))
		})
	})

	// YOUTUBE VIDEOS
	app.get("/api/yt-videos/:ref", (req, res) => {
		const {
			ref
		} = req.params;

		cache('api-yt-videos', ref.toLowerCase()).then(videos => {
			res.send(videos);
		}).catch(() => {
			youtubeVideos(ref)
				.then(videos => {
					cache('api-yt-videos', ref.toLowerCase(), videos, 'inHour')
					res.send(videos);
				});
		});
	});

	// YOUTUBE CHANNELS
	app.get("/api/yt-channels/:ref", (req, res) => {
		youtubeChannels(req, res)
	});

	// YOUTUBE PLAYLIST
	app.get('/api/yt-playlists/:ref', (req, res) => {
		youtubePlaylists(req, res)
	});

	// LIVE STREAMS
	app.get('/api/lives/:ref', (req, res) => {
		const {
			ref
		} = req.params
		liveStrems(ref).then(response => {
			res.json(response)
		})
	});

	// YOUTUBE CHANNEL BY USERNAME
	app.get("/api/yt-channel-by-username/:ref", (req, res) => {
		const { ref } = req.params
		const { url } = req.query

		cache('api-yt-channel', ref.toLowerCase()).then(channel => {
			res.send(channel);
		}).catch(err => {
			ChannelRequests.getChannelByUserName(ref, url)
				.then(channel => {
					if (url) cache('api-yt-channel', ref.toLowerCase(), channel, 'inAday')
					res.send(channel)
				})
				.catch(err => {
					console.log(err.message)
					res.sendStatus(err.status)
				})
		})
	})

	// YOUTUBE CHANNEL BY ID
	app.get("/api/yt-channel-by-id/:ref", (req, res) => {
		const {	ref } = req.params
		const { url } = req.query
		cache('api-yt-channel', ref.toLowerCase()).then(channel => {
			res.send(channel)
		}).catch(err => {
			ChannelRequests.getChannelByChannelId(ref, url)
				.then(channel => {
					if (url) cache('api-yt-channel', ref.toLowerCase(), channel, 'inAday')
					res.send(channel)
				})
				.catch(err => {
					console.log(err.message)
					res.sendStatus(err.status)
				})
		})
	})

	// YOUTUBE PLAYLISTS BY CHANNEL
	app.get("/api/yt-playlists-by-channel/:ref", (req, res) => {
		const { ref } = req.params;
		const { limit } = req.query;

		cache('api-yt-playlists' + setLimit(limit), ref.toLowerCase()).then(playlists => {
			res.send(playlists);
		}).catch(err => {
			ChannelRequests.getPlayListsChannel(ref, limit)
				.then(playlists => {
					cache('api-yt-playlists' + setLimit(limit), ref.toLowerCase(), playlists, 'inFifteenMinutes');
					res.json(playlists);
				})
				.catch(err => {
					console.log(err.message);
					res.sendStatus(err.status);
				});
		});
	})

	// YOUTUBE VIDEOS BY CHANNEL
	app.get("/api/yt-videos-by-channel/:ref", (req, res) => {
		const { ref } = req.params
		const { limit } = req.query

		cache('api-yt-videos' + setLimit(limit), ref.toLowerCase()).then(videos => {
			res.send(videos);
		}).catch(err => {
			ChannelRequests.getVideosChannel(ref, limit)
				.then(videos => {
					cache('api-yt-videos' + setLimit(limit), ref.toLowerCase(), videos, 'inFifteenMinutes');
					res.json(videos);
				})
				.catch(err => {
					console.log(err.message, ref);
					res.sendStatus(err.status);
				})
		})
	})

	// WEBSITE ICON
	app.post('/api/website-icon', (req, res) => {
		const { url } = req.body
		fetchFavicon(url).then(response => {
				res.json({
					icon: response
				})
			})
			.catch(err => {
				res.json({
					icon: false
				})
			})
	})

	app.post('/api/facebook-info', (req, res) => {
		const { url } = req.body
		facebookInfo(url, res);
	})

	app.post('/api/rss-reader', (req, res) => {
		const { url } = req.body
		cache('rss', url).then(feeds => {
			res.send(feeds)
		}).catch(() => {
			rssReader(url).then(feeds => {
				cache('rss', url, feeds, 'inHour')
				res.send(feeds)
			})
		})
	})

	app.post('/api/twitter', (req, res) => {
		const { url } = req.body
		twitter(url).then(response => {
			res.send(response)
		})
	})

	app.get('/api/instagram', async (req, res) => {
		const { link } = await req.query
		var userInfo
		try {
			userInfo = await cache('instagram', link)
		} catch (err) {
			userInfo = await instagram.getInstagramInfos(link)
			cache('instagram', link, userInfo, 'inHour')
		}
		res.send(userInfo)
	})

	app.get('/api/instagram-midia', async (req, res) => {
		const { link } = await req.query
		var midiaInfo
		try {
			midiaInfo = await cache('instagram-midia', link)
		} catch (err) {
			midiaInfo = await instagram.getInstagramUserMidia('https://www.instagram.com/p/' + link + '/')
			cache('instagram-midia', link, midiaInfo, 'inHalfHour')
		}
		res.send(midiaInfo)
	})

	// app.get('/fixdb', async (req, res) => {
	// 	try {
	// 		const pages = await mongodb.collection('pages').find({}).toArray()
	// 		await pages.map(page => {
	// 			savePage(mongodb, page)
	// 		})
	// 		await res.send('ok')
	// 	} catch(err) {
	// 		await res.send({ error: err })
	// 	}
	// })
}

// async function savePage(mongodb, page) {
// }

function setLimit(limit) {
	if (limit) return '-limit-' + limit
	return ''
}
