/**
 * Criação de paginas
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 */

"use strict";

const ObjectID = require('mongodb').ObjectID

module.exports = (_this, parses, app, mongodb, i18n, passport, schema, wallpapers, cache) => {

	app.use(schema.routes.pageLogs, function(req, res, next) {
		if (req.user) {
			if (req.user.admin) {
				next()
			} else {
				res.redirect('/')
			}
		} else {
			res.redirect('/')
		}
	})

	app.get(schema.routes.pageLogs, (req, res) => {
		const ref = parseInt(req.params.ref)
		var { user } = req
		if (user) delete user.pass
		else user = { admin: false, name: '' }
		mongodb.collection(schema.collections.logs).findOne({
			name: ref
		}).then(log => {
			if (log) {
				delete log._id
				log.ref = ref
				res.render(schema.templates.logs, {
					log: log,
					user: user
				})
			} else {
				res.redirect('/page/' + ref)
			}
		})
	})

	app.get(schema.routes.pageLog, (req, res) => {
		var { user } = req
		if (user) delete user.pass
		else user = { admin: false, name: '' }
		mongodb.collection(schema.collections.revisions).findOne({
			_id: ObjectID(req.params._id)
		}, (err, page) => {
			if (page) {
				res.render(schema.templates.page, {
					page: page,
					user: user
				})
			} else {
				res.redirect(schema.routes.index)
			}
		})
	})

	app.post(schema.routes.logRollback, (req, res) => {
		let page = req.body
		mongodb.collection(schema.collections.logs).findOne({
				name: page.ref
			})
			.then((resLogs) => {
				let logs = resLogs ? resLogs.logs : []
				logs.push({
					timestamp: new Date().getTime(),
					revisionRef: page._id,
					userEditor: page.user,
					userAprovator: page.aprovator,
					action: 'Pagina recuperada',
					anchor: page._id
				})
				delete page.aprovator
				delete page._id
				mongodb.collection(schema.collections.revisions)
					.updateOne({
						editRef: page.editRef,
						status: "rollback"
					}, {
						$set: page
					}, {
						upsert: true
					})
					.then(() => {
						mongodb.collection(schema.collections.logs).updateOne({
								name: page.ref
							}, {
								$set: {
									logs: logs
								}
							}, {
								upsert: true
							})
							.then(() => {
								for (let key in page) {
									if (key === '_id' || key === 'aprovator' ||
										key === 'editDate' || key === 'editRef' ||
										key === 'status' || key === 'user' || key === 'originalRef') {
										delete page[key]
									}
								}
								if (page.cover) if (page.cover.includes('/cover.jpg')) delete page.cover
								if (page.avatar) if (page.avatar.includes('/avatar.jpg')) delete page.avatar
								if (page.miniavatar) if (page.miniavatar.includes('/miniavatar.jpg')) delete page.miniavatar
								mongodb.collection(schema.collections.pages).updateOne({
										ref: page.ref
									}, {
										$set: page
									}, {
										upsert: true
									})
									.then(() => {
										cache("page", page.url, page, 'inHour')
										res.sendStatus(200)
									})
							})
					})
			})
	})
}
