/**
 * API Steam
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 */

"use strict"

const request = require('request'), steamKey = 'C9C117933CC366B8FB794FC6FCD0B614'

module.exports = function (ref, cache, db, schema) {

	const GLOBAL = new GlobalInfos(request, steamKey, db, cache, schema)

	return new Promise(resolve => {
		GLOBAL.infos.cache('steam-api', 'list').then(listGames => {
			GLOBAL.getGamesDetails(listGames.filter(game => {
				return game.name.toLowerCase().includes(ref.toLowerCase())
			})).then(fullGames => {
				resolve(fullGames)
			})
		}).catch(() => {
			GLOBAL.infos.request.get({
				url: `http://api.steampowered.com/ISteamApps/GetAppList/v0002/?key=${GLOBAL.infos.steamKey}&format=json'`
			}, (err, response, body) => {
				if (err) {
					console.log(err)
					return resolve([])
				}
				const {
					apps
				} = JSON.parse(body).applist
				GLOBAL.infos.cache('steam-api', 'list', apps)
				GLOBAL.getGamesDetails(apps.filter(game => {
					return game.name.toLowerCase().includes(ref.toLowerCase())
				})).then(fullGames => {
					resolve(fullGames)
				})
			})
		})
	})
}

class GlobalInfos {
	constructor (request, steamKey, db, cache, schema) {
		this.request = request
		this.steamKey = steamKey
		this.db = db
		this.cache = cache
		this.schema = schema
	}

	get infos () {
		return {
			request: this.request,
			steamKey: this.steamKey,
			db: this.db,
			cache: this.cache,
			schema: this.schema
		}
	}

	getGamesDetails (games) {
		return Promise.all(games.map(gameInfo => {
			return new Promise(resolve => {
				this.cache('steam-game', gameInfo.appid).then(game => {
					resolve(game)
				})
				.catch(() => {
					this.getGameFromDB(gameInfo).then(game => {
						if (!game.error) {
							this.cache('steam-game', gameInfo.appid, game, 'inAday')
							resolve(game)
						} else {
							this.requestGameDetails(gameInfo).then(game => {
								if (game.success && game.data.type === 'game') {
									this.cache('steam-game', gameInfo.appid, game.data, 'inAday')
									this.saveGameOnDB({ game: game.data, id: gameInfo.appid })
									return resolve(game.data)
								}
								return resolve({})
							})
						}
					})
				})
			})
		}))
	}

	saveGameOnDB (infos) {
		const { game, id } = infos
		this.db.collection(this.schema.collections.steamgames).updateOne({ appid: id }, { $set: game }, { upsert: true })
	}

	requestGameDetails (game) {
		return new Promise(resolve => {
			this.request.get({
				url: `http://store.steampowered.com/api/appdetails?appids=${game.appid}&l=portuguese`
			}, (err, response, body) => {
				if (err) {
					resolve({ success: false })
					return console.log(err)
				}
				const fullGame = JSON.parse(body)[String(game.appid)]
				resolve(fullGame)
			})
		})
	}

	getGameFromDB (gameInfo) {
		return new Promise(resolve => {
			this.db.collection(this.schema.collections.steamgames).findOne({
				appid: gameInfo.appid
			}, (err, game) => {
				if (game === null) {
					return resolve({ error: true })
				}
				return resolve(game)
			})
		})
	}
}
