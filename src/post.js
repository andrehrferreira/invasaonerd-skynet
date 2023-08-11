/**
 * Criação de paginas
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 */

"use strict";

const objectId = require('mongodb').ObjectID

module.exports = (settings, app, mongodb, socket, schema, notify, cache, pushToFeed) => {

	app.use(schema.routes.post, async (req, res, next) => {
		const { postId } = req.params
		if (postId) {
			try {
				const feed = await mongodb.collection(schema.collections.feeds).findOne({ _id: objectId(postId) })
				if (feed) {
					req.feed = feed
					return next()
				}
			} catch (err) {
				console.log(err)
			}
		}
		return res.redirect(schema.routes.index)
	})

	app.get(schema.routes.post, async (req, res) => {
		var { feed, user } = req
		if (user) delete user.pass
		else user = {}
		return res.render(schema.templates.feeds, { feed, feeds: [], user })
	})

	app.get(schema.routes.default, (req, res) => {
		res.redirect(schema.routes.index)
	})

}