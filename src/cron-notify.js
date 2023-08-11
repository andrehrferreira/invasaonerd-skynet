/**
 * Criação de paginas
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 */

"use strict";

// const objectId = require('mongodb').ObjectID

module.exports = (settings, app, mongodb, socket, schema, notify, pushToFeed) => {

	app.post(schema.routes.notify, async (req, res) => {

		try {
			const { url, type, payload } = req.body
			const page = await mongodb.collection(schema.collections.pages).findOne({ url })

			const { title, id } = page
			const { tab, message, timestamp } = filterType(type)

			if (tab && message && timestamp) {
				const feedId = await pushToFeed(page, type, timestamp(payload), payload)
				notify.usersPages({
					new: true,
					clicked: false,
					pageId: id,
					href: `${settings.url}/${feedId ? 'post/' + feedId : 'page/' + url + tab}`,
					image: `${settings.url}/image/${url}/miniavatar.jpg`,
					message: message(title),
					category: type,
					timestamp: timestamp(payload)
				}, mongodb, schema, socket)
			} else {
				res.send({ status: false })
			}
			res.send({ status: true })
		} catch (err) {
			res.send({ status: false })
		}

	})

}

function filterType (type) {
	switch (type) {
		case 'youtube-video': return {
			tab: '?t=8&p=1',
			message: (title) => {
				return `A página ${title} tem um novo vídeo no Canal do Youtube`
			},
			timestamp: ({ publishedAt }) => {
				if (publishedAt) return new Date(publishedAt).getTime()
				return new Date().getTime()
			}
		}
		case 'instagram': return {
			tab: '?t=1&p=1',
			message: (title) => {
				return `A página ${title} tem uma nova atualização no Instagram`
			},
			timestamp: ({ taken_at_timestamp }) => {
				if (taken_at_timestamp) return new Date(taken_at_timestamp * 1000).getTime()
				return new Date().getTime()
			}
		}
		default: return {}
	}
}
