/**
 * Login, logout, token, session
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 */

"use strict";

const ObjectID = require('mongodb').ObjectID

module.exports = (_this, settings, app, mongodb, cache, schema, dirname, wallpapers) => {

	app.get(schema.routes.discovery, (req, res, next) => {
		if (req.user) next()
		else res.redirect(schema.routes.index)
	}, async (req, res, next) => {
		var user = req.user || {}
		const wallpaper = await wallpapers[Math.floor(Math.random() * wallpapers.length)]
		if (user.pass) delete user.pass
		const categories = await getCategories(cache, mongodb, schema)
		const redisClient = await cache('getRedis')
		var pages = await new Promise(rsv => {
			redisClient.keys('*index*', async function (err, keys) {
				if (err || keys.length === 0) {
					rsv(await getPagesByCategories(categories, mongodb, cache, schema, settings))
				} else {
					var pgs = await Promise.all(keys.map(key => {
						return new Promise(resolve => {
							redisClient.get(key, (err, data) => {
								if (data) resolve(JSON.parse(data))
								else resolve({})
							})
						})
					}))
					rsv(await pgs.filter(page => page.ref))
				}
			})
		})
		await res.render(schema.templates.indexWithLogin, {
			wallpaper,
			categories,
			pages,
			user
		})
	})

	app.get(schema.routes.index, async (req, res, next) => {
		var user = req.user || {}
		const wallpaper = await wallpapers[Math.floor(Math.random() * wallpapers.length)]
		if (user.pass) {
			delete user.pass
			try {
				var feeds = []

				if (user.pages.length === 0) {
					feeds = await mongodb.collection(schema.collections.feeds).find({})
					.sort({ publishedAt: -1 })
					.limit(10)
					.toArray()
				} else {
					feeds = await mongodb.collection(schema.collections.feeds).find({
						idpage: { $in: user.pages }
					})
					.sort({ publishedAt: -1 })
					.limit(10)
					.toArray()
				}
				
				return res.render(schema.templates.feeds, { user, feeds, feed: false })
				
			} catch (err) {
				return res.sendStatus(500)
			}
		} else {
			const categories = await getCategories(cache, mongodb, schema)
			const redisClient = await cache('getRedis')
			var pages = await new Promise(rsv => {
				redisClient.keys('*index*', async function (err, keys) {
					if (err || keys.length === 0) {
						rsv(await getPagesByCategories(categories, mongodb, cache, schema, settings))
					} else {
						var pgs = await Promise.all(keys.map(key => {
							return new Promise(resolve => {
								redisClient.get(key, (err, data) => {
									if (data) resolve(JSON.parse(data))
									else resolve({})
								})
							})
						}))
						rsv(await pgs.filter(page => {
							return page.ref
						}).sort((a, b) => {
							return a.feedbackDate > b.feedbackDate ? -1 : 1
						}))
					}
				})
			})
			await res.render(schema.templates.indexWithLogin, {
				wallpaper,
				categories,
				pages,
				user
			})
		}
	})

	app.get('/index/pages', async (req, res) => {
		const {
			limit,
			skip,
			categorie
		} = req.query
		const categories = await getCategories(cache, mongodb, schema)
		const pages = await mongodb.collection(schema.collections.pages)
			.find({
				$and: [{
					removed: {
						$not: {
							$eq: true
						}
					}
				}, {
					categories: { $in: [categorie] }
				}, {
					avatar: { $not: { $eq: '' } }
				}, {
					avatar: { $not: { $eq: null } }
				}]
			})
			.project({
				avatar: 1,
				cover: 1,
				miniavatar: 1,
				ref: 1,
				feedbackDate: 1,
				title: 1,
				nickname: 1,
				categories: 1,
				wiki: 1,
				url: 1,
				id: 1
			})
			.sort({ feedbackDate: -1 })
			.skip(parseInt(skip)).limit(parseInt(limit))
			.map(function (page) { return formatPage(page, settings, categories) }).toArray()
		await res.send({
			pages,
			hasNext: pages.length === parseInt(limit)
		})
	})

	app.post('/savecategories', (req, res) => {
		const { page, categories } = req.body
		mongodb.collection(schema.collections.pages).updateOne(
			{ ref: page.ref },
			{ $set: { 'categories': categories } },
			{ upsert: true }).then(async () => {
				const p = await cache("page", page.url)
				p.categories = await categories
				await cache("page", p.url, p,'inHour')
				await res.send(categories)
			}).catch((err) => {
				console.log(err)
				res.sendStatus(500)
			})
	})

}

async function getPagesByCategories (categories, db, cache, schema, settings) {
	const pages = []
	await Promise.all(categories.map(async cat => {
		return new Promise(async resolve => {
			const _pages = await getPage(cat.text, db, cache, schema, categories, settings)
			await Promise.all(_pages.map(p => {
				if(pages.every(_p => _p.ref != p.ref)) {
					pages.push(formatPage(p, settings, categories))
				}
			}))
			resolve()
		})
	}))
	return pages
}


async function getPage (categorie, mongodb, cache, schema, categories, settings) {
	return await mongodb.collection(schema.collections.pages)
		.find({
			$and: [{
				removed: {
					$not: {
						$eq: true
					}
				}
			}, {
				categories: { $in: [categorie] }
			}, {
				avatar: { $not: { $eq: '' } }
			}, {
				avatar: { $not: { $eq: null } }
			}]
		})
		.project({
			avatar: 1,
			miniavatar: 1,
			ref: 1,
			feedbackDate: 1,
			title: 1,
			nickname: 1,
			categories: 1,
			wiki: 1,
			url: 1,
			id: 1
		})
		.sort({ feedbackDate: -1 })
		.limit(12)
		.map(function (page) {
			return formatPage(page, settings, categories, cache)
		}).toArray()
}

function checkCategories (categories, pageCategories) {
	if (pageCategories) {
		if (categories.some(cat => pageCategories.includes(cat.text))) {
			return pageCategories
		}
	}
	return ['Sem Categoria']
}

function getSumary (wiki) {
	if (wiki) if(wiki.summary) return wiki.summary
	else return ''
}

function getCategories (cache, mongodb, schema) {
	return new Promise(resolve => {
		cache("manager", "categories").then(categories => {
			categories.push({ text: 'Sem Categoria' })
			resolve(categories)
		}).catch(async () => {
			var categories
			try {
				categories = await mongodb.collection(schema.collections.categories).find({
					deleted: {
						$not: {
							$eq: true
						}
					}
				}).toArray()
				await cache("manager", "categories", categories)
			} catch (err) {
				categories = await []
			}
			categories.push({ text: 'Sem Categoria' })
			await resolve(categories)
		})
	})
}

function formatPage (page, settings, categories, cache) {
	page.miniavatar = page.miniavatar !== undefined ? settings.url + "/image/" + page.url + "/miniavatar.jpg" : settings.url + '/assets/img/avatardefault.jpeg'
	page.avatar = page.avatar !== undefined ? settings.url + "/image/" + page.url + "/avatar.jpg" : settings.url + '/assets/img/default_cover.jpg'
	page.nickname = page.nickname ? page.nickname : ''
	page.categories = checkCategories(categories, page.categories)
	page.summary = getSumary(page.wiki)
	if (cache) cache('index', page.ref, page, 'inFiveMinutes')
	return page
}
