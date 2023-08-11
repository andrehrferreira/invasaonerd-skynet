/**
 * Criação de paginas
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 */

"use strict";

module.exports = (parses, app, mongodb, i18n, passport, schema, wallpapers, cache) => {

	app.use(schema.routes.managerCategories, function (req, res, next) {
		var {
			user
		} = req
		if (user) {
			if (user.superadmin) next()
			else res.redirect('/')
		} else {
			res.redirect('/')
		}
	})

	app.get(schema.routes.managerCategories, (req, res) => {
		const { user } = req
		if (user) delete user.pass
		cache("manager", "categories").then(categories => {
			res.render(schema.templates.managerCategories, {
				categories, user
			})
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
			await res.render(schema.templates.managerCategories, {
				categories, user
			})
		})
	})

	app.get(schema.routes.crudCategories, (req, res) => {
		cache("manager", "categories").then(categories => {
			res.send(categories)
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
			await res.send(categories)
		})
	})

	app.post(schema.routes.crudCategories, (req, res) => {
		const { categorie } = req.body
		if (categorie._id) delete categorie._id
		mongodb.collection(schema.collections.categories).updateOne({
			text: categorie.text
		}, {
			$set: categorie
		}, {
			upsert: true
		}).then(async () => {
			await cache("manager", "categories").then(categories => {
				if (categories.some(cat => cat.date === categorie.date)) {
					categories = categories.map(cat => {
						if (cat.date === categorie.date) return categorie
						return cat
					}).filter(cat => {
						return !cat.deleted
					})
				} else {
					categories.push(categorie)
				}				
				cache("manager", "categories", categories)
				res.send({ categories })
			})
			.catch(() => {
				cache("manager", "categories", [categorie])
				res.send({ categories: [categorie] })
			})
		}).catch((err) => {
			res.sendStatus(404)
		})
	})

}
