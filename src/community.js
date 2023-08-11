/**
 * Criação de paginas
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 */

"use strict";
const ObjectID = require('mongodb').ObjectID

module.exports = (_this, parses, app, mongodb, i18n, settings, schema, gmailSend, cache, SEO, notify, socket) => {

	//#MIDDLEWARES
	app.use(schema.routes.community, function(req, res, next) {
		const { originalUrl } = req
		if (originalUrl.includes('%20') && req.method === 'GET') {
			const string = originalUrl.split('%20').join('-')
			const newUrl = string.toLowerCase()
			return res.redirect(newUrl)
		} else if (originalUrl !== originalUrl.toLowerCase()) {
			return res.redirect(originalUrl.toLowerCase())
		}
		return next()
	})

	//#GETS
	app.get(schema.routes.community, async (req, res) => {
		var { user, params, query } = await req
		if (user) await delete user.pass
		else user = await { admin: false, name: '' }
		const ref = await decodeURI(params.ref).toLowerCase()
		var { p } = await query
		p = await parseInt(p)
		var skip = 0
		if (p) if (p > 1) skip = (p - 1) * 10
		else p = 1
		try {
			const page = await cache("page", ref)
			const topics = await getTopics(mongodb, page.ref, schema, cache, p * 10, skip)
			if (!page.removed) {
				if (topics.length && (p > (topics.length % 10 === 0 ? parseInt(topics.length / 10) : parseInt(topics.length / 10) + 1)) || !p) {
					await res.redirect(`/page/${page.url}/community?p=1`)
				}
				else await res.render(schema.templates.community, {
					page: parses.parsePage(page, settings), user, topics, answers: '',
					breadcrumb: SEO.breadCrumbs.community(settings, page.url, page.title), topic: {}
				})
			} else {
				await cache("page", ref, false, false, 'delete')
				await res.redirect(schema.routes.nomatch + '/' + page.title)
			}
		} catch (err) {
			try {
				const searchPages = await cache("search-pages", false)
				var find = await []
				find = await searchPages.filter(page => {
					const findTitle = page.title.toLowerCase() === ref.split('-').join(' ')
					const findNickname = page.nickname ? page.nickname.toLowerCase() === ref.split('-').join(' ') : false
					const findEnglishTitle = page.englishTitle ? page.englishTitle.toLowerCase() === ref.split('-').join(' ') : false
					const findUrl = page.url === ref
					return (findTitle || findNickname || findEnglishTitle || findUrl) && (find.length === 0)
				})
				if (find.length) {
					const page = await find[0]
					if ((ref.split('-').join(' ') === page.nickname.toLowerCase() ||
						ref.split('-').join(' ') === page.englishTitle.toLowerCase())) {
						await res.redirect('/page/' + page.url + '/community?p=1')
					} else {
						await findPageOnDb(ref, mongodb, cache, schema, res)
					}
				} else {
					await findPageOnDb(ref, mongodb, cache, schema, res)
				}
			} catch (err) {
				await cache("search-pages", false, [])
				await res.redirect('/page/' + req.params.ref + '/community?p=1')
			}
		}
	})

	app.get(schema.routes.topic, async (req, res) => {
		var { user, params, query, headers } = await req
		if (user) await delete user.pass
		else user = await { admin: false, name: '' }
		const ref = await decodeURI(params.page).toLowerCase()
		const topicId = await parseInt(params.topic.split('_')[params.topic.split('_').length - 1])
		var { p } = await query
		p = await parseInt(p)
		if (!p) return await res.redirect(`/page/${ref}/community/${params.topic}?p=1`)
		var skip = await 0
		if (p > 1) skip = await (p - 1) * 10
		const { referrer, referer } = await headers
		const reference = await (referrer || referer) || '/'
		try {
			var page, topics, topic
			try {
				page = await cache("page", ref)
			} catch (err) {
				page = await mongodb.collection(schema.collections.pages).findOne({ $and: [{ removed: { $not: { $eq: true } }}, { url: ref }] })
			}			
			try {
				topics = await cache("community", "topics-" + page.ref)
				if (!topics.length) {
					const { list } = await getTopics(mongodb, page.ref, schema, cache, false, -1)
					topics = await list
				}
			} catch (err) {
				const { list } = await getTopics(mongodb, page.ref, schema, cache, false, -1)
				topics = await list
			}
			topic = await topics.filter(t => t._id === topicId)[0]
			if (topic) {
				const answers = await getAnswers(mongodb, schema, cache, topic._id, p * 10, skip)
				if (!page.removed) {
					if (answers.length && (p > (answers.length % 10 === 0 ? parseInt(answers.length / 10) : parseInt(answers.length / 10) + 1)) || !p) {
						await res.redirect(`/page/${page.url}/community/${params.topic}?p=1`)
					}
					else {
						answers.list = await getUserInfos(answers.list, mongodb, schema, cache)
						await res.render(schema.templates.community, {
							page: parses.parsePage(page, settings), user, answers, topics: false,
							breadcrumb: SEO.breadCrumbs.answers(settings, page.url, page.title, topic.title, params.topic), topic: topic
						})
					}
				} else {
					await cache("page", ref, false, false, 'delete')
					await res.redirect(schema.routes.nomatch + '/' + page.title)
				}
			} else {
				await res.redirect(reference)
			}
		} catch (err) {
			try {
				const searchPages = await cache("search-pages", false)
				var find = await []
				find = await searchPages.filter(page => {
					const findTitle = page.title.toLowerCase() === ref.split('-').join(' ')
					const findNickname = page.nickname ? page.nickname.toLowerCase() === ref.split('-').join(' ') : false
					const findEnglishTitle = page.englishTitle ? page.englishTitle.toLowerCase() === ref.split('-').join(' ') : false
					const findUrl = page.url === ref
					return (findTitle || findNickname || findEnglishTitle || findUrl) && (find.length === 0)
				})
				if (find.length) {
					const page = await find[0]
					if ((ref.split('-').join(' ') === page.nickname.toLowerCase() ||
						ref.split('-').join(' ') === page.englishTitle.toLowerCase())) {
						await res.redirect(`/page/${page.url}/community/${params.topic}?p=1`)
					} else {
						await findPageOnDb(ref, mongodb, cache, schema, res, parses, settings, user, answers, p)
					}
				} else {
					await findPageOnDb(ref, mongodb, cache, schema, res, parses, settings, user, answers, p)
				}
			} catch (err) {
				await cache("search-pages", false, [])
				await res.redirect(`/page/${ref}/community/${params.topic}?p=1`)
			}
		}
	})

	app.get(schema.routes.topics, async (req, res) => {
		var { p, ref, skip } = await req.query
		if (p > 1) skip = (p - 1) * 10
		else skip = 0
		const { list } = await getTopics(mongodb, ref, schema, cache, p * 10, skip)
		res.send({ list })
	})

	app.get(schema.routes.comments, async (req, res) => {
		var { p, ref, skip } = await req.query
		if (p > 1) skip = (p - 1) * 10
		else skip = 0
		const { list } = await getAnswers(mongodb, schema, cache, ref, p * 10, skip)
		res.send({ list: await getUserInfos(list, mongodb, schema, cache) })
	})

	app.get('/check/:topicId/comment/:id', async (req, res) => {
		const { id, topicId } = await req.params
		var comment
		try {
			const topicComments = await cache("community", "answers-" + topicId)
			const cachedComment =  await topicComments.filter(c => c._id === id)
			if (cachedComment.length) comment = await cachedComment[0]
		} catch (err) {
			try {
				comment = await mongodb.collection(schema.collections.answers).findOne({
					$and: [{
						_id: id
					}, {
						delete: { $not: { $eq: true } }
					}, {
						removed: { $not: { $eq: true } }
					}]
				})
			} catch (err) {
				console.log(err)
			}
		}
		await res.send(comment)
	})

	//#POSTS
	app.post(schema.routes.topics, async (req, res) => {
		const { topic, comment } = await req.body
		const error = { status: false }
		const now =  await new Date().getTime()
		topic._id = await now
		comment._id = await now
		comment.topicId = await now
		try {
			await mongodb.collection(schema.collections.topics).insertOne(topic)
			await mongodb.collection(schema.collections.answers).insertOne(comment)

			notify.usersPages({
				new: true,
				clicked: false,
				pageId: topic.pageId,
				href: `${settings.url}/page/${comment.pageUrl}/community/${topic.title}_${comment.topicId}?p=1`,
				image: settings.url + '/assets/img/chat.png',
				message: `A página ${topic.pageTitle} tem um novo tópico, confira!`,
				category: 'community',
				timestamp: new Date().getTime()
			}, mongodb, schema, socket)

		} catch (err) {
			console.log(err)
			error.status = true
		}
		if (!error.status) {
			try {
				await cache("community", "answers-" + topic._id, [comment])
				const communityTopics = await cache("community", "topics-" + topic.pageRef)
				await communityTopics.unshift(topic)
				await cache("community", "topics-" + topic.pageRef, communityTopics, 'inHour')
			} catch (err) {
				const { list } = await getTopics(mongodb, topic.pageRef, schema, cache, false, -1)
				if (list.length) {
					await list.unshift(topic)
					await cache("community", "topics-" + topic.pageRef, list, 'inHour')
				} else {
					await cache("community", "topics-" + topic.pageRef, [topic], 'inHour')
				}
			}
		}
		await res.send({ error: error.status, topic })
	})

	app.post(schema.routes.comments, async (req, res) => {
		const { comment } = await req.body
		const error = { status: false }
		const now =  await new Date().getTime()
		comment._id = await now
		try {
			await mongodb.collection(schema.collections.topics).updateOne({
				_id: comment.topicId
			}, {
				$inc: { comments: 1 }
			}, {
				upsert: true
			})
			await mongodb.collection(schema.collections.answers).insertOne(comment)
		} catch (err) {
			console.log(err)
			error.status = true
		}
		if (!error.status) {
			try {
				var communityTopics = await cache("community", "topics-" + comment.pageRef)
				communityTopics = await communityTopics.map(topic => {
					if (topic._id === comment.topicId) {
						topic.comments += 1
					}
					return topic
				})
				await cache("community", "topics-" + comment.pageRef, communityTopics, 'inHour')

				const comments = await cache("community", "answers-" + comment.topicId)
				await comments.push(comment)
				await cache("community", "answers-" + comment.topicId, comments, 'inHour')
			} catch (err) {
				const { list } = await getAnswers(mongodb, schema, cache, comment.topicId, false, -1)
				if (list.length) {
					await list.push(comment)
					await cache("community", "answers-" + comment.topicId, list, 'inHour')
				} else {
					await cache("community", "answers-" + comment.topicId, [comment], 'inHour')
				}
			}
			if (comment.reply._id && comment.reply.authorId !== comment.authorId) {
				await notify.user(comment.reply.authorId, {
					new: true,
					clicked: false,
					href: `${settings.url}/page/${comment.pageUrl}/community/${comment.topicTitle}_${comment.topicId}?p=${comment.page}&ref=${comment._id}`,
					image: settings.url + comment.authorAvatar,
					message: `${comment.authorName} respondeu ao seu comentário no tópico "${comment.topicTitle}"`,
					category: 'community',
					timestamp: new Date().getTime()
				}, mongodb, schema, socket)
			}
			if (comment.authorId !== comment.topicAuthorId) {
				await notify.user(comment.topicAuthorId, {
					new: true,
					clicked: false,
					href: `${settings.url}/page/${comment.pageUrl}/community/${comment.topicTitle}_${comment.topicId}?p=${comment.page}&ref=${comment._id}`,
					image: settings.url + comment.authorAvatar,
					message: `${comment.authorName} comentou no seu tópico "${comment.topicTitle}"`,
					category: 'community',
					timestamp: new Date().getTime()
				}, mongodb, schema, socket)
			}
		}
		await res.send({ error: error.status, comment })
	})

	app.post(schema.routes.comments + '/report', async (req, res) => {
		const { report } = req.body
		const { answer, comment } = report

		var html = ``
		if (answer) {
			html = `<h1>Denuncia de comentário</h1>
			<p>
				O usuário <b>${report.user}</b> denunciou o seguinte comentário do usuário <b>${answer.author.email}</b> <br>
				Data: ${new Date().toLocaleString()} <br>
				Categoria de Denuncia: ${report.categorie}
			</p>
			<p>
				Descrição da denuncia: <b><i>${report.text}</i></b>
			</p>
			<p>
				Comentário denunciado: <b><i>${answer.comment}</i></b>
			</p>
			<p>
				<a href="${settings.url}/page/${answer.pageUrl}/community/${answer.topicTitle}_${answer.topicId}?p=${report.pageRef}&ref=${answer._id}" target="_blank">
					VISUALIZAR
				</a>
			</p>
		`
		} else if (comment) {
			html = `<h1>Denuncia de comentário</h1>
			<p>
				O usuário <b>${report.user}</b> denunciou o seguinte comentário do usuário <b>${comment.user.name}</b> (${comment.user.id}) <br>
				Data: ${new Date().toLocaleString()} <br>
				Categoria de Denuncia: ${report.categorie}
			</p>
			<p>
				Descrição da denuncia: <b><i>${report.text}</i></b>
			</p>
			<p>
				Comentário denunciado: <b><i>${comment.text}</i></b>
			</p>
			<p>
				<a href="${settings.url}/post/${comment.feedId}" target="_blank">
					VISUALIZAR
				</a>
			</p>
		`
		}
		try {
			const response = await gmailSend.sendMail({
				to:		schema.email.adminEmails,
				from:	schema.email.user,
				subject: schema.email.subjects.report + ': ' + report.categorie,
				html
			})
			res.sendStatus(200)
		} catch (err) {
			res.sendStatus(500)
		}
	})

	//#DELETS
	app.post(schema.routes.comments + '/delete', async (req, res) => {
		try {
			var { comment, action } = await req.body
			var error = await false
			if (action === 'deleted') comment.deleted = await true
			else comment.removed = await true
			await mongodb.collection(schema.collections.topics).updateOne({
				_id: comment.topicId
			}, {
				$inc: { comments: -1 }
			}, {
				upsert: true
			})
			await mongodb.collection(schema.collections.answers).updateOne({
				_id: comment._id
			}, {
				$set: comment
			}, {
				upsert: true
			})
			if (comment.removed) {
				await notify.user(comment.authorId, {
					new: true,
					clicked: false,
					href: `/page/${comment.pageUrl}/community/${comment.topicTitle}_${comment.topicId}?p=${comment.page}&ref=${comment._id}`,
					image: settings.url + '/assets/img/warning.png',
					message: `Seu comentário no tópico "${comment.topicTitle}" foi removido por um administrador`,
					category: 'community',
					timestamp: new Date().getTime()
				}, mongodb, schema, socket)
			}
			try {
				await cache("community", "topics-" + comment.pageRef, false, false, 'delete')
			} catch (err) {}
			try {
				await cache("community", "answers-" + comment.topicId, false, false, 'delete')
			} catch (err) {}
		} catch (err) {
			error = await err
		}
		await res.send({ error })
	})

	app.delete(schema.routes.topics, async (req, res) => {
		var { topic } = await req.query
		var error = await false
		topic = await JSON.parse(decodeURI(topic))
		try {
			await mongodb.collection(schema.collections.topics).updateOne({
				_id: topic._id
			}, {
				$set: { deleted: true }
			}, {
				upsert: true
			})
			await notify.user(topic.authorId, {
				new: true,
				clicked: false,
				href: `${settings.url}/page/${topic.pageUrl}/community?p=1`,
				image: settings.url + '/assets/img/warning.png',
				message: `Seu tópico "${topic.title}" foi apagado pelo Administrador ${req.user.user}`,
				category: 'community',
				timestamp: new Date().getTime()
			}, mongodb, schema, socket)
			try {
				await cache("community", "topics-" + topic.pageRef, false, false, 'delete')
			} catch (err) {}
		} catch (err) {
			error = err
		}
		await res.send({ error })
	})
}

