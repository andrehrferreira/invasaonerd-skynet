/**
 * Criação de paginas
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 */

"use strict";

const objectId = require('mongodb').ObjectID

module.exports = (settings, app, mongodb, socket, schema, notify, cache) => {

	app.post(schema.routes.feeds, async (req, res) => {

		const { user, body } = req
		const { skip } = body

		try {
			var feeds = []
			if (user.pages.length === 0) {
				feeds = await mongodb.collection(schema.collections.feeds).find({})
				.sort({ publishedAt: -1 })
				.skip(parseInt(skip))
				.limit(10)
				.toArray()
			} else {
				feeds = await mongodb.collection(schema.collections.feeds).find({
					idpage: { $in: user.pages }
				})
				.sort({ publishedAt: -1 })
				.skip(parseInt(skip))
				.limit(10)
				.toArray()
			}
			res.json(feeds)
		} catch (err) {
			res.sendStatus(500)
		}

	})

	app.post(schema.routes.feeds + '/getcomment', async (req, res) => {

		try {

			const { feedId, limit, skip, order } = req.body

			const sort = {
				relevance: { likes: 1 },
				news: { timestamp: -1 },
				all: { timestamp: 1 }
			}[order]

			const cursor = mongodb.collection(schema.collections.comments).find({ feedId }).sort(sort).limit(limit).skip(skip)

			const comments = await cursor.toArray()

			res.json({ status: true, comments })

		} catch (err) {
			res.sendStatus(500)
		}

	})

	app.post(schema.routes.feeds + '/comment', async (req, res) => {

		try {
			const { feedId, comment, quant } = req.body

			if (quant !== 0) {
				const feedQuery = { _id: objectId(feedId) }
				var feedSet = { $inc: { commentsCount: quant } }
				await mongodb.collection(schema.collections.feeds).updateOne(feedQuery, feedSet)
			}

			const commentQuery = { _id: objectId(comment._id) }

			var finish = { }
			const date = new Date().getTime()
			if (quant === 1) {
				comment.timestamp = date
				finish = await mongodb.collection(schema.collections.comments).insertOne(comment)
				if (finish.result.ok && comment.isReply) {
					notify.user(comment.reply.user.id, {
						new: true,
            clicked: false,
            href: `${settings.url}/post/${feedId}`,
            image: `/image/${comment.user.id}/useravatar.jpg`,
            message: `${comment.user.name} respondeu a um comentário seu`,
            category: 'post-comment',
            timestamp: new Date().getTime()
					}, mongodb, schema, socket)
				}
			} else if (quant === -1) {
				finish = await mongodb.collection(schema.collections.comments).deleteOne(commentQuery)
			} else {
				comment.editedtimestamp = date
				comment.edited = true
				const commentSet = {
					$set: {
						text: comment.text,
						editedtimestamp: comment.editedtimestamp,
						edited: comment.edited
					}
				}				
				finish = await mongodb.collection(schema.collections.comments).updateOne(commentQuery, commentSet)
			}

			const response = { status: finish.result.ok }
			if (finish.insertedId) {
				response.date = date
				response._id = finish.insertedId.toHexString()
			} else if (finish.modifiedCount) {
				response.editedtimestamp = date
				response.edited = true
			}
			socket.emit(`feed-comment-${feedId}`, { response, quant, comment, body: req.body })
			res.send(response)

		} catch (err) {
			res.sendStatus(500)
		}
	})

	app.post(schema.routes.feeds + '/react', async (req, res) => {

		try {
			const { user, body } = req
			const { feedId, like, firstTime } = body
			const { _id } = user

			const query = { _id: objectId(feedId) }
			var set = {  }

			if (firstTime) {
				set = { $set: { likes: [_id] } }
			} else if (like) {
				set = { $push: { likes: _id } }
			} else {
				set = { $pull: { likes: { $in: [_id] } } }
			}

			const { result } = await mongodb.collection(schema.collections.feeds).updateOne(query, set)

			res.send({ status: result.ok })

		} catch (err) {
			res.sendStatus(500)
		}
	})

	app.post(schema.routes.feeds + '/share', async (req, res) => {

		try {
			const { feedId, type } = req.body

			const query = { _id: objectId(feedId) }
			var set = { $inc: { shares: 1 } }

			const { result } = await mongodb.collection(schema.collections.feeds).updateOne(query, set)

			res.send({ status: result.ok })

		} catch (err) {
			res.sendStatus(500)
		}
	})

	app.post(schema.routes.feeds + '/reply', async (req, res) => {

		const { feedId, replies, _id } = req.body
		
		try {
			const { modifiedCount } = await mongodb.collection(schema.collections.comments).updateOne({
				_id: objectId(_id)
			}, {
				$set: { replies }
			})
			if (modifiedCount) {
				socket.emit(`feed-comment-${feedId}`, { reply: { _id, replies } })
				res.sendStatus(200)
			} else {
				res.json({ error: 'O comentário que você tentou responder foi apagado' })
			}
			res.send(200)
		} catch (err) {
			console.log(err)
		}
	})

}