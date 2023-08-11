/**
 * Criação de paginas
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 */

"use strict";

const objectId = require('mongodb').ObjectID

module.exports = (parses, app, mongodb, i18n, passport, schema, wallpapers, cache) => {

	app.use(schema.routes.managerPages, function (req, res, next) {
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

	app.get(schema.routes.managerPages, async (req, res) => {
		var { user } = req
		delete user.pass
		var pages = await mongodb.collection(schema.collections.pages).find({}).toArray()
		pages = await Promise.all(pages.map(async function (page) {
			return await {
				ref: page.ref,
				feedbackDate: page.feedbackDate,
				title: page.title,
				nickname: page.nickname ? page.nickname : '',
				englishTitle: page.englishTitle ? page.englishTitle : '',
				categories: page.categories ? page.categories : [],
				id: page.id,
				url: page.url,
				removed: page.removed,
				editors: !page.editors ? [] : await Promise.all(page.editors.map(async editor => {
					try {
						const userInfos = await mongodb.collection(schema.collections.users).findOne({ _id: objectId(editor._id) })
						await delete userInfos.strikes
						await delete userInfos._id
						await delete userInfos.notifications
						await delete userInfos.pass
						await delete userInfos.pages
						return await { ...editor, ...userInfos }
					} catch (err) {
						console.log(err)
						return editor
					}
				}))
			}
		}))
		await res.render(schema.templates.managerPages, { pages, user })
	})
}