function findPageOnDb(ref, mongodb, cache, schema, res) {
	mongodb.collection(schema.collections.pages).findOne({
		$and: [{
			$or: [{
				title: new RegExp(["^", ref, "$"].join(""), "i")
			}, {
				nickname: new RegExp(["^", ref, "$"].join(""), "i")
			}, {
				englishTitle: new RegExp(["^", ref, "$"].join(""), "i")
			}, {
				url: ref
			}]
		}, {
			removed: { $not: { $eq: true } }
		}]
	}, async (err, page) => {
			if(page){
				await cache("page", ref, page, 'inHour')
				const searchPages = await cache("search-pages", false)
				await searchPages.push({
					title: page.title,
					nickname: page.nickname ? page.nickname : '',
					englishTitle: page.englishTitle ? page.englishTitle : '',
					url: page.url,
					ref: page.ref
				})
				await cache("search-pages", false, searchPages)
				await res.redirect(`/page/${page.url}/community?p=1`)
			} else {
				res.redirect(schema.routes.nomatch + '/' + ref)
			}
	})
}

async function getTopics(mongodb, ref, schema, cache, limit, skip) {
	var topics = await []
	try {
		topics = await cache("community", "topics-" + ref)
	} catch (err) {
		try {
			topics = await mongodb.collection(schema.collections.topics).find({
				$and: [{
					deleted: {
						$not: { $eq: true }
					}
				}, {
					pageRef: ref
				}]
			})
			.sort({ lastUpdate: -1 })
			.toArray()
			await cache("community", "topics-" + ref, topics)
		} catch (err) {
			console.log(err)
		}
	}
	const ret = await {
		list: limit ? topics.filter((t, i) => {
			return i >= skip && i < limit
		}) : topics,
		length: topics.length
	}
	return await ret
}

async function getAnswers(mongodb, schema, cache, topicId, limit, skip) {
	var answers = await []
	try {
		answers = await cache("community", "answers-" + topicId)
	} catch (err) {
		try {
			answers = await mongodb.collection(schema.collections.answers).find({
				$and: [{
					topicId: topicId
				}, {
					deleted: { $not: { $eq: true } }
				}]
			})
			.sort({ _id: 1 })
			.toArray()
			await cache("community", "answers-" + topicId, answers)
		} catch (err) {
			console.log(err)
		}
	}
	return await {
		list: limit ? answers.filter((t, i) => {
			return i >= skip && i < limit
		}) : answers,
		length: answers.length
	}
}

async function getUserInfos(answers, mongodb, schema, cache) {
	const usersId = await answers.map(a => ObjectID(a.authorId))
	const usersInfo = await mongodb.collection(schema.collections.users).find({
		_id: { $in: usersId }
	})
	.project({
		_id: 1,
		points: 1,
		name: 1,
		email: 1,
		admin: 1,
		superadmin: 1
	})
	.toArray()
	answers = await answers.map(answer => {
		const userInfo = usersInfo.filter(u => u._id.toHexString() === answer.authorId)[0]
		answer.author = userInfo
		return answer
	})
	return await answers
}