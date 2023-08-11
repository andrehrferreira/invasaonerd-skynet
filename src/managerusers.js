/**
 * Criação de paginas
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 */

"use strict";

module.exports = (parses, app, mongodb, i18n, passport, schema, wallpapers, cache) => {

	app.use(schema.routes.managerusers, function (req, res, next) {
		var { user } = req;

		if (user) {
			if (user.superadmin) next()
			else res.redirect('/')
		} else {
			res.redirect('/')
		}
	})

	app.get(schema.routes.managerusers, (req, res) => {
		var { user } = req
		if (user) delete user.pass
		mongodb.collection(schema.collections.users).find().map(function (user) {
			if (user) delete user.pass
			return user
		}).toArray().then((users) => {
			cache("users", "", users, "inAday")
			res.render(schema.templates.managerusers, {
				users,
				user,
				
			})
		})
	})

	app.put(schema.routes.user, (req, res) => {
		var { user } = req.body
		delete user.rank
		if (user._id) delete user._id
		mongodb.collection(schema.collections.users).updateOne({
				email: user.email
			}, {
				$set: user
			}, {
				upsert: true
			})
			.then(() => {
				res.send({
					status: true
				})
			}).catch((error) => {
				res.send({
					status: false,
					message: 'Ocorreu um erro no servidor'
				})
				return
			})
	})

	// app.get(schema.routes.getusers, (req, res) => {
	//   const page = parseInt(req.query.page) - 1
	//   const size = parseInt(req.query.size)
	//   mongodb.collection(schema.collections.users).find().skip(page * size).limit(size)
	//   .map(function(user) {
	//     if (user) delete user.pass
	//     return user
	//   }).toArray().then((users) => {
	//     res.send({ "users": users })
	//   })
	// })
}
