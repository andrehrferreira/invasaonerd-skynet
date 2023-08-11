/**
 * Criação de paginas
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 */

"use strict"

module.exports = (_this, parses, app, mongodb, i18n, passport, schema, wallpapers, cache) => {

	app.use(schema.routes.createPage, function (req, res, next) {
		const {
			user
		} = req
		if (!user) {
			return res.redirect('/')
		}
		return next()
	})

	app.get('/editpage/:ref', (req, res) => {
		const { user, params, mode } = req
		if (user) delete user.pass
		const { ref } = params
		const page = { ref, local: true }
		res.render(schema.templates.page, {
			page,
			user,
			mode,
			order: { void: true }
		})
	})

	app.get(schema.routes.createPage, async (req, res) => {
		var { user } = await req
		const { title } = await req.query
		if (user) await delete user.pass
		const categories = await getCategories(cache, mongodb, schema)
		await res.render(schema.templates.createPage, {
			ref: new Date().getTime(),
			title: title ? decodeURI(title) : '',
			categories: categories,
			user: user ? user : {
				admin: false,
				name: ''
			}
		})
	})

	app.post('/check-page-names', (req, res) => {
		const { title, nickname, englishTitle } = req.body
		cache("search-pages", false).then(searchPages => {
			const find = searchPages.filter(page => {
				const findTitle = page.title.toLowerCase() === title.toLowerCase()
				const findNickname = page.nickname && nickname ? page.nickname.toLowerCase() === nickname.toLowerCase() : false
				const findEnglishTitle = page.englishTitle && englishTitle? page.englishTitle.toLowerCase() === englishTitle.toLowerCase() : false
				const findUrl = page.url === title.split(' ').join('-')
				return findTitle || findNickname || findEnglishTitle || findUrl
			})
			if (find.length) {
				var message
				if (find[0].title.toLowerCase() === title.toLowerCase() || find[0].url === title.split(' ').join('-')) message = 'Título'
				else if (find[0].nickname && find[0].nickname.toLowerCase() === nickname.toLowerCase()) message = 'Subtítulo'
				else message = 'Título Original'
				res.send({
					status: false,
					message: `Já existe um ${message} com este nome`
				})
			}
			else res.send({ status: true })
		}).catch((err) => {
			mongodb.collection(schema.collections.pages).findOne({
				$and: [{
					$or: [{
						title: new RegExp(["^", title, "$"].join(""), "i")
					}, {
						nickanem: new RegExp(["^", nickname, "$"].join(""), "i")
					}, {
						englishTitle: new RegExp(["^", englishTitle, "$"].join(""), "i")
					}]
				}, {
					removed: { $not: { $eq: true } }
				}]
			}, (err, page) => {
				if (err) {
					res.send({ error: true })
				} else if (page) {
					cache("search-pages", false, [{
						title: page.title,
						nickname: page.nickname ? page.nickname : '',
						englishTitle: page.englishTitle ? page.englishTitle : '',
						url: page.url,
						ref: page.ref
					}])
					var message
					if (page.title.toLowerCase() === title.toLowerCase()) message = 'Título'
					else if (page.nickname && nickname && page.nickname.toLowerCase() === nickname.toLowerCase()) message = 'Subtítulo'
					else message = 'Título Original'
					res.send({
						status: false,
						message: `Já existe um ${message} com este nome`
					})
				} else {
					cache("search-pages", false, [])
					res.send({ status: true })
				}
			})
    })
	})

}

function getCategories (cache, mongodb, schema) {
	return new Promise(resolve => {
		cache("manager", "categories").then(categories => {
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
			await resolve(categories)
		})
	})
}